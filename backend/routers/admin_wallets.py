"""
Super Admin Wallet Management Router
Allows super admins to manage wallets, freeze/unfreeze, audit, and perform batch operations.
"""
import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict

from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.constants import LEDGER_CURRENCIES
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from schemas.auth import UserResponse
from sqlalchemy import select
from services.wallets import WalletsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/wallets", tags=["admin-wallets"])


def _validate_wallet_currency(currency: Optional[str]) -> Optional[str]:
    if currency is None:
        return None
    normalized = currency.strip().upper()
    if normalized == "USDT":
        normalized = "USD"
    if normalized not in LEDGER_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported wallet currency")
    return normalized


def _require_wallet_permission(current_user: UserResponse, permission: str) -> None:
    _require_system_wallet_admin(current_user)
    permissions = current_user.permissions
    if not permissions or not permissions.is_super_admin or not getattr(permissions, permission, False):
        raise HTTPException(status_code=403, detail=f"{permission} permission required.")


def _require_system_wallet_admin(current_user: UserResponse) -> None:
    if str(current_user.id).strip() != SYSTEM_WALLET_ADMIN_TELEGRAM_ID:
        raise HTTPException(
            status_code=403,
            detail="Only the designated system user can control wallets.",
        )


async def _reject_vip_wallet_control(db: AsyncSession, user_id: str) -> None:
    """VIP Gold wallets cannot be frozen or unfrozen."""
    admin = await db.scalar(
        select(AdminUser).where(AdminUser.telegram_id == str(user_id))
    )
    if admin and admin.vip_gold:
        raise HTTPException(
            status_code=400,
            detail="Freeze and unfreeze controls are unavailable for VIP Gold wallets.",
        )


# ---------- Schemas ----------
class WalletAnalyticsResponse(BaseModel):
    id: int
    currency: str
    balance: float
    available_balance: float
    pending_balance: float
    total_credits: float
    total_debits: float
    transaction_count: int
    is_frozen: bool
    freeze_reason: Optional[str] = None
    last_activity: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RecentTransactionResponse(BaseModel):
    id: int
    type: str
    amount: float
    status: str
    created_at: Optional[datetime] = None


class UserWalletAnalyticsResponse(BaseModel):
    user_id: str
    wallets: List[WalletAnalyticsResponse]
    recent_transactions: List[RecentTransactionResponse]


class FreezeWalletRequest(BaseModel):
    user_id: str
    reason: Optional[str] = None
    currency: Optional[str] = None


class FreezeWalletResponse(BaseModel):
    success: bool
    wallet_id: int
    status: str


class ReconcileWalletRequest(BaseModel):
    user_id: str
    currency: str = "PHP"


class ReconcileWalletResponse(BaseModel):
    success: bool
    user_id: str
    currency: str
    recorded_balance: float
    computed_balance: float
    difference: float
    reconciled: bool


class ReconciliationMismatchItem(BaseModel):
    user_id: str
    wallet_id: int
    currency: str
    recorded_balance: float
    computed_balance: float
    difference: float
    is_frozen: bool
    freeze_reason: Optional[str] = None


class ReconciliationSummaryResponse(BaseModel):
    total_wallets: int
    wallets_with_mismatch: int
    total_difference: float
    average_difference: float
    largest_difference: float
    mismatches: List[ReconciliationMismatchItem]


class BatchCreditItem(BaseModel):
    user_id: str
    amount: float
    currency: Optional[str] = "PHP"
    note: Optional[str] = None


class BatchCreditRequest(BaseModel):
    items: List[BatchCreditItem]


class BatchCreditResult(BaseModel):
    user_id: str
    success: bool
    error: Optional[str] = None


class BatchCreditResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[BatchCreditResult]


