import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor
from services.swiftpay_service import SwiftPayService
from core.config import settings
from services.transactions import TransactionsService
from models.transactions import Transactions
from models.disbursements import Disbursements

from services.payment_gateway import gateway as payment_gateway

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


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=90),
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated stats for the main dashboard page."""
    user_id = str(current_user.id)
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    # ── Fetch transactions within window ──────────────────────────
    # We exclude 'disbursement' type as those are handled by the disbursements query below
    txn_result = await db.execute(
        select(Transactions).where(
            Transactions.user_id == user_id,
            Transactions.created_at >= since,
            Transactions.transaction_type != "disbursement",
        )
    )
    txns = txn_result.scalars().all()

    # ── Fetch disbursements within window ─────────────────────────
    disb_result = await db.execute(
        select(Disbursements).where(
            Disbursements.user_id == user_id,
            Disbursements.created_at >= since,
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
        d = (since + timedelta(days=i)).date()
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
        "payments": {"total_amount": round(pmt_total_amount, 2), "total_count": pmt_total_count},
        "disbursements": {"total_amount": round(disb_total_amount, 2), "total_count": disb_total_count},
        "daily_volumes": daily_list,
        "payment_methods": payment_methods,
        "status_breakdown": status_breakdown,
    }


async def _process_xend_request(
    db: AsyncSession,
    current_user: UserResponse,
    request: CreatePaymentRequest,
    transaction_type: str,
):
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
    )

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
