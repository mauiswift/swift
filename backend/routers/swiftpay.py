import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.swiftpay_service import SwiftPayService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/swiftpay", tags=["swiftpay"])


class SwiftPayOrderRequest(BaseModel):
    amount: float
    reference_no: str
    description: str = ""
    currency: str = "PHP"
    institution_code: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class SwiftPayStatusResponse(BaseModel):
    success: bool
    transaction_id: Optional[int] = None
    external_id: Optional[str] = None
    gateway_id: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    payment_url: Optional[str] = None


@router.get("/config")
async def get_swiftpay_config(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    service = SwiftPayService()
    return {
        "success": True,
        "configured": service.is_configured(),
        "mode": service.mode,
        "base_url": service.base_url,
        "callback_url": service.callback_url,
    }


@router.post("/create-order")
async def create_swiftpay_order(
    payload: SwiftPayOrderRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than zero")
    if not payload.reference_no:
        raise HTTPException(status_code=400, detail="reference_no is required")

    order_result = await service.create_order(
        amount=payload.amount,
        reference_no=payload.reference_no,
        details={
            "description": payload.description,
            "customer_name": payload.customer_name,
            "customer_email": payload.customer_email,
            **(payload.details or {}),
        },
        currency=payload.currency,
        generate_customer_redirect_url=True,
        institution_code=payload.institution_code,
    )

    if not order_result.get("success"):
        raise HTTPException(status_code=400, detail=order_result.get("error", "SwiftPay create order failed"))

    order_data = order_result.get("data") or {}
    redirect_url = order_data.get("customerRedirectUrl") or order_data.get("customer_redirect_url") or ""
    gateway_id = order_data.get("paymentId") or order_data.get("payment_id") or order_data.get("payment_id") or ""

    txn_svc = TransactionsService(db)
    txn = await txn_svc.create_transaction(
        user_id=str(current_user.id),
        transaction_type="swiftpay_order",
        amount=payload.amount,
        external_id=payload.reference_no,
        gateway_id=gateway_id,
        description=payload.description or "SwiftPay order",
        customer_name=payload.customer_name or "",
        customer_email=payload.customer_email or "",
        payment_url=redirect_url,
        status="pending",
        currency=payload.currency,
        idempotency_key=payload.reference_no,
    )

    return {
        "success": True,
        "transaction_id": txn.id,
        "external_id": txn.external_id,
        "gateway_id": txn.xendit_id,
        "redirect_url": redirect_url,
        "status": txn.status,
        "raw": order_data,
    }


@router.get("/status/{identifier}")
async def get_swiftpay_transaction_status(
    identifier: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    txn_svc = TransactionsService(db)
    txn = await txn_svc.find_by_external_or_gateway_id(identifier)
    if not txn:
        raise HTTPException(status_code=404, detail="transaction not found")
    return {
        "success": True,
        "transaction_id": txn.id,
        "external_id": txn.external_id,
        "gateway_id": txn.xendit_id,
        "amount": float(txn.amount),
        "currency": txn.currency,
        "status": txn.status,
        "description": txn.description,
        "customer_name": txn.customer_name,
        "customer_email": txn.customer_email,
        "payment_url": txn.payment_url,
    }


def _extract_swiftpay_payload(request: Request, query_params: dict[str, str]) -> Dict[str, Any]:
    payload: Dict[str, Any] = {}
    for key, value in query_params.items():
        payload[key] = value
    return payload


@router.api_route("/callback", methods=["GET", "POST"])
async def swiftpay_callback(
    request: Request,
    x_access_key: Optional[str] = Query(None),
    x_reference_no: Optional[str] = Query(None),
    x_payment_status: Optional[str] = Query(None),
    x_payment_id: Optional[str] = Query(None),
    signature: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=500, detail="SwiftPay is not configured")

    query = dict(request.query_params)
    payload = _extract_swiftpay_payload(request, query)
    raw_body: Optional[Dict[str, Any]] = None
    if request.method == "POST":
        try:
            raw_body = await request.json()
        except Exception:
            raw_body = None
        if isinstance(raw_body, dict):
            payload.update(raw_body)

    signature_value = signature or payload.get("signature") or payload.get("sign") or ""
    if not signature_value:
        raise HTTPException(status_code=400, detail="missing signature")

    if not service.verify_signature(payload, signature_value):
        logger.warning("SwiftPay callback signature mismatch payload=%s", payload)
        raise HTTPException(status_code=400, detail="invalid signature")

    reference_no = payload.get("x_reference_no") or x_reference_no or ""
    payment_id = payload.get("x_payment_id") or x_payment_id or ""
    payment_status = (payload.get("x_payment_status") or x_payment_status or "").upper()

    if not reference_no and not payment_id:
        raise HTTPException(status_code=400, detail="missing reference_no or payment_id")

    txn_svc = TransactionsService(db)
    txn = None
    if reference_no:
        txn = await txn_svc.find_by_external_or_gateway_id(reference_no)
    if not txn and payment_id:
        txn = await txn_svc.find_by_external_or_gateway_id(payment_id)

    if not txn:
        logger.info("SwiftPay callback: no matching transaction for reference_no=%s payment_id=%s", reference_no, payment_id)
        return {"success": True, "message": "no matching transaction"}

    if payment_id and not txn.xendit_id:
        txn.xendit_id = payment_id
        await db.commit()

    terminal_paid = payment_status == "EXECUTED"
    terminal_failed = payment_status in {"CANCELED", "REJECTED", "EXPIRED"}

    if terminal_paid:
        await txn_svc.mark_as_paid(txn, gateway_label="SwiftPay")
        logger.info("SwiftPay callback marked transaction %s as paid", txn.id)
    elif terminal_failed:
        await txn_svc.mark_as_expired(txn)
        logger.info("SwiftPay callback marked transaction %s as expired", txn.id)
    else:
        logger.info("SwiftPay callback ignored non-terminal status=%s for txn %s", payment_status, txn.id)

    return {"success": True, "transaction_id": txn.id, "status": txn.status}


@router.get("/institutions")
async def get_swiftpay_institutions(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")
    result = await service.get_institutions()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Could not fetch institutions"))
    return result
