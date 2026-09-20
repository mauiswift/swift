"""
Private admin-only payment approval endpoints.

These endpoints are intentionally hidden from API documentation and require
super admin permissions. This ensures customers cannot discover manual payment
approval capabilities.

Routes:
- POST /api/v1/admin/_internal/payments/{payment_id}/mark-paid
- POST /api/v1/admin/_internal/payments/{payment_id}/mark-expired
- POST /api/v1/admin/_internal/bank-deposits/{deposit_id}/approve
- POST /api/v1/admin/_internal/topups/{topup_id}/approve
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.bank_deposit_requests import BankDepositRequest
from models.topup_requests import TopupRequest
from models.transactions import Transactions
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse
from services.wallets import WalletsService
from services.user_benefits import unlock_krw_benefits
from services.app_settings import get_usdt_php_rate
from services.transactions import TransactionsService
from utils.datetime import serialize_utc_datetime

logger = logging.getLogger(__name__)

# Internal-only router not exposed in public API documentation
router = APIRouter(prefix="/api/v1/admin/_internal", tags=["admin-internal"])


# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class PrivateApprovalRequest(BaseModel):
    note: str = ""
    reason: Optional[str] = None
    sender_name: Optional[str] = None
    sender_bank: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ──────────────────────────────────────────────────────────────────────────────

def _require_super_admin(user: UserResponse) -> None:
    """Ensure user is a super admin, raise 403 otherwise."""
    if not (user.permissions and user.permissions.is_super_admin):
        raise HTTPException(
            status_code=403,
            detail="Super admin access required for internal payment operations"
        )


def _require_wallet_permission(user: UserResponse, permission: str) -> None:
    if user.permissions and user.permissions.is_super_admin:
        return
    if not user.permissions or not getattr(user.permissions, permission, False):
        raise HTTPException(status_code=403, detail=f"{permission} permission required")


async def _find_payment_transaction(db: AsyncSession, payment_id: str) -> Optional[Transactions]:
    # The approval list sends the immutable local transaction ID. Resolve it
    # first so a numeric external reference cannot select another transaction.
    if payment_id.isdigit():
        txn = await db.get(Transactions, int(payment_id))
        if txn:
            return txn

    txn_svc = TransactionsService(db)
    return await txn_svc.find_by_external_or_gateway_id(payment_id)


# ──────────────────────────────────────────────────────────────────────────────
# Transaction Management Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/payments/pending", include_in_schema=False)
async def admin_list_pending_payments(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending invoices, payment links, and SwiftPay orders for review."""
    _require_wallet_permission(current_user, "can_credit_wallet")

    result = await db.execute(
        select(Transactions)
        .where(
            Transactions.status.in_(("pending", "created", "awaiting_approval", "processing")),
            or_(
                Transactions.transaction_type.in_(["invoice", "payment_link", "swiftpay_order"]),
                and_(
                    Transactions.currency == "KRW",
                    Transactions.transaction_type.is_not(None),
                ),
            ),
        )
        .order_by(Transactions.created_at.asc())
    )
    transactions = result.scalars().all()
    return {
        "success": True,
        "data": [
            {
                "id": str(txn.id),
                # Use the immutable local ID for approval actions. External references
                # can be reused by legacy links and are not a safe approval key.
                "payment_id": str(txn.id),
                "external_id": txn.external_id or txn.xendit_id or "",
                "amount": float(txn.amount or 0),
                "currency": txn.currency or "PHP",
                "customer_name": txn.customer_name,
                "description": txn.description or "",
                "status": txn.status,
                "created_at": serialize_utc_datetime(txn.created_at) or "",
                "transaction_type": txn.transaction_type,
            }
            for txn in transactions
        ],
    }

