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
from models.disbursements import Disbursements

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

    # Format details as a list of customer/order info as per SwiftPay documentation
    address_info = {}
    if payload.customer_email:
        address_info["email"] = payload.customer_email

    customer_info = {
        "customerName": payload.customer_name or "Customer",
        "description": payload.description,
    }
    if address_info:
        customer_info["customerAddress"] = [address_info]

    # Merge any additional details provided in the request
    if payload.details:
        customer_info.update(payload.details)

    order_result = await service.create_order(
        amount=payload.amount,
        reference_no=payload.reference_no,
        details=[customer_info],
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


@router.api_route("/webhook", methods=["GET", "POST"])
async def swiftpay_webhook(
    request: Request,
    x_access_key: Optional[str] = Query(None),
    x_reference_no: Optional[str] = Query(None),
    x_payment_status: Optional[str] = Query(None),
    x_payment_id: Optional[str] = Query(None),
    signature: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    SwiftPay webhook endpoint for payment status callbacks.
    
    Accepts both GET and POST requests with signature verification.
    Updates local transaction status based on x_payment_status:
    - EXECUTED → mark as paid
    - CANCELED, REJECTED, EXPIRED → mark as expired
    """
    service = SwiftPayService()
    if not service.is_configured():
        logger.error("SwiftPay webhook: service not configured")
        raise HTTPException(status_code=500, detail="SwiftPay is not configured")

    query = dict(request.query_params)
    payload = _extract_swiftpay_payload(request, query)
    raw_body: Optional[Dict[str, Any]] = None
    if request.method == "POST":
        content_type = (request.headers.get("content-type") or "").lower()
        if "application/json" in content_type:
            try:
                raw_body = await request.json()
            except Exception as e:
                logger.warning("SwiftPay webhook: failed to parse JSON body: %s", e)
                raw_body = None
        else:
            try:
                form_data = await request.form()
                if form_data:
                    raw_body = {key: value for key, value in form_data.items()}
            except Exception as e:
                logger.warning("SwiftPay webhook: failed to parse form body: %s", e)
                raw_body = None
        if isinstance(raw_body, dict):
            payload.update(raw_body)

    logger.info("SwiftPay webhook received: method=%s payload_keys=%s", request.method, list(payload.keys()))

    signature_value = signature or payload.get("signature") or payload.get("sign") or ""
    if not signature_value:
        logger.warning("SwiftPay webhook: missing signature")
        raise HTTPException(status_code=400, detail="missing signature")

    if not service.verify_signature(payload, signature_value):
        logger.warning("SwiftPay webhook: signature verification failed. payload=%s signature=%s", payload, signature_value)
        raise HTTPException(status_code=400, detail="invalid signature")

    reference_no = payload.get("x_reference_no") or x_reference_no or ""
    payment_id = payload.get("x_payment_id") or x_payment_id or ""
    payment_status = (payload.get("x_payment_status") or x_payment_status or "").upper()

    logger.info("SwiftPay webhook: reference_no=%s payment_id=%s payment_status=%s", reference_no, payment_id, payment_status)

    if not reference_no and not payment_id:
        logger.warning("SwiftPay webhook: missing both reference_no and payment_id")
        raise HTTPException(status_code=400, detail="missing reference_no or payment_id")

    txn_svc = TransactionsService(db)
    txn = None
    if reference_no:
        txn = await txn_svc.find_by_external_or_gateway_id(reference_no)
    if not txn and payment_id:
        txn = await txn_svc.find_by_external_or_gateway_id(payment_id)

    if not txn:
        logger.info("SwiftPay webhook: no matching transaction for reference_no=%s payment_id=%s", reference_no, payment_id)
        return {"success": True, "message": "no matching transaction"}

    if payment_id and not txn.xendit_id:
        txn.xendit_id = payment_id
        await db.commit()
        logger.info("SwiftPay webhook: updated xendit_id for transaction %s", txn.id)

    terminal_paid = payment_status == "EXECUTED" or (payload.get("x_disbursement_status") == "EXECUTED")
    terminal_failed = payment_status in {"CANCELED", "REJECTED", "EXPIRED"} or (payload.get("x_disbursement_status") in {"CANCELED", "REJECTED", "EXPIRED", "FAILED"})

    if terminal_paid:
        await txn_svc.mark_as_paid(txn, gateway_label="SwiftPay")
        logger.info("✅ SwiftPay webhook: transaction %s marked as PAID", txn.id)
    elif terminal_failed:
        await txn_svc.mark_as_expired(txn)
        logger.info("❌ SwiftPay webhook: transaction %s marked as EXPIRED", txn.id)
    else:
        logger.info("⏳ SwiftPay webhook: transaction %s status unchanged (non-terminal: %s)", txn.id, payment_status or payload.get("x_disbursement_status"))

    return {"success": True, "transaction_id": txn.id, "status": txn.status}


class SwiftPayDisbursementRequest(BaseModel):
    amount: float
    reference_no: str
    bank_code: str
    account_number: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    line1: Optional[str] = "N/A"
    line2: Optional[str] = None
    city: Optional[str] = "Manila"
    province: Optional[str] = "Metro Manila"
    postal_code: Optional[str] = "1000"
    country_code: Optional[str] = "PH"
    note: Optional[str] = ""


@router.post("/disbursements/send")
async def send_swiftpay_disbursement(
    payload: SwiftPayDisbursementRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    # 1. Check balance if using internal wallet (optional, but recommended)
    from services.wallets import WalletsService
    wallet_svc = WalletsService(db)
    user_id = str(current_user.id)
    wallet = await wallet_svc.get_or_create_wallet(user_id, "PHP")
    if wallet.balance < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    # 2. Trigger SwiftPay Disbursement
    result = await service.send_disbursement(
        reference_no=payload.reference_no,
        amount=payload.amount,
        bank_code=payload.bank_code,
        account_number=payload.account_number,
        first_name=payload.first_name,
        last_name=payload.last_name,
        middle_name=payload.middle_name,
        phone=payload.phone,
        email=payload.email,
        line1=payload.line1,
        line2=payload.line2,
        city=payload.city,
        province=payload.province,
        postal_code=payload.postal_code,
        country_code=payload.country_code,
        note=payload.note
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "SwiftPay disbursement failed"))

    # 3. Deduct funds from wallet and create transaction
    # Note: We mark as 'pending' until webhook confirms 'EXECUTED'
    await wallet_svc.adjust_balance(
        target_user_id=user_id,
        amount=-payload.amount,
        admin_id="system",
        note=f"Disbursement to {payload.account_number}: {payload.note}",
        currency="PHP"
    )

    txn_svc = TransactionsService(db)
    txn = await txn_svc.create_transaction(
        user_id=user_id,
        transaction_type="disbursement",
        amount=payload.amount,
        external_id=payload.reference_no,
        gateway_id=result.get("data", {}).get("id") or result.get("data", {}).get("paymentId") or "",
        description=payload.note or "SwiftPay Disbursement",
        customer_name=f"{payload.first_name} {payload.last_name}",
        customer_email=payload.email or "",
        status="pending",
        currency="PHP",
        idempotency_key=payload.reference_no
    )

    # 4. Create record in disbursements table for history and stats
    new_disb = Disbursements(
        user_id=user_id,
        external_id=payload.reference_no,
        xendit_id=txn.xendit_id,
        amount=payload.amount,
        currency="PHP",
        bank_code=payload.bank_code,
        account_number=payload.account_number,
        account_name=f"{payload.first_name} {payload.last_name}",
        description=payload.note or "SwiftPay Disbursement",
        status="pending",
        disbursement_type="single",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_disb)
    await db.commit()

    return {
        "success": True,
        "transaction_id": txn.id,
        "disbursement_id": new_disb.id,
        "external_id": txn.external_id,
        "status": txn.status,
        "raw": result.get("data")
    }


@router.get("/disbursements")
async def get_swiftpay_disbursements(
    merchant_id: Optional[str] = None,
    reference_no: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    params = {}
    if merchant_id: params["merchantId"] = merchant_id
    if reference_no: params["merchantReferenceNo"] = reference_no
    if status: params["Status"] = status
    if date_from: params["dateFrom"] = date_from
    if date_to: params["dateTo"] = date_to

    result = await service.get_disbursements(params)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to fetch disbursements"))

    return result


@router.get("/disbursements/{id}")
async def get_swiftpay_disbursement_by_id(
    id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    result = await service.get_disbursement_by_id(id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to fetch disbursement details"))

    return result


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
    """
    Deprecated: Use /webhook instead.
    This endpoint is kept for backward compatibility.
    """
    logger.warning("SwiftPay callback: deprecated endpoint called, forwarding to /webhook")
    return await swiftpay_webhook(
        request=request,
        x_access_key=x_access_key,
        x_reference_no=x_reference_no,
        x_payment_status=x_payment_status,
        x_payment_id=x_payment_id,
        signature=signature,
        db=db,
    )


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


@router.post("/reconcile/{identifier}")
async def reconcile_swiftpay_transaction(
    identifier: str,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: query SwiftPay for a payment/order status and reconcile locally.

    Use when callbacks fail or network issues prevent automatic reconciliation.
    """
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    # Try to find a local transaction first
    txn_svc = TransactionsService(db)
    txn = await txn_svc.find_by_external_or_gateway_id(identifier)

    # If we couldn't find a local record, we still attempt to fetch status
    result = await service.get_payment_status(identifier)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Could not fetch status from SwiftPay"))

    data = result.get("data") or {}
    # Determine terminal status from SwiftPay payload (heuristic)
    status = (data.get("status") or data.get("payment_status") or data.get("x_payment_status") or "").upper()

    if not txn:
        # Nothing to reconcile locally
        return {"success": True, "message": "No local transaction found", "remote": data}

    if status in {"EXECUTED", "PAID", "COMPLETED"}:
        ok = await txn_svc.mark_as_paid(txn, gateway_label="SwiftPay")
        return {"success": ok, "action": "marked_paid", "transaction_id": txn.id}
    elif status in {"CANCELED", "REJECTED", "EXPIRED", "FAILED"}:
        ok = await txn_svc.mark_as_expired(txn)
        return {"success": ok, "action": "marked_expired", "transaction_id": txn.id}
    else:
        return {"success": True, "action": "no_change", "remote_status": status, "transaction_id": txn.id}
