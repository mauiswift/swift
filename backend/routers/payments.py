from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Request, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timezone, timedelta
import secrets
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from models.transactions import Transactions
from models.auth import User
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from core.config import settings
from io import BytesIO
import qrcode
import logging

from services.alipay_service import AlipayService
from services.wechat_service import WechatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

# Simple in-memory cache for demo QR images (do NOT use in prod)
_QR_CACHE: dict = {}
_CHECKOUT_CACHE: dict = {}

alipay = AlipayService()
wechat = WechatService()


@router.post("/create")
async def create_payment(payload: dict, current_user: UserResponse = Depends(get_payment_user("payments:write")), db: AsyncSession = Depends(get_db)):
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
async def notify_alipay(request: Request):
    form = await request.form()
    data = dict(form)
    ok = await alipay.verify_notify(data)
    if not ok:
        logger.warning("Alipay notify failed verification: %s", data)
        return JSONResponse({"success": False})
    # TODO: update your order DB here based on `data`
    return JSONResponse({"success": True})


@router.post("/notify/wechat")
async def notify_wechat(request: Request):
    body = await request.body()
    xml = body.decode("utf-8")
    ok = await wechat.verify_notify(xml)
    if not ok:
        logger.warning("WeChat notify failed verification")
        return StreamingResponse(content=b"<xml><return_code>FAIL</return_code></xml>", media_type="application/xml")
    # TODO: update your order DB here
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
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
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
            return await gateway.create_payment(
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
        else:
            # JSON body
            body = await request.json()
            payload = CreatePaymentPayload(**body)
            return await gateway.create_payment(
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
    except ValueError as exc:
        logger.warning("Rejected payment creation: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to create payment")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
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
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
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
        # Try to match by external_id, xendit_id, or transaction ID (CASE-INSENSITIVE for strings)
        conditions = [
            func.lower(Transactions.external_id) == identifier.lower(),
            func.lower(Transactions.xendit_id) == identifier.lower(),
        ]
        
        # Also try numeric ID
        try:
            txn_id = int(identifier)
            conditions.append(Transactions.id == txn_id)
        except ValueError:
            pass
        
        # Also try to match payments that START WITH the identifier (for retry suffix handling)
        # e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f
        conditions.append(func.lower(Transactions.external_id).like(f"{identifier.lower()}-%"))
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout payment not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Try to fetch merchant branding
        merchant_name = "SwiftPay Merchant"
        merchant_logo_url = None
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
            elif admin:
                merchant_name = admin.name or admin.telegram_username or merchant_name
            else:
                # Fallback to User table
                merchant_stmt = select(User.name).where(User.id == txn.user_id).limit(1)
                merchant_res = await db.execute(merchant_stmt)
                name = merchant_res.scalar()
                if name:
                    merchant_name = name
        except Exception as e:
            logger.error(f"Error fetching merchant branding for txn {txn.id}: {e}")

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
            "created_at": txn.created_at.isoformat() if txn.created_at else None,
            "updated_at": txn.updated_at.isoformat() if txn.updated_at else None,
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
        ]
        
        # Also try numeric ID
        try:
            txn_id = int(identifier)
            conditions.append(Transactions.id == txn_id)
        except ValueError:
            pass
        
        # Also try to match payments that START WITH the identifier (for retry suffix handling)
        # e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f
        conditions.append(func.lower(Transactions.external_id).like(f"{identifier.lower()}-%"))
        
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
                func.lower(Transactions.xendit_id) == identifier.lower()
            )
        ).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()

        if not txn:
            raise HTTPException(status_code=404, detail="Payment not found")

        # If it's an international wallet routed to Magpie, don't return PH banks
        if txn.transaction_type in ["alipay_qr", "wechat_qr"]:
            # Optionally return specific Magpie wallet info here if needed
            return {"success": True, "data": []}

        res = await gateway.swift.get_institutions()
        if not res.get("success"):
            return {"success": True, "data": []} # Return empty instead of error for UX

        return res
    except Exception as exc:
        logger.error(f"Error fetching institutions for {identifier}: {exc}")
        return {"success": False, "error": "Could not fetch payment methods"}
