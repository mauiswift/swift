from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.usdt_deposit_addresses import UsdtChainTransfer, UsdtDepositAddress
from schemas.auth import UserResponse
from services.bitgo_service import (
    BitGoConfigurationError,
    assign_usdt_address,
    get_bitgo_config,
    monitor_all_addresses,
    monitor_user_address,
    save_bitgo_config,
)

router = APIRouter(prefix="/api/v1/tatum", tags=["tatum"])


class TatumConfigRequest(BaseModel):
    enabled: bool = True
    access_token: Optional[str] = None
    api_key: Optional[str] = None  # legacy UI/API alias
    base_url: str = "https://app.bitgo.com"
    wallet_id: Optional[str] = None
    tron_xpub: Optional[str] = None  # legacy alias for wallet_id
    coin: str = "trx"
    usdt_contract: Optional[str] = None


class TatumConfigResponse(BaseModel):
    enabled: bool
    configured: bool
    base_url: str
    wallet_id: str
    coin: str
    usdt_contract: str
    has_access_token: bool
    has_api_key: bool


def _require_super_admin(user: UserResponse) -> None:
    if not user.permissions or not user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")


def _address_payload(record: UsdtDepositAddress) -> dict[str, Any]:
    return {
        "id": record.id,
        "user_id": record.user_id,
        "address": record.address,
        "network": record.network,
        "derivation_index": record.derivation_index,
        "active": record.active,
        "last_scanned_at": record.last_scanned_at,
    }


@router.get("/config", response_model=TatumConfigResponse)
async def get_config_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    return await get_bitgo_config(db)


@router.put("/config", response_model=TatumConfigResponse)
async def set_config_endpoint(
    body: TatumConfigRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    try:
        payload = body.model_dump()
        payload["access_token"] = payload.get("access_token") or payload.get("api_key")
        payload["wallet_id"] = payload.get("wallet_id") or payload.get("tron_xpub")
        return await save_bitgo_config(db, payload)
    except BitGoConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/addresses/assign/{user_id}")
async def assign_address_endpoint(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    try:
        record = await assign_usdt_address(db, user_id)
        await db.commit()
        return _address_payload(record)
    except BitGoConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/addresses/assign-missing")
async def assign_missing_addresses_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    from models.admin_users import AdminUser

    result = await db.execute(select(AdminUser.telegram_id).where(AdminUser.is_active.is_(True)))
    assigned = []
    for (user_id,) in result.all():
        try:
            assigned.append(_address_payload(await assign_usdt_address(db, str(user_id))))
        except BitGoConfigurationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    await db.commit()
    return {"assigned": assigned, "count": len(assigned)}


@router.get("/my-address")
async def get_my_address_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.scalar(select(UsdtDepositAddress).where(UsdtDepositAddress.user_id == str(current_user.id)))
    if not record:
        try:
            record = await assign_usdt_address(db, str(current_user.id))
            await db.commit()
        except BitGoConfigurationError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return _address_payload(record)


@router.get("/addresses")
async def list_addresses_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    result = await db.execute(select(UsdtDepositAddress).order_by(UsdtDepositAddress.created_at.desc()))
    return {"addresses": [_address_payload(item) for item in result.scalars().all()]}


@router.post("/monitor")
async def monitor_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    try:
        return await monitor_all_addresses(db)
    except BitGoConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/transfers")
async def list_transfers_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    result = await db.execute(select(UsdtChainTransfer).order_by(UsdtChainTransfer.observed_at.desc()).limit(500))
    return {
        "transfers": [
            {
                "id": item.id,
                "user_id": item.user_id,
                "address": item.address,
                "tx_hash": item.tx_hash,
                "direction": item.direction,
                "amount_usdt": float(item.amount_usdt),
                "from_address": item.from_address,
                "to_address": item.to_address,
                "status": item.status,
                "observed_at": item.observed_at,
            }
            for item in result.scalars().all()
        ]
    }
