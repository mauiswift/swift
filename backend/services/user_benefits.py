"""Centralized user entitlements unlocked by qualifying deposits."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.admin_users import AdminUser
from models.crypto_topup import CryptoTopupRequest
from models.topup_requests import TopupRequest

KRW_BENEFIT_THRESHOLD_USDT = 600.0


async def unlock_krw_benefits(
    db: AsyncSession,
    user_id: str,
    *,
    source: Optional[str] = None,
) -> bool:
    """Persist the KRW entitlement when a qualifying approved USDT deposit exists.

    This function is idempotent and is safe to call from every approval path.
    """
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not admin:
        return False

    qualifying_topup = await db.scalar(
        select(TopupRequest.id)
        .where(
            TopupRequest.chat_id == str(user_id),
            TopupRequest.status == "approved",
            TopupRequest.currency == "USDT",
            TopupRequest.amount_usdt >= KRW_BENEFIT_THRESHOLD_USDT,
        )
        .order_by(TopupRequest.id.asc())
        .limit(1)
    )
    qualifying_crypto = await db.scalar(
        select(CryptoTopupRequest.id)
        .where(
            CryptoTopupRequest.user_id == str(user_id),
            CryptoTopupRequest.status == "approved",
            CryptoTopupRequest.amount_usdt >= KRW_BENEFIT_THRESHOLD_USDT,
        )
        .order_by(CryptoTopupRequest.id.asc())
        .limit(1)
    )
    if qualifying_topup is None and qualifying_crypto is None:
        return bool(admin.krw_benefits_unlocked)

    if not admin.krw_benefits_unlocked:
        admin.krw_benefits_unlocked = True
        admin.krw_benefits_unlocked_at = datetime.now(timezone.utc)
        admin.krw_benefits_unlock_source = source or (
            f"topup:{qualifying_topup}" if qualifying_topup is not None else f"crypto_topup:{qualifying_crypto}"
        )
        await db.flush()
    return True


async def get_krw_benefits(db: AsyncSession, user_id: str) -> dict:
    """Return the canonical KRW entitlement and its audit metadata."""
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not admin:
        return {
            "unlocked": False,
            "unlocked_at": None,
            "unlock_source": None,
            "threshold_usdt": KRW_BENEFIT_THRESHOLD_USDT,
        }
    unlocked = await unlock_krw_benefits(db, user_id)
    return {
        "unlocked": unlocked,
        "unlocked_at": admin.krw_benefits_unlocked_at,
        "unlock_source": admin.krw_benefits_unlock_source,
        "threshold_usdt": KRW_BENEFIT_THRESHOLD_USDT,
    }
