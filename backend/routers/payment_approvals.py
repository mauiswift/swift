"""
Payment Link Approval Workflow

Super admins must approve/reject payment links before user wallet credits are issued.
This ensures compliance and fraud prevention.

Endpoints:
- GET /api/v1/admin/payment-links/pending
- POST /api/v1/admin/payment-links/{txn_id}/approve
- POST /api/v1/admin/payment-links/{txn_id}/reject
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.transactions import Transactions
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse
from services.wallets import WalletsService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin-approvals"])


class PaymentApprovalRequest(BaseModel):
    """Request to approve or reject a payment link"""
    note: Optional[str] = None
    reason: Optional[str] = None


def _require_super_admin(user: UserResponse) -> None:
    """Ensure user is a super admin, raise 403 otherwise."""
    if not (user.permissions and user.permissions.is_super_admin):
        raise HTTPException(
            status_code=403,
            detail="Super admin access required for payment approval"
        )


@router.get("/payment-links/pending")
async def list_pending_payment_links(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """
    List all pending payment links awaiting super admin approval.
    
    Super admin only.
    Returns pending payment links sorted by creation date.
    """
    _require_super_admin(current_user)

    result = await db.execute(
        select(Transactions)
        .where(
            Transactions.transaction_type.in_(["payment_link", "invoice"]),
            Transactions.status == "pending",
            Transactions.approval_status.in_(["pending", None]),
        )
        .order_by(Transactions.created_at.asc())
        .limit(limit)
    )
    transactions = result.scalars().all()

    return {
        "success": True,
        "count": len(transactions),
        "data": [
            {
                "id": str(txn.id),
                "external_id": txn.external_id or txn.xendit_id or "",
                "type": txn.transaction_type,
                "amount": float(txn.amount or 0),
                "currency": txn.currency or "PHP",
                "customer_name": txn.customer_name or "Unknown",
                "description": txn.description or "",
                "status": txn.status,
                "approval_status": txn.approval_status or "pending",
                "created_at": txn.created_at.isoformat() if txn.created_at else "",
                "user_id": txn.user_id,
            }
            for txn in transactions
        ],
    }


@router.post("/payment-links/{txn_id}/approve")
async def approve_payment_link(
    txn_id: int,
    body: PaymentApprovalRequest = PaymentApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve a pending payment link and credit the user's wallet.
    
    Super admin only.
    - Marks transaction as "paid"
    - Credits user's wallet with payment amount
    - Records approval audit trail
    """
    _require_super_admin(current_user)

    txn = await db.get(Transactions, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Payment link not found")

    if txn.status not in {"pending", "processing"}:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve payment link with status {txn.status}",
        )

    if txn.approval_status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Payment link already approved",
        )

    try:
        # Credit the wallet
        wallet_svc = WalletsService(db)
        wallet = await wallet_svc.get_or_create_wallet(
            txn.user_id, 
            txn.currency or "PHP",
            lock=True
        )

        amount = float(txn.amount or 0)
        balance_before = float(wallet.balance or 0)
        balance_after = round(balance_before + amount, 2)

        wallet.balance = balance_after
        wallet.available_balance = round(
            float(wallet.available_balance or 0) + amount, 2
        )
        wallet.updated_at = datetime.now(timezone.utc)

        # Record wallet transaction
        wallet_txn = Wallet_transactions(
            user_id=wallet.user_id,
            wallet_id=wallet.id,
            transaction_type="payment_received",
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            status="completed",
            reference_id=f"payment-{txn.id}",
            note=(
                f"Payment link approved: {txn.description or 'Payment'} "
                f"[Admin: {current_user.id}]"
                + (f" — {body.note}" if body.note else "")
            ),
            created_at=datetime.now(timezone.utc),
        )
        db.add(wallet_txn)

        # Mark payment as paid and approved
        txn.status = "paid"
        txn.approval_status = "approved"
        txn.approved_by = str(current_user.id)
        txn.approved_at = datetime.now(timezone.utc)
        txn.updated_at = datetime.now(timezone.utc)

        await db.commit()

        logger.info(
            "Super admin %s approved payment link #%s (%.2f %s) for user %s",
            current_user.id,
            txn.id,
            amount,
            txn.currency or "PHP",
            txn.user_id,
        )

        return {
            "success": True,
            "transaction_id": txn.id,
            "status": "approved",
            "amount_credited": amount,
            "new_balance": balance_after,
        }

    except Exception as exc:
        await db.rollback()
        logger.error(
            "Failed to approve payment link #%s: %s",
            txn_id,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve payment link: {str(exc)}",
        )


@router.post("/payment-links/{txn_id}/reject")
async def reject_payment_link(
    txn_id: int,
    body: PaymentApprovalRequest = PaymentApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reject a pending payment link.
    
    Super admin only.
    - Marks transaction as "failed"
    - Records rejection reason
    - Does NOT credit wallet (payment not accepted)
    """
    _require_super_admin(current_user)

    txn = await db.get(Transactions, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Payment link not found")

    if txn.status not in {"pending", "processing"}:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject payment link with status {txn.status}",
        )

    if txn.approval_status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Payment link already rejected",
        )

    try:
        # Mark payment as rejected (no wallet credit)
        rejection_reason = body.reason or body.note or "Rejected by admin"
        
        txn.status = "failed"
        txn.approval_status = "rejected"
        txn.approved_by = str(current_user.id)
        txn.approved_at = datetime.now(timezone.utc)
        txn.rejection_reason = rejection_reason
        txn.updated_at = datetime.now(timezone.utc)

        await db.commit()

        logger.info(
            "Super admin %s rejected payment link #%s. Reason: %s",
            current_user.id,
            txn.id,
            rejection_reason,
        )

        return {
            "success": True,
            "transaction_id": txn.id,
            "status": "rejected",
            "reason": rejection_reason,
        }

    except Exception as exc:
        await db.rollback()
        logger.error(
            "Failed to reject payment link #%s: %s",
            txn_id,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reject payment link: {str(exc)}",
        )
