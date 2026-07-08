import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models.transactions import Transactions
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from services.event_bus import payment_event_bus

from services.base import BaseService

logger = logging.getLogger(__name__)

PAYMENT_CREDIT_FEE_RATE = 0.005


# ------------------ Service Layer ------------------
class TransactionsService(BaseService[Transactions]):
    """Service layer for Transactions operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Transactions)

    async def create_transaction(
        self,
        user_id: str,
        transaction_type: str,
        amount: float,
        external_id: str = "",
        gateway_id: str = "",
        description: str = "",
        customer_name: str = "",
        customer_email: str = "",
        payment_url: str = "",
        status: str = "pending",
        currency: str = "PHP",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Transactions:
        """Create a new transaction record with consistent defaults."""
        now = datetime.now(timezone.utc)
        txn = Transactions(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            currency=currency,
            external_id=external_id,
            xendit_id=gateway_id,  # Using xendit_id column for gateway reference
            status=status,
            description=description,
            customer_name=customer_name,
            customer_email=customer_email,
            payment_url=payment_url,
            created_at=now,
            updated_at=now,
        )
        # Handle metadata if we ever add a metadata column to Transactions
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(txn)
        return txn

    async def get_or_create_wallet(self, user_id: str, currency: str = "PHP", lock: bool = False) -> Wallets:
        """Helper to get or create a user wallet with optional row locking."""
        query = select(Wallets).where(Wallets.user_id == user_id, Wallets.currency == currency)
        if lock:
            query = query.with_for_update()

        result = await self.db.execute(query)
        wallet = result.scalar_one_or_none()
        if wallet is None:
            now = datetime.now(timezone.utc)
            wallet = Wallets(user_id=user_id, currency=currency, balance=0.0, created_at=now, updated_at=now)
            self.db.add(wallet)
            await self.db.flush()
            if lock:
                # Re-fetch with lock
                return await self.get_or_create_wallet(user_id, currency, lock=True)
        return wallet

    async def credit_wallet_from_transaction(self, txn: Transactions, gateway_label: str = "Gateway") -> Wallets:
        """Credit the user's wallet (Maximizing automated T+0/T+1 logic)."""
        # Use row-level lock to prevent race conditions during balance update
        wallet = await self.get_or_create_wallet(txn.user_id, txn.currency or "PHP", lock=True)
        gross_amount = float(txn.amount or 0.0)
        fee_amount = round(gross_amount * PAYMENT_CREDIT_FEE_RATE, 2)
        amount = max(round(gross_amount - fee_amount, 2), 0.0)
        balance_before = float(wallet.balance or 0.0)

        # Logic for Automated Clearing:
        # Instant methods (QR, E-Wallet) go to available_balance (T+0)
        # Card payments often require T+1 clearing.
        is_instant = txn.transaction_type in ["qr_code", "ewallet", "qrph_payment", "zip_checkout"]

        if is_instant:
            wallet.available_balance += amount
        else:
            # Card / Invoice payments go to pending (T+1)
            wallet.pending_balance += amount

        wallet.balance = balance_before + amount
        wallet.updated_at = datetime.now(timezone.utc)

        wtxn = Wallet_transactions(
            user_id=txn.user_id,
            wallet_id=wallet.id,
            transaction_type="receive",
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            note=(
                f"{gateway_label} payment credited (gross={gross_amount:,.2f}, "
                f"fee={fee_amount:,.2f}, net={amount:,.2f}): "
                f"{txn.description or txn.transaction_type}"
            ),
            status="completed",
            reference_id=txn.external_id or txn.xendit_id or f"txn-{txn.id}",
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(wtxn)
        await self.db.flush()

        # Publish wallet update event
        try:
            payment_event_bus.publish({
                "event_type": "wallet_update",
                "user_id": txn.user_id,
                "wallet_id": wallet.id,
                "balance": wallet.balance,
                "currency": txn.currency or "PHP",
                "transaction_type": "receive",
                "amount": amount,
                "transaction_id": wtxn.id,
                "note": f"{gateway_label} payment received"
            })
        except Exception as e:
            logger.warning(f"Failed to publish wallet update event: {e}")

        return wallet

    async def mark_as_paid(self, txn: Transactions, gateway_label: str = "Gateway") -> bool:
        """Mark a transaction as paid and credit the wallet."""
        if txn.status == "paid":
            return True

        old_status = txn.status
        txn.status = "paid"
        txn.updated_at = datetime.now(timezone.utc)

        await self.credit_wallet_from_transaction(txn, gateway_label)

        # Publish status change event
        try:
            payment_event_bus.publish({
                "event_type": "status_change",
                "transaction_id": txn.id,
                "external_id": txn.external_id,
                "old_status": old_status,
                "new_status": txn.status,
                "amount": txn.amount,
                "description": txn.description or "",
                "transaction_type": txn.transaction_type,
                "user_id": txn.user_id,
            })
        except Exception as e:
            logger.warning(f"Failed to publish status change event: {e}")

        await self.db.commit()
        return True

    async def mark_as_expired(self, txn: Transactions) -> bool:
        """Mark a transaction as expired."""
        if txn.status != "pending":
            return False

        old_status = txn.status
        txn.status = "expired"
        txn.updated_at = datetime.now(timezone.utc)

        # Publish status change event
        try:
            payment_event_bus.publish({
                "event_type": "status_change",
                "transaction_id": txn.id,
                "external_id": txn.external_id,
                "old_status": old_status,
                "new_status": txn.status,
                "amount": txn.amount,
                "description": txn.description or "",
                "transaction_type": txn.transaction_type,
                "user_id": txn.user_id,
            })
        except Exception as e:
            logger.warning(f"Failed to publish status change event: {e}")

        await self.db.commit()
        return True

    async def find_by_external_or_gateway_id(self, identifier: str) -> Optional[Transactions]:
        """Find a transaction by external_id or xendit_id."""
        # Return the most recent matching transaction to avoid exceptions when
        # duplicate records exist (tests or demo data may create duplicates).
        stmt = (
            select(Transactions)
            .where(or_(Transactions.xendit_id == identifier, Transactions.external_id == identifier))
            .order_by(Transactions.id.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        # Use scalars().first() which is tolerant of zero-or-one rows and
        # doesn't raise MultipleResultsFound.
        return result.scalars().first()

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Fetch transaction statistics for a user."""
        # Total counts by status
        async def get_count(status: Optional[str] = None):
            stmt = select(func.count(Transactions.id)).where(Transactions.user_id == user_id)
            if status:
                stmt = stmt.where(Transactions.status == status)
            res = await self.db.execute(stmt)
            return res.scalar() or 0

        # Total amounts by status
        async def get_sum(status: Optional[str] = None):
            stmt = select(func.sum(Transactions.amount)).where(Transactions.user_id == user_id)
            if status:
                stmt = stmt.where(Transactions.status == status)
            res = await self.db.execute(stmt)
            return res.scalar() or 0.0

        total_count = await get_count()
        paid_count = await get_count("paid")
        pending_count = await get_count("pending")
        expired_count = await get_count("expired")

        total_amount = await get_sum()
        paid_amount = await get_sum("paid")
        pending_amount = await get_sum("pending")

        return {
            "total_count": total_count,
            "paid_count": paid_count,
            "pending_count": pending_count,
            "expired_count": expired_count,
            "total_amount": float(total_amount),
            "paid_amount": float(paid_amount),
            "pending_amount": float(pending_amount),
            "currency": "PHP"
        }

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Transactions]:
        """Get transactions by any field"""
        try:
            if not hasattr(Transactions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Transactions")
            result = await self.db.execute(
                select(Transactions).where(getattr(Transactions, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching transactions by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Transactions]:
        """Get list of transactionss filtered by field"""
        try:
            if not hasattr(Transactions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Transactions")
            result = await self.db.execute(
                select(Transactions)
                .where(getattr(Transactions, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Transactions.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching transactionss by {field_name}: {str(e)}")
            raise
