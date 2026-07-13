import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.swiftpay_service import SwiftPayService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/magpie", tags=["magpie"])


class CheckoutSessionRequest(BaseModel):
    payment_method_types: List[str] = []
    line_items: List[dict] = []
    mode: str = "payment"
    success_url: str = ""
    cancel_url: str = ""
    currency: str = "php"
    customer_email: str = ""
    description: str = ""


class CreateInvoiceRequest(BaseModel):
    amount: float
    description: str = ""
    descriptor: str = ""
    merchant_name: str = ""
    customer_name: str = ""
    customer_email: str = ""
    payment_methods: List[str] = []


@router.get("/ping")
async def ping_magpie(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """Legacy Magpie ping — now served by SwiftPay if configured."""
    svc = SwiftPayService()
    return {"success": True, "configured": svc.is_configured(), "base_url": svc.base_url}


@router.post("/create-checkout-session")
async def create_checkout_session(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    """Map legacy Magpie checkout session to a SwiftPay order."""
    svc = SwiftPayService()
    if not svc.is_configured():
        return {"success": False, "error": "SwiftPay not configured"}

    amount = float(payload.get("amount") or payload.get("total") or 0)
    reference_no = payload.get("reference_no") or payload.get("external_id") or "magpie-" + uuid.uuid4().hex[:8]
    details = payload.get("details") or payload
    return await svc.create_order(amount=amount, reference_no=reference_no, details=details)


@router.post("/create-qr-payment")
async def create_qr_payment(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    """Map legacy Magpie QR payment to a SwiftPay order."""
    svc = SwiftPayService()
    if not svc.is_configured():
        return {"success": False, "error": "SwiftPay not configured"}
    amount = float(payload.get("amount") or 0)
    reference_no = payload.get("reference_no") or payload.get("external_id") or "magpie-qr-" + uuid.uuid4().hex[:8]
    details = payload.get("details") or payload
    return await svc.create_order(amount=amount, reference_no=reference_no, details=details)


@router.post("/checkout/sessions")
async def create_checkout_session_v2(
    payload: CheckoutSessionRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    body = payload.dict()
    if not body.get("amount") and body.get("line_items"):
        total_cents = 0
        for item in body.get("line_items", []):
            qty = int(item.get("quantity", 1))
            amt = int(item.get("amount", 0))
            total_cents += amt * qty
        body["amount"] = float(total_cents) / 100.0

    svc = SwiftPayService()
    if not svc.is_configured():
        return {"success": False, "error": "SwiftPay not configured"}

    amount = float(body.get("amount") or 0)
    reference_no = body.get("reference_no") or "magpie-" + uuid.uuid4().hex[:8]
    result = await svc.create_order(amount=amount, reference_no=reference_no, details=body)
    if not result.get("success"):
        return {"success": False, "error": result.get("error")}
    return {"success": True, "data": result}


@router.post("/create-invoice")
async def create_invoice(
    data: CreateInvoiceRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = SwiftPayService()
    if not svc.is_configured():
        return {"success": False, "error": "SwiftPay not configured"}
    amount = float(data.amount)
    reference_no = "magpie-inv-" + uuid.uuid4().hex[:8]
    details = {
        "description": data.description,
        "descriptor": data.descriptor,
        "merchant_name": data.merchant_name,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "payment_methods": data.payment_methods,
    }
    return await svc.create_order(amount=amount, reference_no=reference_no, details=details)


@router.post("/create-payment-link")
async def create_payment_link(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    svc = SwiftPayService()
    if not svc.is_configured():
        return {"success": False, "error": "SwiftPay not configured"}
    amount = float(payload.get("amount") or 0)
    reference_no = payload.get("reference_no") or "magpie-link-" + uuid.uuid4().hex[:8]
    details = payload.get("details") or payload
    return await svc.create_order(amount=amount, reference_no=reference_no, details=details)


@router.get("/checkout-status/{checkout_id}")
async def get_checkout_status(
    checkout_id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    # Legacy checkout status should be queried via SwiftPay status endpoint
    return {"success": False, "error": "Use /api/v1/swiftpay/status/{id} to query payment status"}


@router.get("/balance")
async def get_balance(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    svc = SwiftPayService()
    if not svc.is_configured():
        return {"success": False, "configured": False, "error": "SwiftPay not configured"}
    return {"success": True, "configured": True, "base_url": svc.base_url}
