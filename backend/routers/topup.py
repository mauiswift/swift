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

from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from core.database import get_db
from dependencies.auth import get_current_user
from models.topup_requests import TopupRequest
from models.admin_users import AdminUser
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse
from services.admin_notification_service import AdminNotificationService
from services.wallets import WalletsService
from services.transactions import TransactionsService
from services.app_settings import get_usdt_php_rate, get_usdt_php_rate_details, get_deposit_rules
from services.swiftpay_service import SwiftPayService
from services.system_earnings import credit_system_earnings
from services.user_benefits import unlock_krw_benefits
from services.private_receipts import save_private_receipt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/topup", tags=["topup"])


def _can_approve_requests(user: UserResponse) -> bool:
    permissions = user.permissions
    return bool(
        permissions
        and permissions.is_super_admin
        and permissions.can_approve_topups
        and str(user.id).strip() == SYSTEM_WALLET_ADMIN_TELEGRAM_ID
    )



# ---------- Schemas ----------
class TopupRequestResponse(BaseModel):
    id: int
    chat_id: str
    user_name: Optional[str] = None
    telegram_username: Optional[str] = None
    amount_usdt: float
    requested_amount: Optional[float] = None
    currency: str = "USDT"
    reference_code: Optional[str] = None
    tx_hash: Optional[str] = None
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


def _php_topup_credit_amount(request: TopupRequest, current_rate: Optional[float] = None) -> float:
    if request.requested_amount is not None:
        return round(float(request.requested_amount), 2)
    if current_rate is None:
        raise ValueError("A current PHP conversion rate is required for legacy top-up requests")
    return round(float(request.amount_usdt or 0.0) * current_rate, 2)


