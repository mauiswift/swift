"""Canonical user-facing BitGo wallet endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.usdt_deposit_addresses import UsdtDepositAddress
from schemas.auth import UserResponse
from services.bitgo_service import BitGoConfigurationError, BitGoRequestError, assign_usdt_address

router = APIRouter(prefix="/api/v1/bitgo", tags=["bitgo"])


def _address_payload(record: UsdtDepositAddress) -> dict[str, object]:
    return {
        "id": record.id,
        "user_id": record.user_id,
        "address": record.address,
        "network": record.network,
        "derivation_index": record.derivation_index,
        "active": record.active,
        "last_scanned_at": record.last_scanned_at,
    }


@router.get("/my-address")
async def get_my_bitgo_address(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's BitGo-managed USDT deposit address."""
    user_id = str(current_user.id)
    record = await db.scalar(
        select(UsdtDepositAddress).where(UsdtDepositAddress.user_id == user_id)
    )
    if not record:
        try:
            record = await assign_usdt_address(db, user_id)
            await db.commit()
        except (BitGoConfigurationError, BitGoRequestError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
    return _address_payload(record)