@router.post("/payments/{payment_id}/mark-paid", include_in_schema=False)
async def admin_mark_payment_paid(
    payment_id: str,
    body: PrivateApprovalRequest = PrivateApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    INTERNAL ONLY: Mark a payment as paid and credit user's wallet.
    This endpoint is intentionally hidden from API documentation.
    Super admin only.
    """
    _require_wallet_permission(current_user, "can_credit_wallet")

    txn_svc = TransactionsService(db)
    txn = await _find_payment_transaction(db, payment_id)

    if not txn:
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    if txn.status in {"paid", "completed", "expired", "failed", "rejected", "cancelled"}:
        raise HTTPException(status_code=400, detail=f"Payment is already {txn.status}")

    try:
        txn.sender_name = body.sender_name.strip() if body.sender_name and body.sender_name.strip() else None
        txn.sender_bank = body.sender_bank.strip() if body.sender_bank and body.sender_bank.strip() else None
        result = await txn_svc.mark_as_paid(txn, gateway_label="admin-manual")
        if not result:
            raise HTTPException(status_code=409, detail="Payment could not be marked as paid")
        logger.info(
            "Admin %s manually marked payment %s as paid. Reason: %s",
            current_user.id, payment_id, body.reason or body.note
        )
        return {
            "success": result,
            "payment_id": payment_id,
            "status": "paid",
            "note": body.note,
            "sender_name": txn.sender_name,
            "sender_bank": txn.sender_bank,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error marking payment {payment_id} as paid: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark payment as paid: {str(exc)}")


@router.post("/payments/{payment_id}/mark-expired", include_in_schema=False)
async def admin_mark_payment_expired(
    payment_id: str,
    body: PrivateApprovalRequest = PrivateApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    INTERNAL ONLY: Mark a payment as expired/failed.
    This endpoint is intentionally hidden from API documentation.
    Super admin only.
    """
    _require_super_admin(current_user)

    txn_svc = TransactionsService(db)
    txn = await _find_payment_transaction(db, payment_id)

    if not txn:
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    if txn.status in {"paid", "completed", "expired", "failed", "rejected", "cancelled"}:
        raise HTTPException(status_code=400, detail=f"Payment is already {txn.status}")

    try:
        result = await txn_svc.mark_as_expired(txn)
        if not result:
            raise HTTPException(status_code=409, detail="Payment could not be rejected")
        logger.info(
            "Admin %s manually marked payment %s as expired. Reason: %s",
            current_user.id, payment_id, body.reason or body.note
        )
        return {
            "success": result,
            "payment_id": payment_id,
            "status": "expired",
            "note": body.note
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error marking payment {payment_id} as expired: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark payment as expired: {str(exc)}")


# ──────────────────────────────────────────────────────────────────────────────
# Bank Deposit Approval (Internal)
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/bank-deposits/{deposit_id}/approve", include_in_schema=False)
async def admin_approve_bank_deposit(
    deposit_id: int,
    body: PrivateApprovalRequest = PrivateApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    INTERNAL ONLY: Approve a bank deposit and credit user's PHP wallet.
    This endpoint is intentionally hidden from API documentation.
    Super admin only.
    """
    _require_super_admin(current_user)

    result = await db.execute(
        select(BankDepositRequest)
        .where(BankDepositRequest.id == deposit_id)
        .with_for_update()
    )
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Bank deposit request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    user_id = str(req.chat_id)
    amount_php = req.amount_php

    wallet_service = WalletsService(db)
    wallet = await wallet_service.get_or_create_wallet(user_id, "PHP")

    balance_before = wallet.balance
    wallet.balance = round(wallet.balance + amount_php, 2)
    wallet.updated_at = datetime.now(timezone.utc)

    txn = Wallet_transactions(
        user_id=wallet.user_id,
        wallet_id=wallet.id,
        transaction_type="top_up",
        amount=amount_php,
        balance_before=balance_before,
        balance_after=wallet.balance,
        note=(
            f"Bank deposit: ₱{amount_php:,.2f} via {req.channel} ({req.account_number})"
            f" (request #{deposit_id}) [Admin Approved]"
            + (f" — {body.note}" if body.note else "")
        ),
        status="completed",
        reference_id=str(deposit_id),
        created_at=datetime.now(timezone.utc),
    )
    db.add(txn)

    req.status = "approved"
    req.note = body.note or f"Approved: ₱{amount_php:,.2f} PHP credited [Admin]"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(req)

    await wallet_service.publish_wallet_event(wallet.user_id, wallet, "top_up", amount_php, txn.id, req.note)

    logger.info(
        "Admin %s approved bank deposit #%s — ₱%.2f PHP credited to %s. Reason: %s",
        current_user.id, deposit_id, amount_php, user_id, body.reason or body.note
    )
    return {"success": True, "deposit_id": deposit_id, "status": "approved"}


@router.post("/bank-deposits/{deposit_id}/reject", include_in_schema=False)
async def admin_reject_bank_deposit(
    deposit_id: int,
    body: PrivateApprovalRequest = PrivateApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    INTERNAL ONLY: Reject a bank deposit request.
    This endpoint is intentionally hidden from API documentation.
    Super admin only.
    """
    _require_super_admin(current_user)

    result = await db.execute(select(BankDepositRequest).where(BankDepositRequest.id == deposit_id))
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Bank deposit request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "rejected"
    req.note = body.note or "Rejected by admin"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)

    logger.info(
        "Admin %s rejected bank deposit #%s. Reason: %s",
        current_user.id, deposit_id, body.reason or body.note
    )
    return {"success": True, "deposit_id": deposit_id, "status": "rejected"}


# ──────────────────────────────────────────────────────────────────────────────
# USDT Top-up Approval (Internal)
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/topups/{topup_id}/approve", include_in_schema=False)
async def admin_approve_topup(
    topup_id: int,
    body: PrivateApprovalRequest = PrivateApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    INTERNAL ONLY: Approve a USDT top-up and convert to PHP.
    This endpoint is intentionally hidden from API documentation.
    Super admin only.
    """
    _require_super_admin(current_user)

    result = await db.execute(
        select(TopupRequest)
        .where(TopupRequest.id == topup_id)
        .with_for_update()
    )
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    user_id = str(req.chat_id)
    amount_usdt = req.amount_usdt
    request_currency = str(req.currency or "USDT").upper()
    # Older Telegram /topup requests were stored as PHP even though the
    # deposited amount was USDT. Their absent note distinguishes them from
    # explicit PHP requests created through the API.
    if request_currency == "PHP" and not req.note:
        request_currency = "USDT"
    if request_currency not in {"PHP", "USDT", "KRW"}:
        raise HTTPException(status_code=400, detail=f"Unsupported top-up currency: {request_currency}")

    if request_currency == "PHP":
        rate = await get_usdt_php_rate(db)
        credit_amount = round(amount_usdt * rate, 2)
        credit_currency = "PHP"
        credit_note = f"USDT→PHP topup: ${amount_usdt:.2f} USDT × ₱{rate:.2f} = ₱{credit_amount:,.2f}"
    else:
        credit_amount = round(amount_usdt, 2)
        credit_currency = request_currency
        credit_note = f"{credit_currency} topup: {credit_amount:,.2f} {credit_currency}"

    wallet_service = WalletsService(db)
    wallet = await wallet_service.get_or_create_wallet(user_id, credit_currency)

    balance_before = wallet.balance
    wallet.balance = round(wallet.balance + credit_amount, 2)
    wallet.available_balance = round(wallet.available_balance + credit_amount, 2)
    wallet.updated_at = datetime.now(timezone.utc)

    txn = Wallet_transactions(
        user_id=wallet.user_id,
        wallet_id=wallet.id,
        transaction_type="top_up",
        amount=credit_amount,
        balance_before=balance_before,
        balance_after=wallet.balance,
        note=(
            credit_note
            +
            f" (request #{topup_id}) [Admin Approved]"
            + (f" — {body.note}" if body.note else "")
        ),
        status="completed",
        reference_id=str(topup_id),
        created_at=datetime.now(timezone.utc),
    )
    db.add(txn)

    req.status = "approved"
    req.note = body.note or f"Approved: {credit_note} [Admin]"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)
    if credit_currency == "USDT":
        await unlock_krw_benefits(db, str(user_id), source=f"topup:{topup_id}")

    await db.commit()
    await db.refresh(req)

    await wallet_service.publish_wallet_event(wallet.user_id, wallet, "top_up", credit_amount, txn.id, req.note)

    logger.info(
        "Admin %s approved topup #%s — %.2f %s credited to %s. Reason: %s",
        current_user.id, topup_id, credit_amount, credit_currency, user_id, body.reason or body.note
    )
    return {"success": True, "topup_id": topup_id, "status": "approved"}


@router.post("/topups/{topup_id}/reject", include_in_schema=False)
async def admin_reject_topup(
    topup_id: int,
    body: PrivateApprovalRequest = PrivateApprovalRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    INTERNAL ONLY: Reject a top-up request.
    This endpoint is intentionally hidden from API documentation.
    Super admin only.
    """
    _require_super_admin(current_user)

    result = await db.execute(select(TopupRequest).where(TopupRequest.id == topup_id))
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "rejected"
    req.note = body.note or "Rejected by admin"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)

    logger.info(
        "Admin %s rejected topup #%s. Reason: %s",
        current_user.id, topup_id, body.reason or body.note
    )
    return {"success": True, "topup_id": topup_id, "status": "rejected"}
