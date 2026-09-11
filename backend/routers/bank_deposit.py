import logging
import math
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.constants import PAYBOT_BANK_ACCOUNTS, BANK_RECEIPTS_SUBDIR
from dependencies.auth import get_current_user
from models.bank_deposit_requests import BankDepositRequest
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse
from services.event_bus import payment_event_bus
from services.wallets import WalletsService
from services.app_settings import get_wallet_currency_limits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/bank-deposits", tags=["bank-deposits"])

# Alias for backward compatibility
_PAYBOT_ACCOUNTS = PAYBOT_BANK_ACCOUNTS
_RECEIPTS_SUBDIR = BANK_RECEIPTS_SUBDIR


def _can_approve_requests(user: UserResponse) -> bool:
    permissions = user.permissions
    return bool(permissions and permissions.is_super_admin)


# ---------- Schemas ----------
class BankDepositRequestResponse(BaseModel):
    id: int
    chat_id: str
    telegram_username: Optional[str] = None
    channel: str
    account_number: str
    amount_php: float
    currency: str = "PHP"
    receipt_file_id: Optional[str] = None
    status: str
    note: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    success: bool = True
    message: Optional[str] = None
    credited_amount: Optional[float] = None
    credited_currency: Optional[str] = None
    wallet_id: Optional[int] = None
    transaction_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class BankDepositListResponse(BaseModel):
    items: List[BankDepositRequestResponse]
    total: int


class ApproveBankDepositRequest(BaseModel):
    note: str = ""


class RejectBankDepositRequest(BaseModel):
    note: str = "Request rejected by admin."


# ---------- Endpoints ----------

