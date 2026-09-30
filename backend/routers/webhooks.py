"""Webhook handlers for payment integrations

Handles callbacks from:
- SwiftPay (Local PH payments: GCash, Maya, Bank Transfer, QR)
- Magpie (International: Visa, Mastercard, Alipay, WeChat Pay)
"""
import logging
import hashlib
import hmac
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from core.config import settings
from core.database import get_db
from models.disbursements import Disbursements
from models.wallet_transactions import Wallet_transactions
from services.transactions import TransactionsService, is_payment_received
from services.system_earnings import credit_system_earnings
from services.swiftpay_service import SwiftPayService
from services.payment_webhook_validation import payload_value as _payload_value
from services.payment_webhook_validation import validate_payment_amount as _validate_payment_amount

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


def _set_non_success_status(txn, status: str, payment_id: str = "") -> bool:
    if is_payment_received(txn):
        return False
    txn.status = status
    if payment_id:
        txn.xendit_id = payment_id
    txn.updated_at = datetime.now(timezone.utc)
    return True


@router.post("/swiftpay")
async def swiftpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle SwiftPay payment callbacks
    
    SwiftPay processes:
    - GCash payments
    - Maya payments
    - Bank transfers
    - QR Code payments
    """
    try:
        query_payload = dict(request.query_params)
        payload = dict(query_payload)
        if request.method == "POST":
            content_type = (request.headers.get("content-type") or "").lower()
            if "application/json" in content_type:
                body = await request.json()
            else:
                form = await request.form()
                body = dict(form)
            if not isinstance(body, dict):
                raise HTTPException(status_code=400, detail="Invalid SwiftPay webhook payload")
            payload.update(body)

        signature = str(payload.get("signature") or payload.get("sign") or "")
        service = SwiftPayService()
        if not signature or not service.verify_signature(payload, signature):
            raise HTTPException(status_code=400, detail="Invalid or missing SwiftPay webhook signature")
        
        reference_no = _payload_value(
            payload,
            "x_reference_no",
            "reference_no",
            "referenceNo",
            "merchant_reference",
            "merchantReferenceNo",
        )
        status = _payload_value(
            payload,
            "x_payment_status",
            "status",
            "payment_status",
            "paymentStatus",
            "payment_state",
            "paymentState",
            "result",
        )
        payment_id = _payload_value(payload, "x_payment_id", "payment_id", "paymentId", "id")
        amount = _payload_value(payload, "amount", "paid_amount", "paidAmount")
        
        logger.info(f"SwiftPay webhook: reference_no={reference_no}, status={status}, amount={amount}")
        
        # Map SwiftPay status to our internal status
        status_map = {
            "success": "completed",
            "successful": "completed",
            "succeeded": "completed",
            "complete": "completed",
            "completed": "completed",
            "executed": "completed",
            "paid": "completed",
            "successfully_paid": "completed",
            "settled": "completed",
            "pending": "pending",
            "failed": "failed",
            "cancelled": "cancelled",
            "rejected": "failed",
        }
        
        normalized_status = str(status).strip().lower()
        internal_status = status_map.get(normalized_status, normalized_status)
        
        # Update transaction status
        if reference_no or payment_id:
            txn_service = TransactionsService(db)
            txn = None
            for identifier in (reference_no, payment_id):
                if identifier:
                    txn = await txn_service.find_by_external_or_gateway_id(str(identifier))
                    if txn:
                        break
            if txn:
                if internal_status in {"completed", "paid"}:
                    _validate_payment_amount(payload, txn, "SwiftPay")
                    await txn_service.mark_as_paid(txn, gateway_label="SwiftPay")
                elif internal_status == "expired":
                    if is_payment_received(txn):
                        logger.warning("Ignoring stale SwiftPay expiry for received transaction %s", txn.id)
                    else:
                        await txn_service.mark_as_expired(txn)
                else:
                    if _set_non_success_status(txn, internal_status, payment_id):
                        await db.commit()
                    else:
                        logger.warning("Ignoring stale SwiftPay status %s for received transaction %s", internal_status, txn.id)
            logger.info(f"SwiftPay: Updated transaction {reference_no or payment_id} to {internal_status}")

            disbursement = await db.scalar(
                select(Disbursements).where(Disbursements.external_id == str(reference_no)).limit(1)
            ) if reference_no else None
            if disbursement and not (
                (disbursement.completed_at or str(disbursement.status or "").lower() in {"completed", "paid"})
                and internal_status not in {"completed", "paid"}
            ):
                disbursement.status = internal_status
                disbursement.updated_at = datetime.now(timezone.utc)
                if internal_status == "completed":
                    disbursement.completed_at = datetime.now(timezone.utc)
                    if disbursement.processing_fee:
                        fee_reference = f"{disbursement.external_id}-system-fee"
                        already_credited = await db.scalar(
                            select(Wallet_transactions.id)
                            .where(Wallet_transactions.reference_id == fee_reference)
                            .limit(1)
                        )
                        if already_credited is None:
                            await credit_system_earnings(
                                db=db,
                                amount=disbursement.processing_fee,
                                currency=disbursement.currency or "PHP",
                                reference_id=fee_reference,
                                note=f"Withdrawal earnings: {disbursement.processing_fee:,.2f} {disbursement.currency or 'PHP'}",
                            )
                elif internal_status in {"failed", "cancelled"}:
                    reason = str(
                        _payload_value(payload, "errorMessage", "error_message", "failureReason") or "Provider rejected disbursement"
                    )
                    from routers.wallet import _refund_withdrawal
                    await _refund_withdrawal(db, disbursement, reason)
                await db.execute(
                    update(Wallet_transactions)
                    .where(Wallet_transactions.reference_id == disbursement.external_id)
                    .values(status=internal_status)
                )
                if internal_status == "completed":
                    await db.execute(
                        update(Wallet_transactions)
                        .where(Wallet_transactions.reference_id == f"{disbursement.external_id}-fee")
                        .values(status="completed")
                    )
                await db.commit()
        
        return {"success": True, "received": True, "reference_no": reference_no}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SwiftPay webhook error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="SwiftPay webhook processing failed") from e


@router.post("/magpie")
async def magpie_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Magpie payment callbacks
    
    Magpie processes:
    - Visa card payments
    - Mastercard card payments
    - Alipay payments
    - WeChat Pay payments
    """
    raw_body = await request.body()
    secret = str(settings.magpie_webhook_secret or "").strip()
    signature = request.headers.get("X-Magpie-Signature", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Magpie webhook is not configured")
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not signature or not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=403, detail="Invalid or missing Magpie webhook signature")

    try:
        payload = json.loads(raw_body)
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Invalid Magpie webhook payload")
        
        order_id = _payload_value(payload, "order_id", "orderId", "checkout_id", "checkoutId", "reference_no", "referenceNo")
        status = _payload_value(
            payload,
            "status",
            "payment_status",
            "paymentStatus",
            "payment_state",
            "paymentState",
            "result",
        )
        transaction_id = _payload_value(payload, "transaction_id", "transactionId", "payment_id", "paymentId", "id")
        amount = _payload_value(payload, "amount", "paid_amount", "paidAmount")
        payment_method = _payload_value(payload, "payment_method", "paymentMethod", "method")
        
        logger.info(f"Magpie webhook: order_id={order_id}, status={status}, method={payment_method}, amount={amount}")
        
        # Map Magpie status to our internal status
        status_map = {
            "success": "completed",
            "successful": "completed",
            "succeeded": "completed",
            "complete": "completed",
            "completed": "completed",
            "paid": "completed",
            "successfully_paid": "completed",
            "settled": "completed",
            "pending": "pending",
            "failed": "failed",
            "cancelled": "cancelled",
        }
        
        normalized_status = str(status).strip().lower()
        internal_status = status_map.get(normalized_status, normalized_status)
        
        # Update transaction status
        if order_id or transaction_id:
            txn_service = TransactionsService(db)
            txn = None
            for identifier in (order_id, transaction_id):
                if identifier:
                    txn = await txn_service.find_by_external_or_gateway_id(str(identifier))
                    if txn:
                        break
            if txn is None:
                logger.warning("Magpie: no transaction matched order_id=%s", order_id or transaction_id)
            else:
                if transaction_id:
                    txn.xendit_id = transaction_id
                if internal_status in {"completed", "paid"}:
                    _validate_payment_amount(payload, txn, "Magpie")
                    finalized = await txn_service.mark_as_paid(txn, gateway_label="Magpie")
                    if not finalized:
                        logger.error("Magpie: could not finalize transaction %s", txn.id)
                else:
                    if _set_non_success_status(txn, internal_status, transaction_id):
                        await db.commit()
                    else:
                        logger.warning("Ignoring stale Magpie status %s for received transaction %s", internal_status, txn.id)
                logger.info("Magpie: Updated transaction %s to %s", order_id or transaction_id, internal_status)
        
        return {"success": True, "received": True, "order_id": order_id or transaction_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Magpie webhook error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Magpie webhook processing failed") from e


@router.get("/test")
async def test_webhook():
    """Test endpoint to verify webhooks are running"""
    return {
        "message": "Payment webhooks endpoint is operational",
        "providers": {
            "swiftpay": "Local PH payments (GCash, Maya, Bank, QR)",
            "magpie": "International payments (Visa, Mastercard, Alipay, WeChat)"
        },
        "endpoints": {
            "swiftpay": "/api/v1/webhooks/swiftpay",
            "magpie": "/api/v1/webhooks/magpie"
        }
    }
