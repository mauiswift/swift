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
from services.app_settings import get_usdt_php_rate
from services.swiftpay_service import SwiftPayService

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
    return new_request

class ApproveTopupRequest(BaseModel):
    note: str = ""

class RejectTopupRequest(BaseModel):
    note: str = "Request rejected by admin."


# ---------- Endpoints ----------

@router.get("/rate")
async def get_conversion_rate(db: AsyncSession = Depends(get_db)):
    """Return the current USDT→PHP exchange rate used for topup conversion. Publicly accessible."""
    rate = await get_usdt_php_rate(db)
    return {"usdt_php_rate": rate}


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
        currency="USDT",
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


async def _is_first_topup_for_user(db: AsyncSession, chat_id: str, current_topup_id: int | None = None) -> bool:
    """Return True when the user has no prior topup history besides the current request."""
    stmt = select(TopupRequest.id).where(TopupRequest.chat_id == str(chat_id))
    if current_topup_id is not None:
        stmt = stmt.where(TopupRequest.id != current_topup_id)
    result = await db.execute(stmt.limit(1))
    return result.scalar_one_or_none() is None


@router.post("/{topup_id}/approve", response_model=TopupRequestResponse)
async def approve_topup_request(
    topup_id: int,
    body: ApproveTopupRequest = ApproveTopupRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a USDT topup request: convert USDT→PHP at the configured rate and credit the PHP wallet."""
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Top-up approval access required")
    result = await db.execute(select(TopupRequest).where(TopupRequest.id == topup_id).with_for_update())
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Topup request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    # New users may only complete the onboarding deposit with exactly 600 USDT.
    if await _is_first_topup_for_user(db, req.chat_id, req.id):
        if abs(float(req.amount_usdt) - 600.0) > 1e-9:
            req.note = (
                f"First-time onboarding requires exactly 600 USDT. "
                f"Received {float(req.amount_usdt):.2f} USDT; request remains pending."
            )
            req.updated_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(req)
            logger.info(
                "Topup #%s kept pending for first-time user %s: %.2f USDT received instead of 600 USDT",
                topup_id,
                req.chat_id,
                float(req.amount_usdt),
            )
            raise HTTPException(status_code=409, detail="First-time onboarding requires exactly 600 USDT")

    # Ensure consistent ID normalization via service
    user_id = str(req.chat_id)
    amount_usdt = req.amount_usdt

    # Fetch the current USDT→PHP exchange rate
    rate = await get_usdt_php_rate(db)
    amount_php = round(amount_usdt * rate, 2)

    wallet_service = WalletsService(db)
    wallet = await wallet_service.get_or_create_wallet(user_id, "PHP")

    balance_before = wallet.balance
    wallet.balance = round(wallet.balance + amount_php, 2)
    wallet.available_balance = round(wallet.available_balance + amount_php, 2)
    wallet.updated_at = datetime.now(timezone.utc)

    txn = Wallet_transactions(
        user_id=wallet.user_id,
        wallet_id=wallet.id,
        transaction_type="top_up",
        amount=amount_php,
        balance_before=balance_before,
        balance_after=wallet.balance,
        note=(
            f"USDT→PHP topup: ${amount_usdt:.2f} USDT × ₱{rate:.2f} = ₱{amount_php:,.2f}"
            f" (request #{topup_id})"
            + (f" — {body.note}" if body.note else "")
        ),
        status="completed",
        reference_id=str(topup_id),
        created_at=datetime.now(timezone.utc),
    )

    db.add(txn)

    # Update topup request status
    req.status = "approved"
    req.note = body.note or f"Approved: ${amount_usdt:.2f} USDT → ₱{amount_php:,.2f} PHP (rate: {rate:.2f})"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)

    await wallet_service.publish_wallet_event(wallet.user_id, wallet, "top_up", amount_php, txn.id, req.note)

    logger.info(
        "Topup #%s approved — $%.2f USDT → ₱%.2f PHP (rate %.2f) credited to %s",
        topup_id, amount_usdt, amount_php, rate, user_id,
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
