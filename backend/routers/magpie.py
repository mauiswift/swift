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
from services.magpie_service import MagpieService  # compatibility shim; tests patch this

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
    """Create a Magpie Checkout Session (V2 API).

    Backwards-compatible behavior:
    - Prefer calling MagpieService.create_session(payload=...) when available (older signatures)
    - Fall back to MagpieService.create_session(amount_cents=..., ...) for newer signature
    - If session creation fails, fall back to MagpieService.create_checkout(...)
    - Persist a transaction record for either session or checkout
    """
    body = payload.dict()
    if not body.get("amount") and body.get("line_items"):
        total_cents = 0
        for item in body.get("line_items", []):
            qty = int(item.get("quantity", 1))
            amt = int(item.get("amount", 0))
            total_cents += amt * qty
        body["amount"] = float(total_cents) / 100.0

    amount = float(body.get("amount") or 0)
    total_cents = int(round(amount * 100))
    external_id = body.get("reference_no") or ""

    magpie = MagpieService()

    payload_for_magpie = {
        "amount": amount,
        "amount_cents": total_cents,
        "currency": (body.get("currency") or "PHP").upper(),
        "line_items": body.get("line_items", []),
        "description": body.get("description") or "Checkout session",
        "success_url": body.get("success_url"),
        "cancel_url": body.get("cancel_url"),
        "customer_email": body.get("customer_email"),
        "payment_method_types": body.get("payment_method_types"),
        "external_id": external_id,
    }

    # Attempt the older payload-style signature first (tests expect this)
    try:
        res = await magpie.create_session(payload=payload_for_magpie)
    except TypeError:
        # Fall back to the newer, explicit-args signature
        res = await magpie.create_session(
            amount_cents=total_cents,
            currency=(body.get("currency") or "PHP"),
            product_name=payload_for_magpie["description"],
            success_url=payload_for_magpie["success_url"],
            cancel_url=payload_for_magpie["cancel_url"],
            client_reference_id=external_id,
            payment_method_types=payload_for_magpie.get("payment_method_types"),
        )

    # If session creation failed, fall back to checkout endpoint
    if not res.get("success"):
        try:
            checkout_res = await magpie.create_checkout(
                amount=payload_for_magpie["amount"],
                currency=payload_for_magpie["currency"],
                description=payload_for_magpie["description"],
                external_id=external_id,
                payment_method_types=payload_for_magpie.get("payment_method_types"),
            )
        except TypeError:
            # In case create_checkout expects different args, try a kw-arg variant
            checkout_res = await magpie.create_checkout(**{
                "amount": payload_for_magpie["amount"],
                "currency": payload_for_magpie["currency"],
                "description": payload_for_magpie["description"],
                "external_id": external_id,
                "payment_method_types": payload_for_magpie.get("payment_method_types"),
            })

        if not checkout_res.get("success"):
            return {"success": False, "error": checkout_res.get("error")}

        # Persist transaction and return checkout response
        txn_svc = TransactionsService(db)
        txn = await txn_svc.create_transaction(
            user_id=str(current_user.id),
            transaction_type="payment_link",
            amount=amount,
            external_id=checkout_res.get("external_id") or external_id,
            gateway_id=checkout_res.get("checkout_id") or checkout_res.get("external_id") or "",
            description=payload_for_magpie["description"],
            customer_email=payload_for_magpie["customer_email"],
            payment_url=checkout_res.get("checkout_url"),
            status="pending",
        )

        return {
            "success": True,
            "data": {
                "checkout_id": checkout_res.get("checkout_id"),
                "checkout_url": checkout_res.get("checkout_url"),
                "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
            },
        }

    # Session created successfully; persist transaction and return session data
    txn_svc = TransactionsService(db)
    txn = await txn_svc.create_transaction(
        user_id=str(current_user.id),
        transaction_type="payment_link",
        amount=amount,
        external_id=res.get("external_id") or external_id,
        gateway_id=res.get("session_id") or res.get("session_id") or "",
        description=payload_for_magpie["description"],
        customer_email=payload_for_magpie["customer_email"],
        payment_url=res.get("payment_url") or res.get("checkout_url") or "",
        status="pending",
    )

    return {
        "success": True,
        "data": {
            "session_id": res.get("session_id"),
            "payment_url": res.get("payment_url"),
            "checkout_url": res.get("checkout_url"),
            "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
        },
    }


@router.post("/create-invoice")
async def create_invoice(
    data: CreateInvoiceRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    metadata = {"descriptor": data.descriptor, "merchant_name": data.merchant_name}
    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=data.amount,
        description=data.description or "Invoice",
        transaction_type="invoice",
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        payment_methods=data.payment_methods,
        metadata=metadata,
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