@router.post("/request-with-receipt", response_model=TopupRequestResponse)
async def create_topup_request_with_receipt(
    amount_usdt: float = Form(...),
    tx_hash: str = Form(...),
    receipt: UploadFile = File(...),
    note: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a web USDT top-up request with its transfer receipt attached."""
    if not math.isfinite(amount_usdt) or amount_usdt <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    normalized_tx_hash = tx_hash.strip().lower()
    if len(normalized_tx_hash) != 64 or any(character not in "0123456789abcdef" for character in normalized_tx_hash):
        raise HTTPException(status_code=400, detail="Enter a valid TRON transaction hash")
    existing_hash = await db.scalar(select(TopupRequest.id).where(TopupRequest.tx_hash == normalized_tx_hash))
    if existing_hash:
        raise HTTPException(status_code=409, detail="This transaction hash has already been submitted")
    deposit_rules = await get_deposit_rules(db)
    receipt_ref = await save_private_receipt(
        receipt,
        deposit_rules.get("receipt_max_size_mb"),
    )

    now = datetime.now(timezone.utc)
    new_request = TopupRequest(
        chat_id=str(current_user.id),
        telegram_username=getattr(current_user, "username", current_user.name),
        amount_usdt=round(amount_usdt, 2),
        currency="USDT",
        tx_hash=normalized_tx_hash,
        receipt_file_id=receipt_ref,
        status="pending",
        note=note or "USDT top-up submitted via web",
        created_at=now,
        updated_at=now,
    )
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    user_name = getattr(current_user, "name", None) or getattr(current_user, "username", None) or str(current_user.id)
    await AdminNotificationService.notify_super_admins(
        db,
        notification_type="topup_request",
        title="New USDT Top-up Request",
        message=f"USDT top-up of {new_request.amount_usdt:,.2f} from {user_name} is awaiting review",
        user_id=str(current_user.id),
        user_name=user_name,
        resource_type="topup",
        resource_id=str(new_request.id),
        metadata={
            "amount": new_request.amount_usdt,
            "currency": new_request.currency,
            "method": "USDT TRC-20",
            "tx_hash": new_request.tx_hash,
        },
        priority="high",
        action_url="/topup-requests",
    )
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
    user_ids = {str(item.chat_id) for item in items}
    users = await db.scalars(select(AdminUser).where(AdminUser.telegram_id.in_(user_ids))) if user_ids else []
    user_names = {str(user.telegram_id): user.name for user in users}
    for item in items:
        item.user_name = user_names.get(str(item.chat_id)) or item.telegram_username or str(item.chat_id)
    return TopupListResponse(items=list(items), total=len(items))


@router.get("/{topup_id}", response_model=TopupRequestResponse)
async def get_topup_request(
    topup_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Top-up approval access required")
    result = await db.execute(
        select(TopupRequest)
        .where(TopupRequest.id == topup_id)
        .with_for_update()
    )
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
    deposit_rules = await get_deposit_rules(db)
    if input_currency not in deposit_rules["topup_currencies"]:
        raise HTTPException(status_code=400, detail=f"Unsupported top-up currency: {input_currency}")
    if not math.isfinite(data.amount) or data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be a positive finite number")
    if not math.isfinite(rate) or rate <= 0:
        raise HTTPException(status_code=503, detail="USDT/PHP exchange rate is unavailable")
    amount_usdt = round(data.amount / rate, 2) if input_currency == "PHP" else data.amount

    new_request = TopupRequest(
        chat_id=str(current_user.id),
        telegram_username=getattr(current_user, "username", current_user.name),
        amount_usdt=amount_usdt,
        requested_amount=round(data.amount, 2),
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
    deposit_rules = await get_deposit_rules(db)
    if input_currency not in deposit_rules["topup_currencies"]:
        raise HTTPException(status_code=400, detail=f"Unsupported top-up currency: {input_currency}")
    order_amount = data.amount
    if input_currency == "USDT":
        rate = await get_usdt_php_rate(db)
        if rate <= 0:
            raise HTTPException(status_code=400, detail="USDT/PHP exchange rate is unavailable")
        order_amount = round(data.amount * rate, 2)

    swiftpay = SwiftPayService()
    reference_no = f"topup-{current_user.id}-{uuid.uuid4().hex[:8]}"
    txn = await TransactionsService(db).create_transaction(
        user_id=str(current_user.id),
        transaction_type="wallet_topup",
        amount=order_amount,
        external_id=reference_no,
        description="SwiftPay wallet top-up",
        customer_name=current_user.name or "User",
        payment_url="",
        status="pending",
        currency="PHP",
        payment_method="swiftpay",
        idempotency_key=reference_no,
    )

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
        txn.status = "failed"
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=400, detail=order_result.get("error", "SwiftPay error"))

    data_res = order_result.get("data") or {}
    redirect_url = data_res.get("customerRedirectUrl") or data_res.get("customer_redirect_url") or ""
    payment_id = data_res.get("paymentId") or data_res.get("payment_id")
    if not redirect_url:
        txn.status = "failed"
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=502, detail="SwiftPay did not return a checkout URL")

    txn.xendit_id = payment_id
    txn.payment_url = redirect_url
    txn.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "success": True,
        "redirect_url": redirect_url,
        "reference_no": reference_no,
        "transaction_id": txn.id,
        "input_amount": data.amount,
        "input_currency": input_currency,
        "order_amount": order_amount,
        "payment_id": payment_id,
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
    request_currency = str(req.currency or "USDT").upper()
    if request_currency == "USDT":
        if not req.tx_hash and not req.receipt_file_id:
            raise HTTPException(
                status_code=400,
                detail="USDT top-up requires a transaction hash or transfer receipt",
            )

    user_id = str(req.chat_id)
    amount_usdt = float(req.amount_usdt or 0.0)
    if not math.isfinite(amount_usdt) or amount_usdt <= 0:
        raise HTTPException(status_code=400, detail="Top-up amount must be a positive finite number")
    request_currency = str(req.currency or "USDT").upper()
    deposit_rules = await get_deposit_rules(db)
    if request_currency not in deposit_rules["topup_currencies"]:
        raise HTTPException(status_code=400, detail=f"Unsupported top-up currency: {request_currency}")

    if request_currency == "PHP":
        credit_currency = "PHP"
        if req.requested_amount is not None:
            credit_amount = _php_topup_credit_amount(req)
            credit_note = f"PHP topup: ₱{credit_amount:,.2f} (quoted at request time)"
        else:
            rate = await get_usdt_php_rate(db)
            credit_amount = _php_topup_credit_amount(req, rate)
            credit_note = f"USDT→PHP topup: ${amount_usdt:.2f} USDT × ₱{rate:.2f} = ₱{credit_amount:,.2f}"
    else:
        credit_amount = round(amount_usdt, 2)
        credit_currency = request_currency
        credit_note = f"{credit_currency} topup: {credit_amount:,.2f} {credit_currency}"

    wallet_service = WalletsService(db)
    try:
        wallet = await wallet_service.credit_wallet(
            user_id=user_id,
            amount=credit_amount,
            currency=credit_currency,
            transaction_type="top_up",
            reference_id=str(topup_id),
            note=(credit_note + f" (request #{topup_id})" + (f" — {body.note}" if body.note else "")),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await db.flush()
    txn_result = await db.execute(
        select(Wallet_transactions)
        .where(
            Wallet_transactions.wallet_id == wallet.id,
            Wallet_transactions.reference_id == str(topup_id),
        )
        .order_by(Wallet_transactions.id.desc())
        .limit(1)
    )
    txn = txn_result.scalar_one()

    req.status = "approved"
    req.note = body.note or f"Approved: {credit_note}"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)
    if request_currency == "USDT":
        await unlock_krw_benefits(db, str(user_id), source=f"topup:{topup_id}")

    await db.commit()
    await db.refresh(req)

    try:
        await wallet_service.publish_wallet_event(wallet.user_id, wallet, "top_up", credit_amount, txn.id, req.note)
    except Exception:
        # The approval is already committed; a notification failure must not
        # make the admin retry a request that has already been credited.
        logger.warning("Top-up #%s approved but wallet notification failed", topup_id, exc_info=True)

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
