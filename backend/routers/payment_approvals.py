"""
Payment Link & Invoice Approval Workflow Router

Super admins must approve/reject payment links and invoices before user wallet credits are issued.
This ensures compliance and fraud prevention.

Endpoints:
- GET /api/v1/admin/payment-approvals/pending
- POST /api/v1/admin/payment-approvals/{txn_id}/approve
- POST /api/v1/admin/payment-approvals/{txn_id}/reject
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.transactions import Transactions
from models.bot_logs import BotLogs
from schemas.auth import UserResponse
from services.wallets import WalletsService
from services.transactions import TransactionsService
from services.admin_notifications_service import AdminNotificationsService
from services.telegram_service import TelegramService
from utils.datetime import serialize_utc_datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin-approvals"])
APPROVABLE_PAYMENT_STATUSES = (
    "pending",
    "processing",
    "created",
    "unpaid",
    "awaiting_payment",
)
EXTERNALLY_PAID_STATUSES = ("paid", "completed")
RETRYABLE_SETTLEMENT_STATUSES = ("failed",)


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


@router.get("/payment-approvals/pending")
async def list_pending_payment_approvals(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """
    List all pending payment links awaiting super admin approval.

    Super admin only.
    Returns pending payment links sorted by creation date.
    Automatically sends Telegram notifications to super admins about new pending payments.
    """
    _require_super_admin(current_user)

    try:
        result = await db.execute(
            select(Transactions)
            .where(
                Transactions.transaction_type.in_(["payment_link", "invoice", "swiftpay_order"]),
                or_(
                    Transactions.status.in_(APPROVABLE_PAYMENT_STATUSES),
                    and_(
                        Transactions.status.in_(EXTERNALLY_PAID_STATUSES),
                        or_(
                            Transactions.approval_status.is_(None),
                            Transactions.approval_status == "pending",
                        ),
                    ),
                ),
            )
            .order_by(Transactions.created_at.desc(), Transactions.id.desc())
            .limit(limit)
        )
        transactions = [
            txn for txn in result.scalars().all()
            if not (
                txn.external_id
                and txn.external_id.startswith("OPEN-AMOUNT-")
                and float(txn.amount or 0) == 0
            )
        ]

        logger.info(f"Found {len(transactions)} pending payments for super admin {current_user.id}")

        # Send Telegram notifications for pending payments that haven't been notified yet
        telegram_service = TelegramService()
        admin_notif_service = AdminNotificationsService(db, telegram_service)

        for txn in transactions[:5]:  # Notify about top 5 most recent pending payments
            try:
                # Check if we already sent a notification for this transaction
                log_result = await db.execute(
                    select(BotLogs).where(
                        BotLogs.event_type == "payment_approval_notified",
                        BotLogs.reference_id == str(txn.id),
                    )
                )
                already_notified = log_result.scalar_one_or_none()

                if not already_notified:
                    # Send notification
                    await admin_notif_service.notify_payment_approval_pending(
                        payment_id=str(txn.id),
                        amount=float(txn.amount or 0),
                        currency=txn.currency or "PHP",
                        customer_name=txn.customer_name or "Unknown",
                        description=txn.description or "",
                        external_id=txn.external_id or txn.xendit_id or "",
                    )

                    # Log that we sent this notification to avoid duplicates
                    notification_log = BotLogs(
                        event_type="payment_approval_notified",
                        reference_id=str(txn.id),
                        user_id=str(current_user.id),
                        data={"payment_amount": float(txn.amount or 0), "currency": txn.currency or "PHP"},
                    )
                    db.add(notification_log)
                    await db.commit()
            except Exception as e:
                logger.error(f"Error sending payment approval notification for txn {txn.id}: {e}", exc_info=True)

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
                    "approval_status": getattr(txn, 'approval_status', 'pending'),
                    "created_at": serialize_utc_datetime(txn.created_at) or "",
                    "user_id": txn.user_id,
                }
                for txn in transactions
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pending payments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending payments: {str(e)}")


@router.post("/payment-approvals/{txn_id}/approve")
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

    approval_pending = txn.approval_status in {None, "pending"}
    retryable_settlement = (
        txn.status in RETRYABLE_SETTLEMENT_STATUSES
        and txn.approval_status == "approved"
        and txn.transaction_type in {"payment_link", "invoice", "swiftpay_order"}
    )
    if txn.status not in APPROVABLE_PAYMENT_STATUSES and not retryable_settlement and not (
        txn.status in EXTERNALLY_PAID_STATUSES and approval_pending
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve payment link with status {txn.status}",
        )

    approval_status = getattr(txn, 'approval_status', None)
    if approval_status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Payment link already approved",
        )

    try:
        logger.info(f"Super admin {current_user.id} approving payment {txn_id}")

        txn_service = TransactionsService(db)

        # Calculate fee validation for manual payments (no provider)
        fee_validation = None
        if not txn.xendit_id and not txn.external_id:
            # Manual payment with no provider - calculate expected fees
            gross_amount = float(txn.amount or 0)
            deducted = body.note and any(
                keyword in body.note.lower()
                for keyword in ["deducted", "fee", "charged", "deduction"]
            )
            if deducted:
                fee_validation = await txn_service.calculate_expected_fees(
                    str(txn.user_id),
                    gross_amount
                )

        approved = await txn_service.approve_payment_link(
            txn,
            approved_by=str(current_user.id),
            note=body.note,
        )
        if not approved:
            logger.error(f"Failed to approve payment {txn_id} - service returned false")
            raise HTTPException(status_code=409, detail="Payment link could not be approved")

        wallet = await WalletsService(db).get_or_create_wallet(
            txn.user_id,
            txn.currency or "PHP",
        )
        amount = float(txn.amount or 0)
        balance_after = float(wallet.balance or 0)

        logger.info(
            "✅ Super admin %s approved payment #%s (%.2f %s) → user %s wallet",
            current_user.id,
            txn.id,
            amount,
            txn.currency or "PHP",
            txn.user_id,
        )

        response = {
            "success": True,
            "transaction_id": txn.id,
            "status": "approved",
            "amount_credited": amount,
            "currency": txn.currency or "PHP",
            "new_balance": balance_after,
            "message": f"{amount:,.2f} {txn.currency or 'PHP'} payment processed successfully and credited to the merchant wallet",
        }

        # Include fee validation if available (hidden in message to look like manual operation)
        if fee_validation:
            response["fee_validation"] = fee_validation
            if not fee_validation.get("is_accurate"):
                response["fee_status"] = f"WARNING: Deduction accuracy {fee_validation['accuracy_percent']}% (deviation: {fee_validation['deviation']:,.2f})"

        return response

    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        logger.error(
            "❌ Failed to approve payment #%s: %s",
            txn_id,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve payment link: {str(exc)}",
        )


@router.post("/payment-approvals/{txn_id}/reject")
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

    if txn.status not in APPROVABLE_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject payment link with status {txn.status}",
        )

    approval_status = getattr(txn, 'approval_status', None)
    if approval_status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Payment link already rejected",
        )

    try:
        logger.info(f"Super admin {current_user.id} rejecting payment {txn_id}")

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
            "❌ Super admin %s rejected payment #%s. Reason: %s",
            current_user.id,
            txn.id,
            rejection_reason,
        )

        return {
            "success": True,
            "transaction_id": txn.id,
            "status": "rejected",
            "currency": txn.currency or "PHP",
            "message": f"{float(txn.amount or 0):,.2f} {txn.currency or 'PHP'} payment rejected; no wallet credit was issued",
            "reason": rejection_reason,
        }

    except Exception as exc:
        await db.rollback()
        logger.error(
            "❌ Failed to reject payment #%s: %s",
            txn_id,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reject payment link: {str(exc)}",
        )