@router.post("", response_model=BankDepositRequestResponse, status_code=201)
async def create_bank_deposit_request(
    amount_php: float = Form(...),
    currency: str = Form("PHP"),
    channel: str = Form(...),
    account_number: str = Form(...),
    transfer_method: str = Form(...),
    ref_number: Optional[str] = Form(None),
    transfer_date: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a bank deposit request with an optional receipt file."""
    deposit_currency = currency.strip().upper()
    if deposit_currency not in {"PHP", "KRW"}:
        raise HTTPException(status_code=400, detail="Currency must be PHP or KRW.")
    limits = await get_wallet_currency_limits(db, deposit_currency)
    if not math.isfinite(amount_php) or (
        limits["minimum_deposit"] > 0 and amount_php < limits["minimum_deposit"]
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum deposit is {deposit_currency} {limits['minimum_deposit']:,.2f}.",
        )
    if limits["max_incoming"] > 0 and amount_php > limits["max_incoming"]:
        raise HTTPException(
            status_code=400,
            detail=f"Incoming amount exceeds the {deposit_currency} maximum of {limits['max_incoming']:,.2f}.",
        )

    receipt_path: Optional[str] = None
    if receipt and receipt.filename:
        uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", _RECEIPTS_SUBDIR)
        os.makedirs(uploads_dir, exist_ok=True)
        ext = os.path.splitext(receipt.filename)[1] or ".bin"
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(uploads_dir, filename)
        content = await receipt.read()
        with open(file_path, "wb") as f:
            f.write(content)
        receipt_path = f"/uploads/{_RECEIPTS_SUBDIR}/{filename}"

    note_parts = [f"Transfer method: {transfer_method}"]
    if ref_number:
        note_parts.append(f"Ref: {ref_number}")
    if transfer_date:
        note_parts.append(f"Transfer date: {transfer_date}")
    if note:
        note_parts.append(f"Notes: {note}")
    note_text = " | ".join(note_parts)

    req = BankDepositRequest(
        chat_id=current_user.id,
        telegram_username=current_user.name,
        channel=channel,
        account_number=account_number,
        amount_php=amount_php,
        currency=deposit_currency,
        receipt_file_id=receipt_path,
        status="pending",
        note=note_text,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    try:
        payment_event_bus.publish({
            "event_type": "bank_deposit_request",
            "deposit_id": req.id,
            "user_id": f"tg-{current_user.id}",
            "amount": amount_php,
            "currency": deposit_currency,
            "channel": channel,
            "bank_name": account_number,
            "user_name": current_user.name or str(current_user.id),
        })
    except Exception:
        pass

    logger.info(
        "Bank deposit request #%s created by %s — %.2f %s via %s",
        req.id, current_user.id, amount_php, deposit_currency, channel,
    )
    return req


@router.get("", response_model=BankDepositListResponse)
async def list_bank_deposit_requests(
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all bank deposit requests (super admin only)."""
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Deposit approval access required")
    stmt = select(BankDepositRequest).order_by(BankDepositRequest.created_at.desc())
    if status:
        stmt = stmt.where(BankDepositRequest.status == status)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return BankDepositListResponse(items=list(items), total=len(items))


@router.get("/{deposit_id}", response_model=BankDepositRequestResponse)
async def get_bank_deposit_request(
    deposit_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Deposit approval access required")
    result = await db.execute(select(BankDepositRequest).where(BankDepositRequest.id == deposit_id).with_for_update())
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Bank deposit request not found")
    return req


@router.post("/{deposit_id}/approve", response_model=BankDepositRequestResponse)
async def approve_bank_deposit_request(
    deposit_id: int,
    body: ApproveBankDepositRequest = ApproveBankDepositRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a bank deposit request and credit the requested wallet currency."""
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Deposit approval access required")
    result = await db.execute(select(BankDepositRequest).where(BankDepositRequest.id == deposit_id).with_for_update())
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Bank deposit request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    user_id = str(req.chat_id)
    amount_php = float(req.amount_php or 0.0)
    if not math.isfinite(amount_php) or amount_php <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be a positive finite number")

    wallet_service = WalletsService(db)
    deposit_currency = str(req.currency or "PHP").upper()
    if deposit_currency not in {"PHP", "KRW"}:
        raise HTTPException(status_code=400, detail="Unsupported deposit currency")
    try:
        wallet = await wallet_service.credit_wallet(
            user_id=user_id,
            amount=amount_php,
            currency=deposit_currency,
            transaction_type="top_up",
            reference_id=str(deposit_id),
            note=(
                f"Bank deposit: {deposit_currency} {amount_php:,.2f} via {req.channel} ({req.account_number})"
                f" (request #{deposit_id})"
                + (f" — {body.note}" if body.note else "")
            ),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await db.flush()
    txn_result = await db.execute(
        select(Wallet_transactions)
        .where(
            Wallet_transactions.wallet_id == wallet.id,
            Wallet_transactions.reference_id == str(deposit_id),
        )
        .order_by(Wallet_transactions.id.desc())
        .limit(1)
    )
    txn = txn_result.scalar_one()

    req.status = "approved"
    req.note = body.note or f"Approved: {amount_php:,.2f} {deposit_currency} credited"
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)

    try:
        await wallet_service.publish_wallet_event(wallet.user_id, wallet, "top_up", amount_php, txn.id, req.note)
    except Exception:
        logger.warning("Bank deposit #%s approved but wallet notification failed", deposit_id, exc_info=True)

    logger.info(
        "Bank deposit #%s approved — %.2f %s credited to %s",
        deposit_id, amount_php, deposit_currency, user_id,
    )
    return {
        "id": req.id,
        "chat_id": req.chat_id,
        "telegram_username": req.telegram_username,
        "channel": req.channel,
        "account_number": req.account_number,
        "amount_php": req.amount_php,
        "currency": deposit_currency,
        "receipt_file_id": req.receipt_file_id,
        "status": req.status,
        "note": req.note,
        "approved_by": req.approved_by,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "success": True,
        "message": f"{amount_php:,.2f} {deposit_currency} credited to the user's wallet",
        "credited_amount": amount_php,
        "credited_currency": deposit_currency,
        "wallet_id": wallet.id,
        "transaction_id": txn.id,
    }


@router.post("/{deposit_id}/reject", response_model=BankDepositRequestResponse)
async def reject_bank_deposit_request(
    deposit_id: int,
    body: RejectBankDepositRequest = RejectBankDepositRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not _can_approve_requests(current_user):
        raise HTTPException(status_code=403, detail="Deposit approval access required")
    """Reject a bank deposit request."""
    result = await db.execute(select(BankDepositRequest).where(BankDepositRequest.id == deposit_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Bank deposit request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    req.status = "rejected"
    req.note = body.note
    req.approved_by = getattr(current_user, "telegram_id", str(current_user.id))
    req.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(req)
    logger.info("Bank deposit #%s rejected", deposit_id)
    return req
