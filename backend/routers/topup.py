import logging
import math
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.topup_requests import TopupRequest
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse
from services.event_bus import payment_event_bus
from services.wallets import WalletsService
from services.app_settings import get_usdt_php_rate, get_usdt_php_rate_details
from services.swiftpay_service import SwiftPayService
from services.app_settings import get_collection_fee_percent
from services.system_earnings import credit_system_earnings
from services.event_bus import payment_event_bus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/topup", tags=["topup"])


def _can_approve_requests(user: UserResponse) -> bool:
    permissions = user.permissions
    return bool(permissions and permissions.is_super_admin)



# ---------- Schemas ----------
class TopupRequestResponse(BaseModel):
    id: int
    chat_id: str
    telegram_username: Optional[str] = None
    amount_usdt: float
    currency: str = "USDT"
    reference_code: Optional[str] = None
    receipt_file_id: Optional[str] = None
    status: str
    note: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TopupListResponse(BaseModel):
    items: List[TopupRequestResponse]
    total: int

class TopupRequestCreate(BaseModel):
    amount: float
    currency: str = "PHP"
    note: Optional[str] = None

class SwiftPayTopupRequest(BaseModel):
    amount: float
    currency: str = "PHP"
    institution_code: Optional[str] = None


@router.post("/request-with-receipt", response_model=TopupRequestResponse)
async def create_topup_request_with_receipt(
    amount_usdt: float = Form(...),
    receipt: UploadFile = File(...),
    note: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a web USDT top-up request with its transfer receipt attached."""
    if not math.isfinite(amount_usdt) or amount_usdt <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if receipt.content_type and not (receipt.content_type.startswith("image/") or receipt.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="Receipt must be an image or PDF")

    receipt_bytes = await receipt.read()
    if not receipt_bytes:
        raise HTTPException(status_code=400, detail="Receipt file is empty")
    if len(receipt_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Receipt file must be 10 MB or smaller")

    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", "usdt-receipts")
    os.makedirs(uploads_dir, exist_ok=True)
    extension = os.path.splitext(receipt.filename or "receipt")[1].lower() or ".bin"
    filename = f"{uuid.uuid4().hex}{extension}"
    receipt_path = os.path.join(uploads_dir, filename)
    with open(receipt_path, "wb") as output:
        output.write(receipt_bytes)

    now = datetime.now(timezone.utc)
    new_request = TopupRequest(
        chat_id=str(current_user.id),
        telegram_username=getattr(current_user, "username", current_user.name),
        amount_usdt=round(amount_usdt, 2),
        currency="USDT",
        receipt_file_id=f"/uploads/usdt-receipts/{filename}",
        status="pending",
        note=note or "USDT top-up submitted via web",
        created_at=now,
        updated_at=now,
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    payment_event_bus.publish({
        "event_type": "topup_request",
        "topup_id": new_request.id,
        "user_id": str(current_user.id),
        "user_name": getattr(current_user, "name", None) or getattr(current_user, "username", None) or str(current_user.id),
        "amount": new_request.amount_usdt,
        "currency": new_request.currency,
        "method": "USDT receipt",
    })
    return new_request

class ApproveTopupRequest(BaseModel):
    note: str = ""

class RejectTopupRequest(BaseModel):
    note: str = "Request rejected by admin."


# ---------- Endpoints ----------

@router.get("/rate")
async def get_conversion_rate(db: AsyncSession = Depends(get_db)):
    """Return the current USDT→PHP exchange rate used for topup conversion. Publicly accessible."""
    details = await get_usdt_php_rate_details(db)
    return {"usdt_php_rate": details["rate"], "source": details["source"]}


@router.get("", response_model=TopupListResponse)
async def list_topup_requests(
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all topup requests (super admin only)."""
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Top-up approval access required")
    stmt = select(TopupRequest).order_by(TopupRequest.created_at.desc())
    if status:
        stmt = stmt.where(TopupRequest.status == status)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return TopupListResponse(items=list(items), total=len(items))


@router.get("/{topup_id}", response_model=TopupRequestResponse)
async def get_topup_request(
    topup_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Top-up approval access required")
    result = await db.execute(select(TopupRequest).where(TopupRequest.id == topup_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    return req


@router.post("/request", response_model=TopupRequestResponse)
async def create_topup_request(
    data: TopupRequestCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow a mobile user to submit a top-up request."""
    # Convert PHP to USDT roughly if needed, or just store amount.
    # The model says amount_usdt. For now we'll assume the mobile user inputs the target currency.
    # In topup.py approve handler, it treats amount_usdt * rate = amount_php.

    # Let's get the rate to convert the requested PHP to USDT for storage if that's what's expected
    rate = await get_usdt_php_rate(db)
    input_currency = data.currency.strip().upper()
    if input_currency not in {"PHP", "USDT"}:
        raise HTTPException(status_code=400, detail="Currency must be PHP or USDT")
    if not math.isfinite(data.amount) or data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be a positive finite number")
    if not math.isfinite(rate) or rate <= 0:
        raise HTTPException(status_code=503, detail="USDT/PHP exchange rate is unavailable")
    amount_usdt = round(data.amount / rate, 2) if input_currency == "PHP" else data.amount

    new_request = TopupRequest(
        chat_id=str(current_user.id),
        telegram_username=getattr(current_user, "username", current_user.name),
        amount_usdt=amount_usdt,
        currency=input_currency,
        status="pending",
        note=data.note or "Requested via Mobile App",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    logger.info(f"Top-up request {new_request.id} created by user {current_user.id}")
    return new_request


@router.post("/swiftpay")
async def initialize_swiftpay_topup(
    data: SwiftPayTopupRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize a SwiftPay order for top-up."""
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    input_currency = data.currency.strip().upper()
    if input_currency not in {"PHP", "USDT"}:
        raise HTTPException(status_code=400, detail="Currency must be PHP or USDT")

    order_amount = data.amount
    if input_currency == "USDT":
        rate = await get_usdt_php_rate(db)
        if rate <= 0:
            raise HTTPException(status_code=400, detail="USDT/PHP exchange rate is unavailable")
        order_amount = round(data.amount * rate, 2)

    swiftpay = SwiftPayService()
    reference_no = f"topup-{current_user.id}-{uuid.uuid4().hex[:8]}"

    order_result = await swiftpay.create_order(
        amount=order_amount,
        reference_no=reference_no,
        details={
            "description": f"Wallet Top-up for user {current_user.id}",
            "customer_name": current_user.name or "User",
            "user_id": str(current_user.id)
        },
        currency="PHP",
        generate_customer_redirect_url=True,
        institution_code=data.institution_code
    )

    if not order_result.get("success"):
        raise HTTPException(status_code=400, detail=order_result.get("error", "SwiftPay error"))

    data_res = order_result.get("data") or {}
    redirect_url = data_res.get("customerRedirectUrl") or data_res.get("customer_redirect_url") or ""

    return {
        "success": True,
        "redirect_url": redirect_url,
        "reference_no": reference_no,
        "input_amount": data.amount,
        "input_currency": input_currency,
        "order_amount": order_amount,
        "payment_id": data_res.get("paymentId") or data_res.get("payment_id")
    }


@router.post("/{topup_id}/approve", response_model=TopupRequestResponse)
async def approve_topup_request(
    topup_id: int,
    body: ApproveTopupRequest = ApproveTopupRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a top-up request and credit the wallet matching its requested currency."""
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Top-up approval access required")
    result = await db.execute(select(TopupRequest).where(TopupRequest.id == topup_id).with_for_update())
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    # Ensure consistent ID normalization via service
    user_id = str(req.chat_id)
    amount_usdt = req.amount_usdt

    request_currency = str(req.currency or "USDT").upper()
    if request_currency not in {"PHP", "USDT", "KRW"}:
        raise HTTPException(status_code=400, detail=f"Unsupported top-up currency: {request_currency}")

    if request_currency == "PHP":
        rate = await get_usdt_php_rate(db)
        credit_amount = round(amount_usdt * rate, 2)
        credit_currency = "PHP"
        credit_note = f"USDT→PHP topup: ${amount_usdt:.2f} USDT × ₱{rate:.2f} = ₱{credit_amount:,.2f}"
    else:
        credit_amount = round(amount_usdt, 2)
        credit_currency = request_currency
        credit_note = f"{credit_currency} topup: {credit_amount:,.2f} {credit_currency}"

    incoming_fee_rate = await get_collection_fee_percent(db, user_id)
    incoming_fee = round(credit_amount * incoming_fee_rate, 2)
    net_credit_amount = round(credit_amount - incoming_fee, 2)

    wallet_service = WalletsService(db)
    wallet = await wallet_service.get_or_create_wallet(user_id, credit_currency)

    balance_before = wallet.balance
    wallet.balance = round(wallet.balance + net_credit_amount, 2)
    wallet.available_balance = round(wallet.available_balance + net_credit_amount, 2)
    wallet.updated_at = datetime.now(timezone.utc)

    txn = Wallet_transactions(
        user_id=wallet.user_id,
        wallet_id=wallet.id,
        transaction_type="top_up",
        amount=net_credit_amount,
        balance_before=balance_before,
        balance_after=wallet.balance,
        note=(
            credit_note
            + f" — gross {credit_amount:,.2f}, fee {incoming_fee:,.2f} ({incoming_fee_rate * 100:.2f}%), net {net_credit_amount:,.2f}"
            +
            f" (request #{topup_id})"
            + (f" — {body.note}" if body.note else "")
        ),
        status="completed",
        reference_id=str(topup_id),
        created_at=datetime.now(timezone.utc),
    )

    db.add(txn)
    await credit_system_earnings(
        db=db,
        amount=incoming_fee,
        currency=credit_currency,
        reference_id=f"{topup_id}-system-fee",
        note=f"Incoming top-up fee ({incoming_fee_rate * 100:.2f}%): {incoming_fee:,.2f} {credit_currency}",
    )

    # Update topup request status
    req.status = "approved"
    req.note = body.note or f"Approved: {credit_note}"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)

    await wallet_service.publish_wallet_event(wallet.user_id, wallet, "top_up", credit_amount, txn.id, req.note)

    logger.info(
        "Topup #%s approved — %.2f %s credited to %s",
        topup_id, credit_amount, credit_currency, user_id,
    )
    return req


@router.post("/{topup_id}/reject", response_model=TopupRequestResponse)
async def reject_topup_request(
    topup_id: int,
    body: RejectTopupRequest = RejectTopupRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Top-up approval access required")
    """Reject a topup request."""
    result = await db.execute(select(TopupRequest).where(TopupRequest.id == topup_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "rejected"
    req.note = body.note
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)
    logger.info(f"Topup #{topup_id} rejected")
    return req
