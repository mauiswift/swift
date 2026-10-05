import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor
from services.swiftpay_service import SwiftPayService
from services.checkout_urls import canonicalize_checkout_url
from core.config import settings
from services.transactions import NON_CUSTOMER_PAYMENT_TYPES, TransactionsService, is_customer_payment
from models.transactions import Transactions
from models.disbursements import Disbursements
from models.merchant_api_config import MerchantApiConfig
from models.webhook_events import WebhookEvent
from services.app_settings import get_enabled_collection_currencies, get_payment_channels

from services.payment_gateway import gateway as payment_gateway

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/xend", tags=["xend"])


class CreatePaymentRequest(BaseModel):
    amount: float
    currency: Optional[str] = None
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


SUPPORTED_PAYMENT_METHODS = [
    "card",
    "gcash",
    "maya",
    "bank_transfer",
    "qr_code",
    "qrph",
    "cash",
    "wallet",
    "alipay",
    "wechat",
    "unionpay",
    "visa",
    "mastercard",
    "kakao",
    "kakaopay",
    "naverpay",
    "payco",
    "toss",
    "tosspay",
]


@router.get("/payment-methods")
async def get_supported_payment_methods(
    currency: str = Query("PHP", min_length=3, max_length=4),
    db: AsyncSession = Depends(get_db),
):
    normalized_currency = currency.upper()
    enabled_currencies = await get_enabled_collection_currencies(db)
    if normalized_currency not in enabled_currencies:
        raise HTTPException(status_code=400, detail="Collection currency is not enabled")
    channels = await get_payment_channels(db)
    return {
        "success": True,
        "source": "configuration",
        "payment_methods": channels.get(normalized_currency, {}).get("checkout", []),
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


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=90),
    currency: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated stats for the main dashboard page."""
    user_id = str(current_user.id)
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days - 1)).date()
    since = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

    if currency:
        currency = currency.upper()
        if currency not in {"PHP", "CNY", "KRW", "USDT"}:
            raise HTTPException(status_code=400, detail="Unsupported currency")
    else:
        currency_result = await db.execute(
            select(MerchantApiConfig.collection_currency)
            .where(MerchantApiConfig.organization_id == current_user.organization_id)
            .order_by(MerchantApiConfig.user_id.is_(None).desc(), MerchantApiConfig.id.asc())
            .limit(1)
        ) if current_user.organization_id else None
        currency = (currency_result.scalar() if currency_result else None) or "PHP"
        currency = currency.upper()

    # ── Fetch transactions within window ──────────────────────────
    non_customer_types = tuple(value.lower() for value in NON_CUSTOMER_PAYMENT_TYPES)
    txn_result = await db.execute(
        select(Transactions).where(
            Transactions.user_id == user_id,
            Transactions.created_at >= since,
            func.lower(Transactions.transaction_type).not_in(non_customer_types),
            Transactions.currency == currency,
        )
    )
    txns = [
        txn
        for txn in txn_result.scalars().all()
        if is_customer_payment(txn)
    ]

    # ── Fetch disbursements within window ─────────────────────────
    disb_result = await db.execute(
        select(Disbursements).where(
            Disbursements.user_id == user_id,
            Disbursements.created_at >= since,
            Disbursements.currency == currency,
        )
    )
    disbs = disb_result.scalars().all()

    # Status normalisation maps
    EXECUTED_TXN = {"paid", "completed", "settled"}
    PENDING_TXN  = {"pending", "processing"}
    REJECTED_TXN = {"failed", "rejected", "cancelled"}
    EXPIRED_TXN  = {"expired"}

    EXECUTED_DISB = {"completed"}
    PENDING_DISB  = {"pending", "processing"}
    REJECTED_DISB = {"failed", "cancelled"}
    REVERSED_DISB = {"reversed"}

    def txn_bucket(s: str) -> str:
        s = (s or "").lower()
        if s in EXECUTED_TXN: return "Executed"
        if s in PENDING_TXN:  return "Pending"
        if s in REJECTED_TXN: return "Rejected"
        if s in EXPIRED_TXN:  return "Expired"
        return "Expired"

    def disb_bucket(s: str) -> str:
        s = (s or "").lower()
        if s in EXECUTED_DISB: return "Executed"
        if s in PENDING_DISB:  return "Pending"
        if s in REJECTED_DISB: return "Rejected"
        if s in REVERSED_DISB: return "Expired"
        return "Pending"

    # ── Payments summary ──────────────────────────────────────────
    pmt_total_amount = sum(float(t.amount or 0) for t in txns)
    pmt_total_count  = len(txns)

    # ── Disbursements summary ─────────────────────────────────────
    disb_total_amount = sum(float(d.amount or 0) for d in disbs)
    disb_total_count  = len(disbs)

    # ── Daily volumes (last `days` days) ─────────────────────────
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daily: Dict[str, Dict[str, float]] = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        key = str(d)
        daily[key] = {"payments": 0.0, "disbursements": 0.0}

    for t in txns:
        key = t.created_at.date().isoformat() if t.created_at else None
        if key and key in daily:
            daily[key]["payments"] += float(t.amount or 0)

    for d in disbs:
        key = d.created_at.date().isoformat() if d.created_at else None
        if key and key in daily:
            daily[key]["disbursements"] += float(d.amount or 0)

    daily_list = []
    for key, vals in sorted(daily.items()):
        dt = datetime.fromisoformat(key)
        daily_list.append({
            "date": key,
            "day": day_names[dt.weekday()],
            "payments": round(vals["payments"], 2),
            "disbursements": round(vals["disbursements"], 2),
        })
    # Return only last 7 days for the chart regardless of days window
    if len(daily_list) > 7:
        daily_list = daily_list[-7:]

    # ── Payment method distribution ───────────────────────────────
    method_map: Dict[str, Dict[str, float]] = {}
    QR_TYPES = {"qr_code", "qrph_payment", "alipay_qr", "wechat_qr"}
    for t in txns:
        ttype = (t.transaction_type or "").lower()
        label = "QRPH P2M" if ttype in QR_TYPES else "Transfer"
        if label not in method_map:
            method_map[label] = {"count": 0, "amount": 0.0}
        method_map[label]["count"] += 1
        method_map[label]["amount"] += float(t.amount or 0)

    payment_methods = [
        {"name": k, "count": int(v["count"]), "amount": round(v["amount"], 2)}
        for k, v in method_map.items()
    ]

    # ── Status breakdown ─────────────────────────────────────────
    pmt_by_status: Dict[str, Dict[str, float]] = {
        "Executed": {"amount": 0.0, "count": 0},
        "Pending":  {"amount": 0.0, "count": 0},
        "Rejected": {"amount": 0.0, "count": 0},
        "Expired":  {"amount": 0.0, "count": 0},
    }
    disb_by_status: Dict[str, Dict[str, float]] = {
        "Executed": {"amount": 0.0, "count": 0},
        "Pending":  {"amount": 0.0, "count": 0},
        "Rejected": {"amount": 0.0, "count": 0},
        "Expired":  {"amount": 0.0, "count": 0},
    }

    for t in txns:
        bucket = txn_bucket(t.status)
        pmt_by_status[bucket]["amount"] += float(t.amount or 0)
        pmt_by_status[bucket]["count"] += 1

    for d in disbs:
        bucket = disb_bucket(d.status)
        disb_by_status[bucket]["amount"] += float(d.amount or 0)
        disb_by_status[bucket]["count"] += 1

    STATUS_ORDER = ["Executed", "Pending", "Rejected", "Expired"]
    status_breakdown = []
    for s in STATUS_ORDER:
        pb = pmt_by_status[s]
        db_bucket = disb_by_status[s]
        status_breakdown.append({
            "status": s,
            "payment_amount": round(pb["amount"], 2),
            "payment_count": int(pb["count"]),
            "disbursement_amount": round(db_bucket["amount"], 2) if s != "Expired" else None,
            "disbursement_count": int(db_bucket["count"]) if s != "Expired" else None,
        })

    return {
        "success": True,
        "days": days,
        "currency": currency,
        "payments": {"total_amount": round(pmt_total_amount, 2), "total_count": pmt_total_count},
        "disbursements": {"total_amount": round(disb_total_amount, 2), "total_count": disb_total_count},
        "payment_links": {
            "total_count": sum(1 for txn in txns if (txn.transaction_type or "").strip().lower() == "payment_link"),
        },
        "otc_activity": {
            "total_count": sum(
                1
                for txn in txns
                if (txn.transaction_type or "").strip().lower() in {"otc", "over_the_counter"}
                or (txn.payment_method or "").strip().lower() in {
                    "cash",
                    "otc",
                    "over_the_counter",
                    "7eleven",
                    "7-eleven",
                    "cebuana",
                    "mlhuillier",
                    "bayad_center",
                }
            ),
        },
        "daily_volumes": daily_list,
        "payment_methods": payment_methods,
        "status_breakdown": status_breakdown,
    }


@router.get("/transactions/{transaction_id}/webhook-events")
async def get_transaction_webhook_events(
    transaction_id: int,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    user_ids = TransactionsService(db)._candidate_user_ids(str(current_user.id))
    transaction = await db.scalar(
        select(Transactions).where(
            Transactions.id == transaction_id,
            Transactions.user_id.in_(user_ids),
        )
    )
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    references = {
        value.strip()
        for value in (transaction.external_id, transaction.xendit_id, str(transaction.id))
        if value and value.strip()
    }
    if not references:
        return {"items": []}

    result = await db.execute(
        select(WebhookEvent)
        .where(WebhookEvent.external_id.in_(references))
        .order_by(WebhookEvent.created_at.desc())
        .limit(50)
    )
    events = []
    for event in result.scalars():
        payload = event.payload if isinstance(event.payload, dict) else {}
        if payload.get("transaction_id") not in (transaction.id, str(transaction.id)):
            continue
        events.append({
            "id": event.id,
            "provider": event.provider,
            "event_type": event.event_type,
            "status": event.status,
            "signature_verified": payload.get("signature_verified") is True,
            "signature_fingerprint": payload.get("signature_fingerprint"),
            "transaction_status": payload.get("transaction_status"),
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "processed_at": event.processed_at.isoformat() if event.processed_at else None,
        })
    return {"items": events}


@router.get("/transactions")
async def list_dashboard_transactions(
    currency: str = Query(..., min_length=3, max_length=4),
    status: Optional[str] = Query(None, max_length=32),
    transaction_type: Optional[str] = Query(None, max_length=64),
    search: Optional[str] = Query(None, max_length=200),
    sort: str = Query("-created_at", max_length=32),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    allowed_currencies = {"PHP", "CNY", "KRW", "USDT"}
    normalized_currency = currency.upper()
    if normalized_currency not in allowed_currencies:
        raise HTTPException(status_code=400, detail="Unsupported currency")

    allowed_statuses = {"paid", "pending", "processing", "failed", "rejected", "expired", "cancelled"}
    normalized_status = (status or "").strip().lower()
    if normalized_status and normalized_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Unsupported transaction status")

    allowed_types = {"invoice", "payment_link", "qr_code"}
    normalized_type = (transaction_type or "").strip().lower()
    if normalized_type and normalized_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported transaction type")

    sort_field = sort[1:] if sort.startswith("-") else sort
    sort_columns = {
        "external_id": Transactions.external_id,
        "customer": Transactions.customer_name,
        "type": Transactions.transaction_type,
        "method": Transactions.payment_method,
        "amount": Transactions.amount,
        "currency": Transactions.currency,
        "status": Transactions.status,
        "created_at": Transactions.created_at,
        "paid_at": Transactions.paid_at,
        "approval": Transactions.approval_status,
    }
    if sort_field not in sort_columns:
        raise HTTPException(status_code=400, detail="Unsupported sort field")

    user_ids = TransactionsService(db)._candidate_user_ids(str(current_user.id))
    conditions = [
        Transactions.user_id.in_(user_ids),
        func.lower(Transactions.transaction_type).not_in(
            tuple(value.lower() for value in NON_CUSTOMER_PAYMENT_TYPES)
        ),
        Transactions.external_id.is_not(None),
        Transactions.amount > 0,
        Transactions.currency == normalized_currency,
    ]
    conditions.append(
        ~func.lower(Transactions.transaction_type).endswith("_fee", autoescape=True)
    )
    if normalized_status:
        if normalized_status == "paid":
            conditions.append(
                or_(
                    func.lower(Transactions.status).in_(("paid", "completed", "settled")),
                    Transactions.paid_at.is_not(None),
                )
            )
        elif normalized_status == "pending":
            conditions.append(func.lower(Transactions.status).in_(("pending", "processing")))
        elif normalized_status == "failed":
            conditions.append(func.lower(Transactions.status).in_(("failed", "error", "declined")))
        elif normalized_status == "cancelled":
            conditions.append(func.lower(Transactions.status).in_(("cancelled", "canceled")))
        else:
            conditions.append(func.lower(Transactions.status) == normalized_status)
    if normalized_type:
        if normalized_type == "qr_code":
            conditions.append(
                func.lower(Transactions.transaction_type).in_(
                    ("qr_code", "qrph_payment", "qr_code_payment", "alipay_qr", "wechat_qr")
                )
            )
        else:
            conditions.append(func.lower(Transactions.transaction_type) == normalized_type)
    if search and search.strip():
        term = search.strip().lower()
        conditions.append(
            or_(
                func.lower(Transactions.external_id).contains(term, autoescape=True),
                func.lower(Transactions.xendit_id).contains(term, autoescape=True),
                func.lower(Transactions.customer_name).contains(term, autoescape=True),
                func.lower(Transactions.customer_email).contains(term, autoescape=True),
                func.lower(Transactions.description).contains(term, autoescape=True),
            )
        )

    statement = select(Transactions).where(*conditions)
    count_statement = select(func.count(Transactions.id)).where(*conditions)
    total = int((await db.scalar(count_statement)) or 0)
    column = sort_columns[sort_field]
    order = column.desc() if sort.startswith("-") else column.asc()
    result = await db.execute(statement.order_by(order, Transactions.id.desc()).offset(skip).limit(limit))
    return {
        "items": result.scalars().all(),
        "total": total,
        "skip": skip,
        "limit": limit,
    }


async def _process_xend_request(
    db: AsyncSession,
    current_user: UserResponse,
    request: CreatePaymentRequest,
    transaction_type: str,
):
    store_currency = None
    if current_user.organization_id:
        currency_result = await db.execute(
            select(MerchantApiConfig.collection_currency)
            .where(MerchantApiConfig.organization_id == current_user.organization_id)
            .order_by(MerchantApiConfig.user_id.is_(None).desc(), MerchantApiConfig.id.asc())
            .limit(1)
        )
        store_currency = currency_result.scalar()
    # For Xend-compatible endpoints, prefer SwiftPay when the environment indicates it's configured.
    # Tests patch `routers.xend.SwiftPayService.is_configured` and expect SwiftPay to be used in that case,
    # so check the local SwiftPayService here before delegating to the generic gateway logic.
    swift = SwiftPayService()
    # Only prefer SwiftPay for this Xend endpoint when it is configured AND
    # when the request explicitly includes payment methods that map to SwiftPay
    # (e.g., 'qrph'). This prevents SwiftPay from taking precedence for tests
    # that expect a Magpie fallback when no specific SwiftPay methods are requested.
    SWIFT_METHODS = {"qrph", "qr_code", "qrph_payment"}
    requested = [m.lower() for m in (request.payment_methods or [])]
    # An explicit request currency describes this payment and must not be
    # replaced by the merchant's default collection currency. The stored
    # currency is only a fallback for older clients that omit the field.
    effective_currency = (request.currency or store_currency or "PHP").upper()
    if (
        transaction_type != "payment_link"
        and swift.is_configured()
        and effective_currency == "PHP"
        and any(m in SWIFT_METHODS for m in requested)
    ):
        # Build a reference_no using external_id when present
        import uuid as _uuid
        reference_no = request.external_id or f"swiftpay-{transaction_type}-{_uuid.uuid4().hex[:12]}"
        details = {
            "payment_type": transaction_type,
            "description": request.description or "",
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "payment_methods": request.payment_methods or [],
            "external_id": request.external_id or "",
        }
        res = await swift.create_order(
            amount=request.amount,
            reference_no=reference_no,
            details=details,
            currency=effective_currency,
            generate_customer_redirect_url=True,
        )
        if not res.get("success"):
            return {"success": False, "error": res.get("error")}

        data = res.get("data") or {}

        # Helper: robustly pick first non-empty field from possible key variants
        def _pick(d, *keys):
            for k in keys:
                if isinstance(d, dict) and k in d and d[k]:
                    return d[k]
            return None

        payment_url = _pick(data, "customerRedirectUrl", "customer_redirect_url", "payment_url", "paymentUrl") or _pick(res, "reference_no", "referenceNo") or ""
        checkout_url = canonicalize_checkout_url(
            _pick(data, "checkoutUrl", "checkout_url", "customerRedirectUrl", "customer_redirect_url")
            or f"/checkout/{reference_no}",
            effective_currency,
        )
        gateway_id = _pick(data, "paymentId", "payment_id", "id") or ""

        txn_svc = TransactionsService(db)
        txn = await txn_svc.create_transaction(
            user_id=str(current_user.id),
            transaction_type=transaction_type,
            amount=request.amount,
            external_id=res.get("reference_no") or reference_no,
            gateway_id=gateway_id,
            description=(request.description or ""),
            customer_name=request.customer_name,
            customer_email=request.customer_email,
            payment_url=payment_url,
            currency=effective_currency,
            status="pending",
        )

        return {
            "success": True,
            "data": {
                "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                "transaction_id": getattr(txn, "id", None),
                "payment_url": payment_url,
                "checkout_url": checkout_url,
                "gateway": "swiftpay",
                "raw": data,
            },
        }

    # Fallback to generic gateway routing
    metadata = {
        "descriptor": request.descriptor,
        "merchant_name": request.merchant_name,
    }
    if transaction_type == "payment_link" and effective_currency == "PHP":
        metadata["self_hosted_checkout"] = True
    if effective_currency == "KRW" and "bank_transfer" in requested:
        metadata["manual_krw_checkout"] = True
    if request.currency:
        metadata["currency"] = request.currency.upper()
    print("_process_xend_request forwarding metadata=", metadata)

    # If requesting an invoice/payment_link and Magpie is not configured, return an explicit error
    # Instantiate a fresh MagpieService to check runtime configuration (tests may patch its __init__)
    try:
        from services.magpie_service import MagpieService as _MagpieServiceCheck

        magpie_check = _MagpieServiceCheck()
        magpie_configured = bool(getattr(magpie_check, "api_key", ""))
    except Exception:
        magpie_configured = False

    if transaction_type in ("invoice", "payment_link") and not magpie_configured and (request.currency or store_currency or "PHP").upper() != "KRW":
        return {"success": False, "message": "Magpie API key is not configured"}

    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=request.amount,
        description=request.description or f"{transaction_type} payment",
        transaction_type=transaction_type,
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        external_id=request.external_id,
        payment_methods=request.payment_methods,
        metadata=metadata,
        currency=effective_currency,
    )


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
