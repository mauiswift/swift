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

from services.payment_gateway import gateway as payment_gateway

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
    db: AsyncSession = Depends(get_db),
):
    """Map legacy Magpie checkout session to a SwiftPay order."""
    amount = float(payload.get("amount") or payload.get("total") or 0)
    external_id = payload.get("reference_no") or payload.get("external_id") or ""
    description = payload.get("description") or "Checkout session"

    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=amount,
        description=description,
        transaction_type="payment_link",
        external_id=external_id,
        payment_methods=payload.get("payment_method_types"),
    )


@router.post("/create-qr-payment")
async def create_qr_payment(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Map legacy Magpie QR payment to a SwiftPay order."""
    amount = float(payload.get("amount") or 0)
    external_id = payload.get("reference_no") or payload.get("external_id") or ""

    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=amount,
        description=payload.get("description") or "QR payment",
        transaction_type="qr_code",
        external_id=external_id,
        payment_methods=["qrph"],
    )


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

    amount = float(body.get("amount") or 0)
    external_id = body.get("reference_no") or ""

    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=amount,
        description=body.get("description") or "Checkout session v2",
        transaction_type="payment_link",
        external_id=external_id,
        customer_email=body.get("customer_email"),
        payment_methods=body.get("payment_method_types"),
    )


@router.post("/create-invoice")
async def create_invoice(
    data: CreateInvoiceRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=data.amount,
        description=data.description or "Invoice",
        transaction_type="invoice",
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        payment_methods=data.payment_methods,
    )


@router.post("/create-payment-link")
async def create_payment_link(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    amount = float(payload.get("amount") or 0)
    external_id = payload.get("reference_no") or ""

    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=amount,
        description=payload.get("description") or "Payment link",
        transaction_type="payment_link",
        external_id=external_id,
        customer_name=payload.get("customer_name"),
        customer_email=payload.get("customer_email"),
        payment_methods=payload.get("payment_methods"),
    )


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
