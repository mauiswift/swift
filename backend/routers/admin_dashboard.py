"""System administrator dashboard overview API."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from dependencies.auth import get_current_user
from models.bank_deposit_requests import BankDepositRequest
from models.disbursements import Disbursements
from models.kyb_registrations import KybRegistration
from models.kyc_verifications import KycVerification
from models.topup_requests import TopupRequest
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/admin/dashboard", tags=["admin-dashboard"])


class PendingQueueCounts(BaseModel):
    kyb: int
    kyc: int
    bank_deposits: int
    topups: int
    withdrawals: int


class AdminDashboardOverview(BaseModel):
    pending_queues: PendingQueueCounts


def _require_super_admin(current_user: UserResponse) -> None:
    permissions = current_user.permissions
    if not permissions or not permissions.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System administrator access required.",
        )


def _can_review_financial_queues(current_user: UserResponse) -> bool:
    return str(current_user.id).strip() == SYSTEM_WALLET_ADMIN_TELEGRAM_ID


async def _count_statuses(
    db: AsyncSession,
    model: type,
    statuses: tuple[str, ...],
) -> int:
    result = await db.scalar(
        select(func.count()).select_from(model).where(model.status.in_(statuses))
    )
    return int(result or 0)


@router.get("/overview", response_model=AdminDashboardOverview)
async def get_admin_dashboard_overview(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AdminDashboardOverview:
    """Return aggregate pending queue counts for system administrators."""
    _require_super_admin(current_user)
    can_review_financial_queues = _can_review_financial_queues(current_user)

    return AdminDashboardOverview(
        pending_queues=PendingQueueCounts(
            kyb=await _count_statuses(db, KybRegistration, ("pending_review",)),
            kyc=await _count_statuses(db, KycVerification, ("pending_review",)),
            bank_deposits=(
                await _count_statuses(db, BankDepositRequest, ("pending",))
                if can_review_financial_queues
                else 0
            ),
            topups=(
                await _count_statuses(db, TopupRequest, ("pending",))
                if can_review_financial_queues
                else 0
            ),
            withdrawals=(
                await _count_statuses(db, Disbursements, ("pending", "processing", "transferring"))
                if can_review_financial_queues
                else 0
            ),
        )
    )