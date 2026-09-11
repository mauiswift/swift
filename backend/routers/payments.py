from typing import Any, Dict, Optional
import os
import uuid
from fastapi import APIRouter, HTTPException, Request, Depends, File, Form, UploadFile
import xmltodict
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timezone, timedelta
import secrets
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from core.database import get_db
from dependencies.auth import get_payment_user, get_payment_user_allow_test
from schemas.auth import UserResponse
from models.transactions import Transactions
from models.auth import User
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from core.config import settings
from core.constants import BANK_RECEIPTS_SUBDIR
from services.app_settings import get_payment_channels
from io import BytesIO
import qrcode
import logging

from services.alipay_service import AlipayService
from services.wechat_service import WechatService
from services.payment_gateway import gateway
from services.swiftpay_service import SwiftPayService
from utils.datetime import serialize_utc_datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

# Simple in-memory cache for demo QR images (do NOT use in prod)
_QR_CACHE: dict = {}
_CHECKOUT_CACHE: dict = {}

alipay = AlipayService()
wechat = WechatService()


class CheckoutInstitutionRequest(BaseModel):
    institution_code: str = Field(..., min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)


async def _mark_transaction_webhook_status(
    db: AsyncSession,
    *,
    external_id: Optional[str],
    provider_reference: Optional[str] = None,
    status: str,
    amount: Optional[float] = None,
) -> bool:
    """Persist a payment notification status back to the matching transaction row."""
    if not external_id:
        logger.warning("Webhook status ignored because no external_id was provided")
        return False

    stmt = (
        select(Transactions)
        .where(or_(Transactions.external_id == external_id, Transactions.xendit_id == external_id))
        .order_by(Transactions.id.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    txn = result.scalars().first()
    if not txn:
        logger.warning("Webhook status update skipped: no transaction matched external_id=%s", external_id)
        return False

    if provider_reference:
        txn.xendit_id = provider_reference
    if amount is not None:
        try:
            txn.amount = float(amount)
        except (TypeError, ValueError):
            logger.warning("Ignored invalid webhook amount %r for external_id=%s", amount, external_id)

    if status in {"paid", "completed"}:
        from services.transactions import TransactionsService
        finalized = await TransactionsService(db).mark_as_paid(txn, gateway_label="Payment gateway")
        if not finalized:
            logger.error("Payment webhook could not finalize transaction %s", txn.id)
            return False
    else:
        txn.status = status
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(txn)
    return True


@router.post("/create-legacy-qr")
async def create_legacy_qr_payment(payload: dict, current_user: UserResponse = Depends(get_payment_user_allow_test("payments:write")), db: AsyncSession = Depends(get_db)):
    """Create a payment QR for `method` in payload ('alipay' or 'wechat').

    Expected payload: {"method": "alipay|wechat", "out_trade_no": "...", "amount": 1.23}
    """
    method = (payload.get("method") or "").lower()
    out_trade_no = payload.get("out_trade_no") or payload.get("reference_id")
    amount = payload.get("amount")

    if method not in ("alipay", "wechat"):
        raise HTTPException(status_code=400, detail="method must be 'alipay' or 'wechat'")
    if not out_trade_no or not amount:
        raise HTTPException(status_code=400, detail="out_trade_no and amount are required")

    success_url = payload.get("success_url")
    cancel_url = payload.get("cancel_url")
    metadata = payload.get("metadata")

    if method == "alipay":
        result = await alipay.create_precreate_qr(
            out_trade_no=out_trade_no, amount=amount, success_url=success_url, cancel_url=cancel_url, metadata=metadata
        )
    else:
        # WeChat expects integer fen amount in scaffold; convert if float provided
        fen = int(round(float(amount) * 100))
        result = await wechat.create_native_qr(out_trade_no=out_trade_no, amount_cny=fen, success_url=success_url, cancel_url=cancel_url, metadata=metadata)

    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error") or "payment provider error")

    # If provider returned a checkout_url (Magpie / web checkout), return it directly
    checkout_url = result.get("checkout_url") or result.get("checkout_url")
    if checkout_url:
        # cache checkout url for simple browser redirect flow
        # generate a short-lived access token and append to URL
        ttl_seconds = int(getattr(settings, "checkout_ttl_seconds", 900))
        token = secrets.token_urlsafe(32)
        parsed = urlparse(checkout_url)
        qs = parse_qs(parsed.query)
        qs["token"] = [token]
        tokenized_query = urlencode(qs, doseq=True)
        tokenized_url = urlunparse(parsed._replace(query=tokenized_query))
        _CHECKOUT_CACHE[out_trade_no] = tokenized_url

        # Persist checkout URL as a transaction record for production use
        try:
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=int(getattr(settings, "checkout_ttl_seconds", 900)))

            txn = Transactions(
                user_id=str(current_user.id),
                transaction_type="checkout",
                external_id=out_trade_no,
                amount=float(amount),
                currency=result.get("currency") or "CNY",
                status="pending",
                description=(payload.get("description") or ""),
                payment_url=checkout_url,
                checkout_token=token,
                expires_at=expires_at,
                qr_code_url=result.get("qr_url") or None,
                customer_name=payload.get("customer_name"),
                customer_email=payload.get("customer_email"),
                created_at=now,
                updated_at=now,
            )
            db.add(txn)
            await db.commit()
        except Exception:
            logger.exception("Failed to persist checkout transaction")

        return {"success": True, "out_trade_no": out_trade_no, "checkout_url": tokenized_url, "raw": result.get("raw")}

    # Otherwise generate PNG and cache it in-memory for quick retrieval
    qr_text = result.get("qr_content") or result.get("qr_url") or result.get("code_url")
    buf = BytesIO()
    img = qrcode.make(qr_text)
    img.save(buf, format="PNG")
    buf.seek(0)

    _QR_CACHE[out_trade_no] = buf.getvalue()

    return {"success": True, "out_trade_no": out_trade_no, "qr_text": qr_text}



@router.get("/checkout-redirect/{out_trade_no}")
async def redirect_checkout(request: Request, out_trade_no: str, db: AsyncSession = Depends(get_db)):
    """Redirect browser to provider checkout URL previously returned by `/create`.

    This is a convenience wrapper for simple browser flows. In production you
    should persist the checkout URL server-side and validate access to it.
    """
    # Require token param for access control
    token_param = request.query_params.get("token")
    if not token_param:
        raise HTTPException(status_code=401, detail="missing token")

    # First check in-memory cache
    url = _CHECKOUT_CACHE.get(out_trade_no)

    # If not in cache, try to load from DB
    if not url and db:
        from sqlalchemy import select
        stmt = select(Transactions).where(Transactions.external_id == out_trade_no).limit(1)
        res = await db.execute(stmt)
        txn = res.scalars().first()
        if txn and txn.payment_url:
            # Enforce token match
            if getattr(txn, "checkout_token", None) != token_param:
                raise HTTPException(status_code=403, detail="invalid token")
            url = txn.payment_url
            # Append stored checkout token as `token` query param when available
            if getattr(txn, "checkout_token", None):
                try:
                    parsed = urlparse(url)
                    qs = parse_qs(parsed.query)
                    qs["token"] = [txn.checkout_token]
                    new_query = urlencode(qs, doseq=True)
                    url = urlunparse(parsed._replace(query=new_query))
                except Exception:
                    logger.exception("Failed to append token to checkout URL")
            # Append stored checkout token as `token` query param when available
            if getattr(txn, "checkout_token", None):
                try:
                    parsed = urlparse(url)
                    qs = parse_qs(parsed.query)
                    qs["token"] = [txn.checkout_token]
                    new_query = urlencode(qs, doseq=True)
                    url = urlunparse(parsed._replace(query=new_query))
                except Exception:
                    logger.exception("Failed to append token to checkout URL")

    if not url:
        raise HTTPException(status_code=404, detail="checkout url not found")

    # Enforce TTL using stored transaction created_at when possible
    ttl_seconds = int(getattr(settings, "checkout_ttl_seconds", 900))
    try:
        if db:
            from sqlalchemy import select
            stmt = select(Transactions).where(Transactions.external_id == out_trade_no).limit(1)
            res = await db.execute(stmt)
            txn = res.scalars().first()
            if txn:
                # Token must match stored token
                if getattr(txn, "checkout_token", None) != token_param:
                    raise HTTPException(status_code=403, detail="invalid token")
                if txn.expires_at:
                    if datetime.now(timezone.utc) > txn.expires_at:
                        raise HTTPException(status_code=410, detail="checkout url expired")
                elif txn.created_at:
                    age = datetime.now(timezone.utc) - txn.created_at
                    if age > timedelta(seconds=ttl_seconds):
                        raise HTTPException(status_code=410, detail="checkout url expired")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error checking checkout TTL")

    return RedirectResponse(url)


@router.get("/qr/{out_trade_no}")
async def get_qr(out_trade_no: str):
    """Return a PNG QR image for a previously-created `out_trade_no`.

    This returns an in-memory image created by `/create`. In production you
    should store images on disk or generate them on-demand.
    """
    img = _QR_CACHE.get(out_trade_no)
    if not img:
        raise HTTPException(status_code=404, detail="QR not found")
    return StreamingResponse(BytesIO(img), media_type="image/png")


@router.post("/notify/alipay")
async def notify_alipay(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    data = dict(form)
    ok = await alipay.verify_notify(data)
    if not ok:
        logger.warning("Alipay notify failed verification: %s", data)
        return JSONResponse({"success": False, "error": "signature verification failed"})

    trade_status = (data.get("trade_status") or "").upper()
    external_id = data.get("out_trade_no") or data.get("merchant_out_order_no")
    provider_reference = data.get("trade_no") or data.get("out_trade_no")
    amount_raw = data.get("total_amount") or data.get("amount")

    try:
        amount = float(amount_raw) if amount_raw is not None and amount_raw != "" else None
    except (TypeError, ValueError):
        amount = None

    if trade_status in {"TRADE_SUCCESS", "TRADE_FINISHED"}:
        db_status = "paid"
    elif trade_status in {"TRADE_CLOSED", "TRADE_CANCELED", "TRADE_FAILED"}:
        db_status = "failed"
    else:
        db_status = "pending"

    await _mark_transaction_webhook_status(
        db,
        external_id=external_id,
        provider_reference=provider_reference,
        status=db_status,
        amount=amount,
    )

    return JSONResponse({"success": True, "status": db_status})


@router.post("/notify/wechat")
async def notify_wechat(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    xml = body.decode("utf-8")
    ok = await wechat.verify_notify(xml)
    if not ok:
        logger.warning("WeChat notify failed verification")
        return StreamingResponse(content=b"<xml><return_code>FAIL</return_code></xml>", media_type="application/xml")

    payload = xmltodict.parse(xml).get("xml", {})
    trade_state = (payload.get("trade_state") or "").upper()
    result_code = (payload.get("result_code") or "").upper()
    external_id = payload.get("out_trade_no")
    provider_reference = payload.get("transaction_id")
    amount_raw = payload.get("total_fee")

    try:
        amount = float(amount_raw) / 100.0 if amount_raw not in (None, "") else None
    except (TypeError, ValueError):
        amount = None

    if trade_state in {"SUCCESS", "FINISHED"} or result_code == "SUCCESS":
        db_status = "paid"
    elif trade_state in {"CLOSED", "REVOKED", "PAYERROR"}:
        db_status = "failed"
    else:
        db_status = "pending"

    await _mark_transaction_webhook_status(
        db,
        external_id=external_id,
        provider_reference=provider_reference,
        status=db_status,
        amount=amount,
    )

    return StreamingResponse(content=b"<xml><return_code>SUCCESS</return_code></xml>", media_type="application/xml")


class CreatePaymentPayload(BaseModel):
    amount: float
    description: str = ""
    currency: str = "PHP"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UpdatePaymentStatusPayload(BaseModel):
    status: str = "pending"
    provider_reference: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/create")
async def create_payment(
    request: Request,
    payload: CreatePaymentPayload = None,
    receipt: UploadFile = File(None),
    current_user: UserResponse = Depends(get_payment_user_allow_test("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create payment. Supports JSON body (application/json) or multipart/form-data with an optional `receipt` file.

    If a receipt is provided it will be saved under `static/uploads/{BANK_RECEIPTS_SUBDIR}` and the path
    included in the payment metadata as `receipt_path`.
    """
    try:
        # Determine content type to parse payload accordingly
        content_type = request.headers.get("content-type", "")
        metadata = {}
        if content_type.startswith("multipart/form-data"):
            form = await request.form()
            if "method" in form or "out_trade_no" in form or "reference_id" in form:
                legacy_payload = {
                    "method": form.get("method"),
                    "out_trade_no": form.get("out_trade_no") or form.get("reference_id"),
                    "amount": form.get("amount"),
                    "success_url": form.get("success_url"),
                    "cancel_url": form.get("cancel_url"),
                    "description": form.get("description"),
                    "metadata": {
                        key[5:]: value
                        for key, value in form.items()
                        if key.startswith("meta_")
                    },
                }
                return await create_legacy_qr_payment(legacy_payload, current_user=current_user, db=db)
            # FastAPI already exposes `receipt` as UploadFile param when declared, but form may be used
            amount = float(form.get("amount", 0))
            description = form.get("description", "")
            currency = form.get("currency", "PHP")
            # collect any metadata fields prefixed with meta_
            for k, v in form.items():
                if k.startswith("meta_"):
                    metadata[k[5:]] = v

            # Handle receipt file saving
            receipt_path = None
            if receipt and getattr(receipt, "filename", None):
                uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", BANK_RECEIPTS_SUBDIR)
                os.makedirs(uploads_dir, exist_ok=True)
                ext = os.path.splitext(receipt.filename)[1] or ".bin"
                filename = f"{uuid.uuid4().hex}{ext}"
                file_path = os.path.join(uploads_dir, filename)
                content = await receipt.read()
                with open(file_path, "wb") as f:
                    f.write(content)
                receipt_path = f"/uploads/{BANK_RECEIPTS_SUBDIR}/{filename}"
                metadata["receipt_path"] = receipt_path

            # Call gateway
            result = await gateway.create_payment(
                db,
                user_id=str(current_user.id),
                amount=amount,
                description=description,
                transaction_type="bank_deposit",
                customer_name=metadata.get("customer_name", ""),
                customer_email=metadata.get("customer_email", ""),
                external_id=metadata.get("external_id"),
                payment_methods=metadata.get("payment_methods", []),
                metadata=metadata,
            )
            payment_event_bus.publish({
                "event_type": "payment_created",
                "payment_id": result.get("transaction_id") or result.get("id") if isinstance(result, dict) else None,
                "user_id": str(current_user.id),
                "user_name": getattr(current_user, "name", None) or str(current_user.id),
                "amount": amount,
                "currency": currency,
                "description": description,
            })
            return result
        else:
            # JSON body
            body = await request.json()
            if isinstance(body, dict) and ("method" in body or "out_trade_no" in body or "reference_id" in body):
                return await create_legacy_qr_payment(body, current_user=current_user, db=db)
            payload = CreatePaymentPayload(**body)
            result = await gateway.create_payment(
                db,
                user_id=str(current_user.id),
                amount=payload.amount,
                description=payload.description,
                transaction_type="invoice",
                customer_name=payload.metadata.get("customer_name", ""),
                customer_email=payload.metadata.get("customer_email", ""),
                external_id=payload.metadata.get("external_id"),
                payment_methods=payload.metadata.get("payment_methods"),
                metadata=payload.metadata,
            )
            payment_event_bus.publish({
                "event_type": "payment_created",
                "payment_id": result.get("transaction_id") or result.get("id") if isinstance(result, dict) else None,
                "user_id": str(current_user.id),
                "user_name": getattr(current_user, "name", None) or str(current_user.id),
                "amount": payload.amount,
                "currency": payload.currency,
                "description": payload.description,
            })
            return result
    except ValueError as exc:
        logger.warning("Rejected payment creation: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to create payment")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: UserResponse = Depends(get_payment_user_allow_test("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.get_payment(payment_id=payment_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{payment_id}/status")
async def update_payment_status(
    payment_id: str,
    payload: UpdatePaymentStatusPayload,
    current_user: UserResponse = Depends(get_payment_user_allow_test("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.update_payment_status(
            payment_id=payment_id,
            status=payload.status,
            provider_reference=payload.provider_reference or None,
            metadata=payload.metadata,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/checkout/{identifier}")
async def get_checkout_payment(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment details for checkout page (unauthenticated public endpoint).
    
    Searches by multiple identifiers:
    - external_id (payment reference from xend)
    - xendit_id (gateway payment ID)
    - transaction ID (numeric)
    - external_id with retry suffix (e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f)
    """
    try:
        # Public checkout identifiers must be opaque provider/reference IDs.
        conditions = [
            func.lower(Transactions.external_id) == identifier.lower(),
            func.lower(Transactions.xendit_id) == identifier.lower(),
            func.lower(Transactions.payment_url) == identifier.lower(),
            func.lower(Transactions.qr_code_url) == identifier.lower(),
        ]
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout payment not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Try to fetch merchant branding
        merchant_name = "Merchant"
        merchant_logo_url = None
        bank_name = None
        bank_account_number = None
        bank_account_name = None
        try:
            # 1. Try to find the AdminUser to get organization_id
            admin_stmt = select(AdminUser).where(AdminUser.telegram_id == txn.user_id).limit(1)
            admin_res = await db.execute(admin_stmt)
            admin = admin_res.scalar_one_or_none()

            if admin and admin.organization_id:
                # 2. Get MerchantApiConfig for branding
                cfg_stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == admin.organization_id).limit(1)
                cfg_res = await db.execute(cfg_stmt)
                cfg = cfg_res.scalar_one_or_none()
                if cfg:
                    merchant_name = cfg.store_name or admin.organization_name or merchant_name
                    merchant_logo_url = cfg.store_logo_url
                bank_name = admin.bank_name
                bank_account_number = admin.bank_account_number
                bank_account_name = admin.bank_account_name
            elif admin:
                merchant_name = admin.organization_name or admin.name or admin.telegram_username or merchant_name
                bank_name = admin.bank_name
                bank_account_number = admin.bank_account_number
                bank_account_name = admin.bank_account_name
            else:
                # Fallback to User table
                merchant_stmt = select(User.name).where(User.id == txn.user_id).limit(1)
                merchant_res = await db.execute(merchant_stmt)
                name = merchant_res.scalar()
                if name:
                    merchant_name = name
        except Exception as e:
            logger.error(f"Error fetching merchant branding for txn {txn.id}: {e}")

        if (txn.currency or "").upper() == "PHP" and float(txn.amount or 0) > 50000:
            bank_name = "Security Bank Corporation"
            bank_account_number = "0000068888173"
            bank_account_name = "SwiftPay Ventures Inc."
        elif (txn.currency or "").upper() == "KRW":
            bank_name = "Toss Bank"
            bank_account_number = "1908-1618-8260"
            bank_account_name = "SwiftPay Ventures Inc."

        logger.info(f"Checkout payment retrieved: {identifier} -> txn_id={txn.id}")
        return {
            "success": True,
            "id": txn.id,
            "external_id": txn.external_id,
            "transaction_type": txn.transaction_type,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "status": txn.status,
            "description": txn.description or "",
            "payment_url": txn.payment_url or "",
            "qr_code_url": txn.qr_code_url or "",
            "customer_name": txn.customer_name or "",
            "customer_email": txn.customer_email or "",
            "merchant_name": merchant_name,
            "merchant_logo_url": merchant_logo_url,
            "bank_name": bank_name,
            "bank_account_number": bank_account_number,
            "bank_account_name": bank_account_name,
            "created_at": serialize_utc_datetime(txn.created_at),
            "updated_at": serialize_utc_datetime(txn.updated_at),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout payment {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment") from exc


@router.get("/checkout/{identifier}/status")
async def get_checkout_status(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment status for polling (unauthenticated public endpoint).
    
    Returns minimal payment status information for real-time updates on the checkout page.
    Searches by multiple identifiers including retry suffix pattern matching.
    """
    try:
        # Try to match by external_id, xendit_id, or transaction ID (CASE-INSENSITIVE for strings)
        conditions = [
            func.lower(Transactions.external_id) == identifier.lower(),
            func.lower(Transactions.xendit_id) == identifier.lower(),
            func.lower(Transactions.payment_url) == identifier.lower(),
            func.lower(Transactions.qr_code_url) == identifier.lower(),
        ]
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout status not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return {
            "status": txn.status,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "payment_url": txn.payment_url or "",
            "updated_at": serialize_utc_datetime(txn.updated_at),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout status {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment status") from exc


@router.get("/checkout/{identifier}/institutions")
async def get_checkout_institutions(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch available financial institutions for this checkout (public)."""
    try:
        stmt = select(Transactions).where(
            or_(
                func.lower(Transactions.external_id) == identifier.lower(),
                func.lower(Transactions.xendit_id) == identifier.lower(),
                func.lower(Transactions.payment_url) == identifier.lower(),
                func.lower(Transactions.qr_code_url) == identifier.lower(),
            )
        ).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()

        if not txn:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payload.amount is not None:
            txn.amount = payload.amount
            txn.updated_at = datetime.now(timezone.utc)
            await db.flush()

        # If it's an international wallet routed to Magpie, don't return PH banks
        if txn.transaction_type in ["alipay_qr", "wechat_qr"]:
            # Optionally return specific Magpie wallet info here if needed
            return {"success": True, "data": []}

        res = await gateway.swift.get_institutions(currency=txn.currency or "PHP")
        if not res.get("success"):
            return {"success": True, "data": []} # Return empty instead of error for UX

        if (txn.currency or "").upper() == "PHP":
            channels = await get_payment_channels(db)
            enabled_institutions = channels.get("PHP", {}).get("checkout_institutions")
            if isinstance(enabled_institutions, list):
                enabled_codes = {str(code).upper() for code in enabled_institutions}
                res["data"] = [item for item in res.get("data", []) if str(item.get("code", "")).upper() in enabled_codes]
                returned_codes = {str(item.get("code", "")).upper() for item in res["data"]}
                if "maya" in channels.get("PHP", {}).get("checkout", []) and "MAYA" not in returned_codes:
                    res["data"].insert(0, {"id": "MAYA", "code": "MAYA", "name": "Maya", "enabled": True, "loginMethod": "redirect"})
                if "qr_code" in channels.get("PHP", {}).get("checkout", []) and "QRPH" not in returned_codes:
                    res["data"].insert(0, {"id": "QRPH", "code": "QRPH", "name": "QR Ph", "logoUrl": "/logos/qrph.svg", "enabled": True, "loginMethod": "qr"})
                if "bank_transfer" in channels.get("PHP", {}).get("checkout", []) and "NETBANK" not in returned_codes:
                    res["data"].append({"id": "NETBANK", "code": "NETBANK", "name": "NetBank", "logoUrl": "/logos/netbank.svg", "enabled": True, "loginMethod": "redirect"})
                if "BDO" in enabled_codes and "BDO" not in returned_codes:
                    res["data"].append({"id": "BDO", "code": "BDO", "name": "BDO", "logoUrl": "/logos/bdo.svg", "enabled": True, "loginMethod": "redirect"})
        return res
    except Exception as exc:
        logger.error(f"Error fetching institutions for {identifier}: {exc}")
        return {"success": False, "error": "Could not fetch payment methods"}


@router.post("/checkout/{identifier}/institution")
async def select_checkout_institution(
    identifier: str,
    payload: CheckoutInstitutionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create the bank-specific SwiftPay redirect for a public PHP checkout."""
    txn = await db.get(Transactions, int(identifier)) if identifier.isdigit() else None
    if not txn:
        stmt = select(Transactions).where(
            or_(
                func.lower(Transactions.external_id) == identifier.lower(),
                func.lower(Transactions.xendit_id) == identifier.lower(),
                func.lower(Transactions.payment_url) == identifier.lower(),
                func.lower(Transactions.qr_code_url) == identifier.lower(),
            )
        ).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    if (txn.currency or "").upper() != "PHP":
        raise HTTPException(status_code=400, detail="Institution selection is only available for PHP payments")

    institution_code = payload.institution_code.strip().upper()
    channels = await get_payment_channels(db)
    enabled_institutions = channels.get("PHP", {}).get("checkout_institutions")
    qrph_enabled = "qr_code" in channels.get("PHP", {}).get("checkout", [])
    bank_transfer_enabled = "bank_transfer" in channels.get("PHP", {}).get("checkout", [])
    if isinstance(enabled_institutions, list) and institution_code not in {"QRPH", "NETBANK"} and institution_code not in {str(code).upper() for code in enabled_institutions}:
        raise HTTPException(status_code=400, detail="The selected bank is currently unavailable")
    if institution_code == "QRPH" and not qrph_enabled:
        raise HTTPException(status_code=400, detail="QR PH is currently unavailable")
    if institution_code == "NETBANK" and not bank_transfer_enabled:
        raise HTTPException(status_code=400, detail="Netbank is currently unavailable")
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    if institution_code in {"GCASH", "QRPH"}:
        qr_result = await service.generate_qrph(
            amount=float(txn.amount),
            reference_no=txn.external_id,
            currency="PHP",
            qr_type="P2M",
        )
        if not qr_result.get("success"):
            raise HTTPException(status_code=502, detail=qr_result.get("error", "Could not create GCash QRPH checkout"))

        qr_data = qr_result.get("data") or {}
        if not isinstance(qr_data, dict):
            raise HTTPException(status_code=502, detail="SwiftPay returned an invalid QRPH response")
        qr_code = (
            qr_data.get("qrCode")
            or qr_data.get("qr_code")
            or qr_data.get("qrCodeUrl")
            or qr_data.get("qr_code_url")
            or qr_data.get("qrImage")
            or qr_data.get("qr_image")
            or qr_data.get("paymentUrl")
            or qr_data.get("payment_url")
        )
        qr_content = (
            qr_data.get("qrContent")
            or qr_data.get("qr_content")
            or qr_data.get("qrPayload")
            or qr_data.get("qr_payload")
            or qr_data.get("emvco")
            or qr_data.get("payload")
            or qr_data.get("codeUrl")
            or qr_data.get("code_url")
        )
        deep_link = (
            qr_data.get("gcashDeepLink")
            or qr_data.get("gcash_deep_link")
            or qr_data.get("deepLink")
            or qr_data.get("deep_link")
            or qr_data.get("deeplink")
        )
        if not qr_code and not qr_content and not deep_link:
            raise HTTPException(status_code=502, detail="SwiftPay did not return a QRPH payload")

        if institution_code == "GCASH":
            deep_link = deep_link or "gcash://com.mynt.gcash/app/006300000700"

        txn.payment_url = deep_link or qr_code or qr_content
        txn.qr_code_url = qr_code or qr_content
        txn.transaction_type = "swiftpay_qr"
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return {
            "success": True,
            "payment_method": "gcash" if institution_code == "GCASH" else "qrph",
            "deep_link": deep_link,
            "qr_code": qr_code,
            "qr_content": qr_content,
            "redirect_url": (
                deep_link
                if institution_code == "GCASH" and deep_link
                else f"/checkout/{txn.external_id}?payment_method=qrph"
            ),
        }

    order_result = await service.create_order(
        amount=float(txn.amount),
        reference_no=txn.external_id,
        details={
            "description": txn.description or "",
            "customer_name": txn.customer_name or "",
            "customer_email": txn.customer_email or "",
        },
        currency="PHP",
        generate_customer_redirect_url=True,
        institution_code=institution_code,
    )
    if not order_result.get("success"):
        raise HTTPException(status_code=502, detail=order_result.get("error", "Could not create bank checkout"))

    order_data = order_result.get("data") or {}
    redirect_url = (
        order_data.get("institutionRedirectUrl")
        or order_data.get("institution_redirect_url")
        or order_data.get("bankRedirectUrl")
        or order_data.get("bank_redirect_url")
        or order_data.get("customerRedirectUrl")
        or order_data.get("customer_redirect_url")
        or ""
    )
    parsed_redirect = urlparse(str(redirect_url)) if redirect_url else None
    if not redirect_url or not parsed_redirect or parsed_redirect.scheme not in {"http", "https"} or not parsed_redirect.netloc:
        raise HTTPException(status_code=502, detail="SwiftPay did not return a direct bank payment URL")
    if parsed_redirect.path.rstrip("/").endswith(f"/checkout/{txn.external_id}"):
        raise HTTPException(status_code=502, detail="SwiftPay returned its generic checkout URL instead of a bank payment URL")

    gateway_id = order_data.get("paymentId") or order_data.get("payment_id") or order_data.get("id")
    if gateway_id:
        txn.xendit_id = gateway_id
    txn.payment_url = redirect_url
    txn.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"success": True, "redirect_url": redirect_url}
