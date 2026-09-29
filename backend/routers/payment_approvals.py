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
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import KRW_PAYMENT_APPROVAL_TELEGRAM_ID, SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from core.database import get_db
from dependencies.auth import get_current_user
from models.transactions import Transactions
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from schemas.auth import UserResponse
from services.wallets import WalletsService
from services.transactions import TransactionsService
from services.transactions import (
    RECEIVED_PAYMENT_STATUSES,
    get_payment_status,
    is_customer_payment,
    is_payment_received,
)
from services.swiftpay_service import SwiftPayService
from services.action_confirmation import ActionConfirmationService, ActionType
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
EXTERNALLY_PAID_STATUSES = tuple(RECEIVED_PAYMENT_STATUSES)
RETRYABLE_SETTLEMENT_STATUSES = ("failed",)


class PaymentApprovalRequest(BaseModel):
    """Request to approve or reject a payment link"""
    note: Optional[str] = None
    reason: Optional[str] = None


def _provider_value(payload: Any, aliases: set[str]) -> Optional[str]:
    if isinstance(payload, list):
        for item in payload:
            value = _provider_value(item, aliases)
            if value:
                return value
        return None
    if not isinstance(payload, dict):
        return None

    for key, value in payload.items():
        normalized_key = "".join(char for char in str(key).lower() if char.isalnum())
        if normalized_key in aliases and value not in (None, "") and not isinstance(value, (dict, list)):
            return str(value).strip() or None
    for value in payload.values():
        if isinstance(value, (dict, list)):
            nested_value = _provider_value(value, aliases)
            if nested_value:
                return nested_value
    return None


def _swiftpay_payment_details(payload: Any) -> dict[str, Optional[str]]:
    return {
        "sender_name": _provider_value(
            payload, {"sendername", "payername", "remittername", "debtorname"}
        ),
        "sender_bank": _provider_value(
            payload, {"senderbank", "payerbank", "debitbankname", "sourcebankname"}
        ),
        "sender_account_number": _provider_value(
            payload,
            {
                "senderaccountnumber",
                "payeraccountnumber",
                "sourceaccountnumber",
                "debitaccountnumber",
                "fromaccountnumber",
            },
        ),
        "receiver_bank": _provider_value(
            payload,
            {
                "merchantbankname",
                "merchantcreditbankname",
                "destinationbankname",
                "receiverbankname",
                "creditbankname",
            },
        ),
        "receiver_account_name": _provider_value(
            payload,
            {
                "merchantaccountname",
                "merchantcreditaccountname",
                "destinationaccountname",
                "receiveraccountname",
            },
        ),
        "receiver_account_number": _provider_value(
            payload,
            {
                "merchantaccountnumber",
                "merchantcreditaccountnumber",
                "destinationaccountnumber",
                "receiveraccountnumber",
                "creditaccountnumber",
                "toaccountnumber",
            },
        ),
        "institution_reference_no": _provider_value(
            payload, {"institutionreferenceno"}
        ),
        "channel_reference_no": _provider_value(payload, {"channelreferenceno"}),
        "provider_status": _provider_value(
            payload, {"xpaymentstatus", "paymentstatus", "status"}
        ),
    }


def _require_payment_approval_access(user: UserResponse) -> None:
    """Restrict payment approval controls to the designated system account."""
    if str(user.id).strip() != SYSTEM_WALLET_ADMIN_TELEGRAM_ID:
        raise HTTPException(
            status_code=403,
            detail="Only the designated system user can access payment approvals",
        )


def _is_krw_payment(txn: Transactions) -> bool:
    return any(
        str(currency or "").strip().upper() == "KRW"
        for currency in (txn.original_currency, txn.currency)
    )


def _require_krw_payment_owner(user: UserResponse) -> None:
    if str(user.id) != KRW_PAYMENT_APPROVAL_TELEGRAM_ID:
        raise HTTPException(
            status_code=403,
            detail="Only the designated KRW payment approver can approve KRW payments",
        )


