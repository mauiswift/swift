import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor
from services.swiftpay_service import SwiftPayService
from core.config import settings
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/xend", tags=["xend"])


class CreatePaymentRequest(BaseModel):
    amount: float
    description: str = ""
    descriptor: str = ""
    merchant_name: str = ""
    customer_name: str = ""
    customer_email: str = ""
    external_id: str = ""
    payment_methods: List[str] = Field(default_factory=list)


class PayQRPhRequest(BaseModel):
    qr_data: str
    amount: float
    description: str = ""
    merchant_name: str = ""
    reference_number: str = ""


SUPPORTED_PAYMENT_METHODS = ["card", "gcash", "bank_transfer", "qrph", "cash", "wallet"]


@router.get("/payment-methods")
async def get_supported_payment_methods():
    return {
        "success": True,
        "source": "internal",
        "payment_methods": SUPPORTED_PAYMENT_METHODS,
    }


@router.get("/ping")
async def ping_magpie(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    return {
        "success": True,
        "configured": True,
        "source": "internal",
        "message": "Payment processing is running with the internal processor.",
    }


@router.get("/transaction-stats")
async def get_transaction_stats(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    return await processor.get_stats(user_id=str(current_user.id))


async def _process_xend_request(
    db: AsyncSession,
    current_user: UserResponse,
    request: CreatePaymentRequest,
    transaction_type: str,
):
    swiftpay = SwiftPayService()
    if swiftpay.is_configured():
        # Build initial reference (use provided external_id when present,
        # otherwise generate a unique one). If SwiftPay rejects the reference
        # because it's duplicated, retry with a new unique reference up to
        # `max_attempts` times.
        base_reference = request.external_id or f"xend-{transaction_type}-{uuid.uuid4().hex[:12]}"
        details: Dict[str, Any] = {
            "payment_type": transaction_type,
            "description": request.description or f"{transaction_type} payment",
            "merchant_name": request.merchant_name,
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "payment_methods": request.payment_methods,
            "external_id": request.external_id,
        }

        max_attempts = 3
        attempt = 0
        order_result: Dict[str, Any] = {}
        reference_no = base_reference
        while attempt < max_attempts:
            order_result = await swiftpay.create_order(
                amount=request.amount,
                reference_no=reference_no,
                details=details,
                currency="PHP",
                generate_customer_redirect_url=True,
            )
            # If success, break; otherwise check for duplicate reference error.
            if order_result.get("success"):
                break
            # Some SwiftPay error payloads include an errorCode field.
            err = order_result.get("error") or order_result.get("data") or {}
            code = None
            if isinstance(err, dict):
                code = err.get("errorCode") or err.get("code")
            attempt += 1
            if code == "DUPLICATED_REFERENCE_NO" and attempt < max_attempts:
                # Generate a new reference suffix and retry.
                reference_no = f"{base_reference}-{uuid.uuid4().hex[:6]}"
                logger.warning("SwiftPay reference duplicated, retrying with new reference: %s", reference_no)
                continue
            # No retry possible/desired — break and let the error be handled below.
            break
        if order_result.get("success"):
            data = order_result.get("data") or {}
            remote_redirect = data.get("customerRedirectUrl") or data.get("customer_redirect_url") or ""
            local_checkout_path = f"/checkout/{reference_no}"
            public_host = (getattr(settings, 'public_checkout_host', '') or getattr(settings, 'railway_public_domain', '') or '').strip()
            if public_host:
                if not public_host.startswith('http'):
                    public_host = f"https://{public_host.lstrip('/')}"
                checkout_url = public_host.rstrip('/') + local_checkout_path
            else:
                checkout_url = local_checkout_path

            payment_url = remote_redirect or checkout_url
            gateway_id = data.get("paymentId") or data.get("payment_id") or ""
            txn_svc = TransactionsService(db)
            # IMPORTANT: Use the actual reference_no (with retry suffix if needed),
            # not the original request.external_id. This ensures the database record
            # matches the payment URL and checkout endpoint lookup.
            txn = await txn_svc.create_transaction(
                user_id=str(current_user.id),
                transaction_type=transaction_type,
                amount=request.amount,
                external_id=reference_no,  # Use actual reference_no used by SwiftPay
                gateway_id=gateway_id,
                description=request.description or f"{transaction_type} payment",
                customer_name=request.customer_name,
                customer_email=request.customer_email,
                payment_url=payment_url,
                status="pending",
                currency="PHP",
                idempotency_key=reference_no,
            )
            payment_id = getattr(txn, "external_id", None) or getattr(txn, "payment_id", None) or str(getattr(txn, "id", ""))
            amount_value = getattr(txn, "amount", request.amount)
            currency_value = getattr(txn, "currency", None) or "PHP"
            status_value = getattr(txn, "status", "pending")
            return {
                "success": True,
                "message": f"{transaction_type} created",
                "data": {
                    "transaction_id": getattr(txn, "id", None),
                    "payment_id": payment_id,
                    "amount": float(amount_value),
                    "currency": currency_value,
                    "status": status_value,
                    "payment_url": payment_url,
                    "checkout_url": checkout_url,
                    "source": "swiftpay",
                    "gateway": "swiftpay",
                    "raw": data,
                },
            }
        raise HTTPException(status_code=400, detail=order_result.get("error", "SwiftPay create order failed"))

    processor = PaymentProcessor(db)
    result = await processor.create_payment(
        user_id=str(current_user.id),
        amount=request.amount,
        description=request.description or f"{transaction_type} payment",
        currency="PHP",
        metadata={
            "transaction_type": transaction_type,
            "merchant_name": request.merchant_name,
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "external_id": request.external_id,
            "payment_methods": request.payment_methods,
        },
    )
    return {
        "success": True,
        "message": f"{transaction_type} created",
        "data": {
            "transaction_id": result["transaction_id"],
            "payment_id": result["payment_id"],
            "amount": result["amount"],
            "currency": result["currency"],
            "status": result["status"],
            "source": "internal",
            "gateway": "internal",
        },
    }


@router.post("/create-invoice")
async def create_invoice(
    data: CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await _process_xend_request(db=db, current_user=current_user, request=data, transaction_type="invoice")


@router.post("/create-payment-link")
async def create_payment_link(
    data: CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await _process_xend_request(db=db, current_user=current_user, request=data, transaction_type="payment_link")


@router.post("/create-qr-code")
async def create_qr_code(
    data: CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await _process_xend_request(db=db, current_user=current_user, request=data, transaction_type="qr_code")


@router.post("/pay-qrph")
async def pay_qrph(
    data: PayQRPhRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    request = CreatePaymentRequest(
        amount=data.amount,
        description=data.description or data.merchant_name or "QRPH payment",
        merchant_name=data.merchant_name,
        external_id=data.reference_number,
        payment_methods=["qrph"],
    )
    return await _process_xend_request(db=db, current_user=current_user, request=request, transaction_type="qrph_payment")
