import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from services.event_bus import event_bus

logger = logging.getLogger(__name__)

class WalletIntegrationService:
    """Handles integration between POS payments and the wallet system."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def credit_merchant_from_payment(self, payment_data: dict):
        """Credit the merchant's PHP wallet when a POS payment is completed."""
        try:
            user_id = payment_data.get("user_id", "")
            
            amount = payment_data.get("amount", 0) / 100.0 # Convert cents to PHP float
            order_id = payment_data.get("order_id")
            terminal_id = payment_data.get("terminal_id")

            if amount <= 0:
                logger.warning(f"Skipping wallet credit for payment {order_id}: Zero amount")
                return

            from services.wallets import WalletsService
            wallet_service = WalletsService(self.db)

            note = f"Sale from terminal {terminal_id} (Order: {order_id})"
            wallet = await wallet_service.credit_wallet(
                user_id=user_id,
                amount=amount,
                currency="PHP",
                transaction_type="terminal_sale",
                reference_id=order_id,
                note=note,
                is_available=True
            )

            await self.db.commit()

            # Publish wallet update event for real-time notifications
            try:
                event_bus.publish({
                    "event_type": "wallet_update",
                    "user_id": user_id,
                    "wallet_id": wallet.id,
                    "balance": wallet.balance,
                    "currency": "PHP",
                    "transaction_type": "terminal_sale",
                    "amount": amount,
                    "note": f"Terminal sale {order_id}",
                    "skip_bot_notify": True
                })
            except Exception:
                pass

            logger.info(f"Credited wallet of {user_id} with ₱{amount} from sale {order_id}")
            
        except Exception as e:
            logger.error(f"Failed to credit merchant wallet: {e}")
            await self.db.rollback()

async def handle_payment_completed(data: dict):
    """Event subscriber handler for payment completions."""
    from core.database import db_manager
    async with db_manager.async_session_maker() as db:
        service = WalletIntegrationService(db)
        await service.credit_merchant_from_payment(data)

# Register the sync handler
event_bus.subscribe("payment_completed", handle_payment_completed)