# ---------- Endpoints ----------
@router.get("/user/{user_id}/analytics", response_model=UserWalletAnalyticsResponse)
async def get_wallet_analytics(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed analytics for a user's wallet(s). Super admin only."""
    _require_system_wallet_admin(current_user)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    service = WalletsService(db)
    try:
        result = await service.get_wallet_analytics(user_id)
        return result
    except Exception as e:
        logger.error(f"Error fetching wallet analytics for {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/freeze")
async def freeze_wallet(
    request: FreezeWalletRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Freeze a user's wallet. Super admin only."""
    _require_wallet_permission(current_user, "can_freeze_wallet")
    await _reject_vip_wallet_control(db, request.user_id)

    currency = _validate_wallet_currency(request.currency)
    service = WalletsService(db)
    try:
        result = await service.freeze_wallet(
            request.user_id,
            request.reason or "",
            currency=currency,
        )
        logger.info(f"User {current_user.id} froze wallet for {request.user_id}")
        return result
    except Exception as e:
        logger.error(f"Error freezing wallet: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/unfreeze")
async def unfreeze_wallet(
    user_id: str,
    currency: Optional[str] = Query(default=None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unfreeze a user's wallet. Super admin only."""
    _require_wallet_permission(current_user, "can_unfreeze_wallet")
    await _reject_vip_wallet_control(db, user_id)

    currency = _validate_wallet_currency(currency)
    service = WalletsService(db)
    try:
        result = await service.unfreeze_wallet(user_id, currency=currency)
        logger.info(f"User {current_user.id} unfroze wallet for {user_id}")
        return result
    except Exception as e:
        logger.error(f"Error unfreezing wallet: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/reconcile", response_model=ReconcileWalletResponse)
async def reconcile_wallet(
    request: ReconcileWalletRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reconcile a wallet's balance from transaction history. Super admin only."""
    _require_system_wallet_admin(current_user)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    service = WalletsService(db)
    try:
        result = await service.reconcile_wallet(request.user_id, request.currency)
        if result["reconciled"]:
            logger.warning(
                f"Wallet reconciliation performed for {request.user_id}: "
                f"difference={result['difference']}, admin={current_user.id}"
            )
        return result
    except Exception as e:
        logger.error(f"Error reconciling wallet: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/reconcile-summary", response_model=ReconciliationSummaryResponse)
async def get_reconciliation_summary(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super admins can get a quick reconciliation summary across all wallets."""
    _require_system_wallet_admin(current_user)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    service = WalletsService(db)
    try:
        return await service.get_wallet_reconciliation_summary()
    except Exception as e:
        logger.error(f"Error fetching wallet reconciliation summary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch-credit", response_model=BatchCreditResponse)
async def batch_credit_wallets(
    request: BatchCreditRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Batch credit multiple wallets. Super admin only."""
    _require_system_wallet_admin(current_user)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    if len(request.items) > 1000:
        raise HTTPException(status_code=400, detail="Batch size exceeds 1000 items limit")

    service = WalletsService(db)
    try:
        credits = [item.model_dump() for item in request.items]
        result = await service.batch_credit_wallets(credits, str(current_user.id))
        logger.info(
            f"Batch credit completed: {result['successful']}/{result['total']} successful, admin={current_user.id}"
        )
        return result
    except Exception as e:
        logger.error(f"Error in batch credit: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/list-frozen", tags=["admin-wallets"])
async def list_frozen_wallets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all frozen wallets. Super admin only."""
    _require_system_wallet_admin(current_user)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    from sqlalchemy import select, func
    from models.wallets import Wallets

    try:
        query = select(Wallets).where(Wallets.is_frozen == True).order_by(Wallets.updated_at.desc())
        count_query = select(func.count(Wallets.id)).where(Wallets.is_frozen == True)

        count_result = await db.execute(count_query)
        total = count_result.scalar()

        result = await db.execute(query.offset(skip).limit(limit))
        items = result.scalars().all()

        return {
            "items": [
                {
                    "id": w.id,
                    "user_id": w.user_id,
                    "balance": w.balance,
                    "currency": w.currency,
                    "freeze_reason": w.freeze_reason,
                    "updated_at": w.updated_at,
                }
                for w in items
            ],
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"Error listing frozen wallets: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
