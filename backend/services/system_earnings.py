import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.admin_users import AdminUser
from models.wallet_transactions import Wallet_transactions
from models.wallets import Wallets

logger = logging.getLogger(__name__)


def _configured_system_admin_id() -> str | None:
    configured = str(getattr(settings, "telegram_admin_ids", "") or "")
    admin_id = configured.split(",")[0].strip().lstrip("@")
    return admin_id or None


async def credit_system_earnings(
    db: AsyncSession,
    amount: float,
    currency: str,
    reference_id: str,
    note: str,
    recipient_id: str | None = None,
) -> Wallets | None:
    """Credit commission earnings to a specified wallet or the system admin wallet."""
    if amount <= 0:
        return None

    if recipient_id:
        earnings_recipient_id = str(recipient_id)
    else:
        result = await db.execute(
            select(AdminUser.telegram_id)
            .where(AdminUser.is_super_admin.is_(True), AdminUser.is_active.is_(True))
            .order_by(AdminUser.id)
            .limit(1)
        )
        earnings_recipient_id = result.scalar_one_or_none() or _configured_system_admin_id()
    if not earnings_recipient_id:
        logger.error("Unable to credit system earnings: no system admin wallet is configured")
        return None

    fee_currency = str(currency or "PHP").strip().upper()
    if fee_currency == "USDT":
        fee_currency = "USD"
    wallet_result = await db.execute(
        select(Wallets)
        .where(Wallets.user_id == earnings_recipient_id, Wallets.currency == fee_currency)
        .with_for_update()
    )
    wallet = wallet_result.scalar_one_or_none()
    if wallet is None:
        now = datetime.now(timezone.utc)
        wallet = Wallets(
            user_id=earnings_recipient_id,
            currency=fee_currency,
            balance=0.0,
            available_balance=0.0,
            pending_balance=0.0,
            created_at=now,
            updated_at=now,
        )
        db.add(wallet)
        await db.flush()

    credited = round(float(amount), 2)
    balance_before = float(wallet.balance or 0.0)
    wallet.balance = round(balance_before + credited, 2)
    wallet.available_balance = round(float(wallet.available_balance or 0.0) + credited, 2)
    wallet.total_credits = round(float(wallet.total_credits or 0.0) + credited, 2)
    wallet.transaction_count = int(wallet.transaction_count or 0) + 1
    wallet.last_activity = datetime.now(timezone.utc)
    wallet.updated_at = datetime.now(timezone.utc)
    db.add(Wallet_transactions(
        user_id=earnings_recipient_id,
        wallet_id=wallet.id,
        transaction_type="system_earning",
        amount=credited,
        balance_before=balance_before,
        balance_after=wallet.balance,
        note=note,
        status="completed",
        reference_id=reference_id,
        created_at=datetime.now(timezone.utc),
    ))
    await db.flush()
    return wallet
