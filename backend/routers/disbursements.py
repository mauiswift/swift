import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ConfigDict, BaseModel
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from services.disbursements import DisbursementsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from routers.base import BaseEntityRouter

# Set up logging
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------
class DisbursementsData(BaseModel):
    """Entity data schema (for create/update)"""
    external_id: str = None
    xendit_id: str = None
    amount: float
    currency: str = None
    bank_code: str = None
    account_number: str = None
    account_name: str = None
    description: str = None
    status: str = None
    disbursement_type: str = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DisbursementsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    external_id: Optional[str] = None
    xendit_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    bank_code: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    disbursement_type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DisbursementsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    external_id: Optional[str] = None
    xendit_id: Optional[str] = None
    amount: float
    currency: Optional[str] = None
    bank_code: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    disbursement_type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DisbursementsListResponse(BaseModel):
    """List response schema"""
    items: List[DisbursementsResponse]
    total: int
    skip: int
    limit: int


class DisbursementsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[DisbursementsData]


# ---------- Specialized Logic ----------

async def _require_php_balance(db: AsyncSession, user_id: str, amount: float) -> Wallets:
    """Check user has sufficient PHP wallet balance. Raises 402 if insufficient."""
    from services.wallets import WalletsService
    svc = WalletsService(db)
    wallet = await svc.get_or_create_wallet(user_id, "PHP")
    
    balance = float(wallet.balance)
    if balance <= 0:
        raise HTTPException(
            status_code=402,
            detail="Insufficient balance. Your wallet balance is ₱0.00. Please top up to continue.",
        )
    if balance < amount:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient balance. Available: ₱{balance:,.2f}, Required: ₱{amount:,.2f}. Please top up.",
        )
    return wallet


entity_router = BaseEntityRouter(
    prefix="/api/v1/entities/disbursements",
    tags=["disbursements"],
    service_class=DisbursementsService,
    create_schema=DisbursementsData,
    update_schema=DisbursementsUpdateData,
    response_schema=DisbursementsResponse,
    list_response_schema=DisbursementsListResponse,
    batch_create_schema=DisbursementsBatchCreateRequest,
)

router = entity_router.router


@router.post("/{id}/approve", response_model=DisbursementsResponse)
async def approve_disbursements(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending disbursement and trigger Magpie payout."""
    if not (current_user.permissions and current_user.permissions.is_super_admin):
        raise HTTPException(status_code=403, detail="Super admin approval required for disbursements")

    service = DisbursementsService(db)
    disb = await service.get_by_id(id)
    if not disb:
        raise HTTPException(status_code=404, detail="Disbursement not found")

    if disb.status != "pending":
        raise HTTPException(status_code=400, detail=f"Disbursement is already {disb.status}")

    raise HTTPException(
        status_code=501,
        detail="Disbursement approval via legacy Magpie payout support has been removed.",
    )


@router.post("/{id}/cancel", response_model=DisbursementsResponse)
async def cancel_disbursements(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending disbursement and refund the wallet."""
    service = DisbursementsService(db)
    disb = await service.get_by_id(id)
    if not disb:
        raise HTTPException(status_code=404, detail="Disbursement not found")

    # Only owner or admin can cancel
    if disb.user_id != str(current_user.id) and not current_user.permissions.can_manage_disbursements:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this disbursement")

    if disb.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot cancel disbursement in {disb.status} status")

    try:
        # 1. Update status to cancelled
        disb.status = "cancelled"
        disb.updated_at = datetime.now(timezone.utc)

        # 2. Refund wallet
        from services.wallets import WalletsService
        svc = WalletsService(db)
        wallet = await svc.get_or_create_wallet(disb.user_id, "PHP", lock=True)
        
        if wallet:
            wallet.balance = round(wallet.balance + disb.amount, 2)
            if hasattr(wallet, 'available_balance'):
                wallet.available_balance = round((wallet.available_balance or 0.0) + disb.amount, 2)
            wallet.updated_at = datetime.now(timezone.utc)

            # 3. Update wallet transaction
            await db.execute(
                update(Wallet_transactions)
                .where(Wallet_transactions.reference_id == disb.external_id)
                .values(status="cancelled", note=f"Refunded: {disb.description or ''}", updated_at=datetime.now(timezone.utc))
            )

        await db.commit()
        await db.refresh(disb)
        return disb

    except Exception as e:
        logger.error(f"Error cancelling disbursement: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Settlement Management (Super Admin) ====================

class SettlementBatchRequest(BaseModel):
    """Request to create a settlement batch"""
    user_ids: List[str]
    bank_code: str
    priority: str = "normal"  # normal, high, urgent


class SettlementStatsResponse(BaseModel):
    """Settlement statistics response"""
    today: dict
    week: dict
    pending: dict
    failed: dict


@router.post("/admin/settlement/batch", tags=["admin-disbursements"])
async def create_settlement_batch(
    request: SettlementBatchRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a settlement batch for multiple disbursements going to the same bank.
    Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    service = DisbursementsService(db)
    try:
        result = await service.create_settlement_batch(
            request.user_ids, request.bank_code, request.priority
        )
        if result.get("success"):
            logger.info(
                f"Settlement batch created by {current_user.id}: "
                f"batch_id={result['batch_id']}, count={result['count']}"
            )
        return result
    except Exception as e:
        logger.error(f"Error creating settlement batch: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/admin/settlement/{batch_id}/complete", tags=["admin-disbursements"])
async def mark_batch_completed(
    batch_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all disbursements in a settlement batch as completed.
    Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    service = DisbursementsService(db)
    try:
        result = await service.mark_settlement_completed(batch_id)
        if result.get("success"):
            logger.info(f"Settlement batch {batch_id} marked completed by {current_user.id}")
        return result
    except Exception as e:
        logger.error(f"Error completing settlement batch: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/admin/settlement/stats", response_model=SettlementStatsResponse, tags=["admin-disbursements"])
async def get_settlement_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get settlement statistics for the super admin dashboard.
    Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    service = DisbursementsService(db)
    try:
        stats = await service.get_settlement_stats()
        return stats
    except Exception as e:
        logger.error(f"Error fetching settlement stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