def _enforce_krw_payment_approver(txn: Transactions, user: UserResponse) -> bool:
    """Enforce KRW ownership and return whether this approval may be forced."""
    if not _is_krw_payment(txn):
        return False
    _require_krw_payment_owner(user)
    return str(user.id) == KRW_PAYMENT_APPROVAL_TELEGRAM_ID


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
    _require_payment_approval_access(current_user)

    try:
        query = select(Transactions).where(
            Transactions.transaction_type.not_in([
                "disbursement", "swiftpay_disbursement", "withdrawal",
                "wallet_withdrawal", "topup", "wallet_topup", "crypto_topup",
                "bank_deposit", "refund", "fee", "commission", "settlement",
            ]),
            Transactions.amount > 0,
            Transactions.external_id.is_not(None),
        )
        is_krw_approver = str(current_user.id) == KRW_PAYMENT_APPROVAL_TELEGRAM_ID
        if not is_krw_approver:
            query = query.where(
                or_(
                    Transactions.status.in_(APPROVABLE_PAYMENT_STATUSES),
                    and_(
                        Transactions.status.in_(EXTERNALLY_PAID_STATUSES),
                        or_(
                            Transactions.approval_status.is_(None),
                            Transactions.approval_status == "pending",
                        ),
                    ),
                )
            )
        if not is_krw_approver:
            query = query.where(
                or_(Transactions.currency.is_(None), func.upper(Transactions.currency) != "KRW"),
                or_(Transactions.original_currency.is_(None), func.upper(Transactions.original_currency) != "KRW"),
            )

        result = await db.execute(
            query
            .order_by(Transactions.created_at.desc(), Transactions.id.desc())
            .limit(limit)
        )
        transactions = [
            txn for txn in result.scalars().all()
            if is_customer_payment(txn)
        ]
        user_ids = {str(txn.user_id) for txn in transactions}
        users = await db.scalars(select(AdminUser).where(AdminUser.telegram_id.in_(user_ids))) if user_ids else []
        user_names = {str(user.telegram_id): user.name for user in users}
        configs = await db.scalars(
            select(MerchantApiConfig).where(
                MerchantApiConfig.user_id.in_(user_ids)
            )
        ) if user_ids else []
        store_names = {
            str(config.user_id): config.store_name
            for config in configs
            if config.store_name
        }

        logger.info(f"Found {len(transactions)} pending payments for super admin {current_user.id}")

        return {
            "success": True,
            "count": len(transactions),
            "data": [
                {
                    "id": str(txn.id),
                    "external_id": txn.external_id or txn.xendit_id or "",
                    "type": txn.transaction_type,
                    # Approval reviewers should see the same quote shown to the
                    # customer, not the provider's converted settlement amount.
                    "amount": float(
                        txn.original_amount
                        if txn.original_amount is not None
                        else txn.amount or 0
                    ),
                    "currency": txn.original_currency or txn.currency or "PHP",
                    "processing_amount": float(txn.amount or 0),
                    "processing_currency": txn.currency or "PHP",
                    "exchange_rate": (
                        float(txn.amount or 0)
                        / float(txn.original_amount)
                        if txn.original_amount is not None and txn.original_amount != 0
                        else None
                    ),
                    "customer_name": txn.customer_name or "Unknown",
                    "user_name": user_names.get(str(txn.user_id)) or txn.customer_name or str(txn.user_id),
                    "store_name": (
                        store_names.get(str(txn.user_id))
                        or user_names.get(str(txn.user_id))
                        or txn.customer_name
                        or "Unknown"
                    ),
                    "description": txn.description or "",
                    "status": txn.status,
                    "payment_status": get_payment_status(txn),
                    "approval_status": getattr(txn, 'approval_status', 'pending'),
                    "payment_received": is_payment_received(txn),
                    "payment_received_at": serialize_utc_datetime(txn.paid_at) or "",
                    "created_at": serialize_utc_datetime(txn.created_at) or "",
                    "user_id": txn.user_id,
                    "sender_name": txn.sender_name,
                    "sender_bank": txn.sender_bank,
                    "sender_account_number": None,
                    "receiver_bank": txn.bank_name,
                    "receiver_account_name": txn.bank_account_name,
                    "receiver_account_number": txn.bank_account_number,
                    "has_swiftpay_details": bool(
                        txn.xendit_id
                        or txn.transaction_type in {"swiftpay_order", "swiftpay_qr"}
                    ),
                }
                for txn in transactions
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pending payments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending payments: {str(e)}")


@router.get("/payment-approvals/{txn_id}/details")
async def get_payment_approval_details(
    txn_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch available transfer details for a provider-confirmed payment."""
    _require_payment_approval_access(current_user)
    result = await db.execute(select(Transactions).where(Transactions.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment link not found")
    _enforce_krw_payment_approver(txn, current_user)
    if not is_payment_received(txn):
        raise HTTPException(status_code=409, detail="Payment has not been received yet")

    details = {
        "sender_name": txn.sender_name,
        "sender_bank": txn.sender_bank,
        "sender_account_number": None,
        "receiver_bank": txn.bank_name,
        "receiver_account_name": txn.bank_account_name,
        "receiver_account_number": txn.bank_account_number,
        "institution_reference_no": None,
        "channel_reference_no": None,
        "provider_status": get_payment_status(txn),
    }
    provider_lookup_error = None
    is_swiftpay = bool(
        txn.xendit_id
        or txn.transaction_type in {"swiftpay_order", "swiftpay_qr"}
    )
    if is_swiftpay:
        service = SwiftPayService()
        if service.is_configured():
            remote = await service.get_order_status(
                reference_no=txn.external_id,
                payment_id=txn.xendit_id,
            )
            if remote.get("success"):
                remote_details = _swiftpay_payment_details(remote.get("data"))
                details = {
                    key: remote_details.get(key) or details.get(key)
                    for key in details
                }
            else:
                provider_lookup_error = str(
                    remote.get("error") or "SwiftPay payment details could not be fetched"
                )
        else:
            provider_lookup_error = "SwiftPay is not configured"

    return {
        "success": True,
        "transaction_id": txn.id,
        "provider": "SwiftPay" if is_swiftpay else None,
        "data": details,
        "provider_lookup_error": provider_lookup_error,
    }


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
    _require_payment_approval_access(current_user)

    result = await db.execute(
        select(Transactions).where(Transactions.id == txn_id).with_for_update()
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment link not found")
    force_krw_approval = _enforce_krw_payment_approver(txn, current_user)

    approval_pending = txn.approval_status in {None, "pending"}
    retryable_settlement = (
        txn.status in RETRYABLE_SETTLEMENT_STATUSES
        and txn.approval_status == "approved"
        and is_customer_payment(txn)
    )
    if not force_krw_approval and txn.status not in APPROVABLE_PAYMENT_STATUSES and not retryable_settlement and not (
        txn.status in EXTERNALLY_PAID_STATUSES and approval_pending
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve payment link with status {txn.status}",
        )

    approval_status = getattr(txn, 'approval_status', None)
    if approval_status == "approved" and not force_krw_approval:
        raise HTTPException(
            status_code=400,
            detail="Payment link already approved",
        )
    if not force_krw_approval and not is_payment_received(txn):
        raise HTTPException(
            status_code=400,
            detail=f"Payment has not been received; current payment status is {get_payment_status(txn) or 'unknown'}.",
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
            force_approval=force_krw_approval,
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

        # Generate confirmation message
        confirmation = ActionConfirmationService.approval_success(
            entity_type="Payment",
            entity_id=txn.id,
            amount=amount,
            currency=txn.currency or "PHP",
            details=txn.description or txn.external_id or "",
        )

        response = {
            "success": True,
            "transaction_id": txn.id,
            "status": "paid",
            "amount_credited": amount,
            "currency": txn.currency or "PHP",
            "new_balance": balance_after,
            "message": confirmation.message,
            "confirmation": confirmation.to_dict(),
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
    - Marks transaction as "cancelled"
    - Records rejection reason
    - Does NOT credit wallet (payment not accepted)
    """
    _require_payment_approval_access(current_user)

    result = await db.execute(
        select(Transactions).where(Transactions.id == txn_id).with_for_update()
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment link not found")
    _enforce_krw_payment_approver(txn, current_user)

    if txn.status not in APPROVABLE_PAYMENT_STATUSES and not (
        txn.status in EXTERNALLY_PAID_STATUSES
        and txn.approval_status in {None, "pending"}
    ):
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

        # Mark payment as cancelled (no wallet credit)
        rejection_reason = body.reason or body.note or "Rejected by admin"

        txn.status = "cancelled"
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

        # Generate confirmation message
        confirmation = ActionConfirmationService.rejection_success(
            entity_type="Payment",
            entity_id=txn.id,
            reason=rejection_reason,
        )

        return {
            "success": True,
            "transaction_id": txn.id,
            "status": "cancelled",
            "currency": txn.currency or "PHP",
            "message": confirmation.message,
            "confirmation": confirmation.to_dict(),
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
