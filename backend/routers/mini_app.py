"""Telegram Mini App authentication and wallet bootstrap endpoints."""

import hashlib
import hmac
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import create_access_token
from core.config import settings
from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.topup_requests import TopupRequest
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserPermissions, UserResponse
from services.swiftpay_service import SwiftPayService
from services.wallets import WalletsService

router = APIRouter(prefix="/api/v1/mini-app", tags=["telegram-mini-app"])


class MiniAppAuthRequest(BaseModel):
    init_data: str = Field(min_length=1, max_length=8192)


class MiniAppWithdrawalRequest(BaseModel):
    amount: float = Field(gt=0)
    currency: str = "PHP"
    bank_code: str = Field(min_length=2, max_length=128)
    account_number: str = Field(min_length=4, max_length=64)
    first_name: str = Field(min_length=1, max_length=128)
    last_name: str = Field(min_length=1, max_length=128)
    middle_name: str | None = Field(default=None, max_length=128)
    recipient_phone: str | None = None
    email: str | None = None
    note: str | None = Field(default=None, max_length=500)


def _mask_account(value: str | None) -> str:
    raw = str(value or "")
    return f"••••{raw[-4:]}" if len(raw) > 4 else ("••••" if raw else "")


def _verify_init_data(init_data: str, bot_token: str) -> dict[str, Any]:
    """Validate Telegram Web App initData and return its signed fields."""
    fields = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = fields.pop("hash", "")
    if not received_hash or not bot_token:
        raise HTTPException(status_code=503, detail="Telegram Mini App authentication is not configured")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(fields.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid Telegram Mini App authentication data")

    try:
        auth_date = int(fields.get("auth_date", "0"))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Telegram Mini App authentication timestamp") from exc
    if auth_date <= 0 or time.time() - auth_date > 86400 or auth_date > time.time() + 30:
        raise HTTPException(status_code=401, detail="Telegram Mini App authentication data has expired")

    try:
        telegram_user = json.loads(fields["user"])
    except (KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Telegram user data is missing or invalid") from exc
    if not isinstance(telegram_user, dict) or not telegram_user.get("id"):
        raise HTTPException(status_code=401, detail="Telegram user data is invalid")
    return telegram_user


@router.post("/auth")
async def authenticate_mini_app(
    payload: MiniAppAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate a Telegram Mini App user and issue the normal app JWT."""
    telegram_user = _verify_init_data(payload.init_data, settings.telegram_bot_token)
    telegram_id = str(telegram_user["id"])
    username = telegram_user.get("username")
    display_name = " ".join(
        part for part in (telegram_user.get("first_name"), telegram_user.get("last_name")) if part
    ).strip() or username or telegram_id

    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == telegram_id))
    if not admin or not admin.is_super_admin:
        raise HTTPException(status_code=403, detail="Telegram Mini App access is restricted to super admins")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="This Telegram account is disabled")
    admin.telegram_username = username or admin.telegram_username
    admin.name = display_name

    await db.flush()
    await WalletsService(db).ensure_admin_wallets(telegram_id, ["PHP", "CNY", "KRW", "USDT"])
    await db.commit()

    permissions = UserPermissions(
        is_super_admin=True,
        can_manage_payments=True,
        can_manage_disbursements=True,
        can_view_reports=True,
        can_manage_wallet=True,
        can_manage_transactions=True,
        can_manage_bot=True,
        can_approve_topups=True,
        can_manage_team=True,
    )
    claims = {
        "sub": telegram_id,
        "email": admin.email or f"{telegram_id}@telegram.local",
        "role": "admin",
        "name": display_name,
        "permissions": permissions.model_dump(),
        "must_change_password": False,
    }
    token = create_access_token(claims, expires_minutes=60 * 24)
    return {
        "token": token,
        "user": UserResponse(
            id=telegram_id,
            email=claims["email"],
            name=display_name,
            role="user",
            permissions=permissions,
        ),
    }


@router.post("/withdraw")
async def create_mini_app_withdrawal(
    payload: MiniAppWithdrawalRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reserve funds and send a super-admin payout through SwiftPay."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")

    currency = payload.currency.strip().upper()
    if currency != "PHP":
        raise HTTPException(status_code=400, detail="SwiftPay money-out currently supports PHP only")
    recipient_phone = SwiftPayService.normalize_philippine_mobile(payload.recipient_phone)
    if not recipient_phone:
        raise HTTPException(status_code=422, detail="A valid Philippine mobile number is required")

    reference_id = f"mini-withdraw-{uuid.uuid4().hex[:16]}"
    try:
        result = await WalletsService(db).withdraw_request(
            user_id=str(current_user.id),
            amount=payload.amount,
            bank_name=payload.bank_code,
            account_number=payload.account_number,
            account_name=" ".join(filter(None, [payload.first_name, payload.middle_name, payload.last_name])),
            recipient_phone=recipient_phone,
            note=payload.note or "Telegram Mini App withdrawal",
            currency=currency,
            external_reference=reference_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    service = SwiftPayService()
    provider_result = await service.send_disbursement(
        reference_no=reference_id,
        amount=payload.amount,
        bank_code=payload.bank_code,
        account_number=payload.account_number,
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        phone=recipient_phone,
        email=payload.email,
        note=payload.note or "Telegram Mini App money out",
        currency=currency,
    )
    disbursement = await db.scalar(
        select(Disbursements).where(Disbursements.external_id == reference_id)
    )
    if not provider_result.get("success"):
        if disbursement:
            disbursement.status = "failed"
            disbursement.failure_reason = provider_result.get("error", "SwiftPay disbursement failed")
            disbursement.updated_at = datetime.now(timezone.utc)
            wallet = await WalletsService(db).get_or_create_wallet(str(current_user.id), currency, lock=True)
            refund = round(float(disbursement.amount) + float(disbursement.processing_fee or 0), 2)
            wallet.balance = round(float(wallet.balance or 0) + refund, 2)
            wallet.available_balance = round(float(wallet.available_balance or 0) + refund, 2)
            await db.execute(
                update(Wallet_transactions)
                .where(Wallet_transactions.reference_id.in_([reference_id, f"{reference_id}-fee"]))
                .values(status="failed")
            )
            await db.commit()
        raise HTTPException(status_code=502, detail=provider_result.get("error", "SwiftPay disbursement failed"))

    if disbursement:
        disbursement.status = "transferring"
        disbursement.processed_at = datetime.now(timezone.utc)
        disbursement.updated_at = datetime.now(timezone.utc)
        provider_data = provider_result.get("data") or {}
        disbursement.xendit_id = str(provider_data.get("id") or provider_data.get("disbursementId") or "") or None
        await db.commit()

    return {
        "success": True,
        **result,
        "status": "transferring",
        "provider": provider_result.get("data"),
    }


@router.get("/config")
async def mini_app_config():
    """Expose non-secret deployment configuration for the Mini App client."""
    base_url = (
        settings.telegram_mini_app_url
        or
        settings.public_checkout_host
        or settings.frontend_url
        or settings.railway_public_domain
    ).rstrip("/")
    return {"app_url": base_url if settings.telegram_mini_app_url else (f"{base_url}/mini-app" if base_url else "/mini-app")}


@router.get("/admin/overview")
async def mini_app_admin_overview(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return operational totals for the super-admin Telegram Mini App."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")

    balance_rows = (
        await db.execute(
            select(
                Wallets.currency,
                func.count(Wallets.id),
                func.coalesce(func.sum(Wallets.balance), 0.0),
                func.coalesce(func.sum(Wallets.available_balance), 0.0),
                func.coalesce(func.sum(Wallets.pending_balance), 0.0),
            )
            .group_by(Wallets.currency)
            .order_by(Wallets.currency)
        )
    ).all()
    pending_rows = (
        await db.execute(
            select(
                func.count(Disbursements.id),
                func.coalesce(func.sum(Disbursements.amount), 0.0),
            ).where(Disbursements.status.in_(("pending", "processing", "transferring")))
        )
    ).one()
    recent = (
        await db.execute(
            select(Disbursements)
            .order_by(Disbursements.created_at.desc(), Disbursements.id.desc())
            .limit(10)
        )
    ).scalars().all()

    return {
        "wallets": [
            {
                "currency": currency or "PHP",
                "wallet_count": int(wallet_count or 0),
                "balance": float(balance or 0),
                "available_balance": float(available_balance or 0),
                "pending_balance": float(pending_balance or 0),
            }
            for currency, wallet_count, balance, available_balance, pending_balance in balance_rows
        ],
        "pending_disbursements": {
            "count": int(pending_rows[0] or 0),
            "amount": float(pending_rows[1] or 0),
        },
        "recent_disbursements": [
            {
                "id": disbursement.id,
                "amount": float(disbursement.amount or 0),
                "currency": disbursement.currency or "PHP",
                "status": disbursement.status or "unknown",
                "account": _mask_account(disbursement.account_number),
                "created_at": disbursement.created_at.isoformat() if disbursement.created_at else None,
            }
            for disbursement in recent
        ],
    }


@router.get("/admin/requests")
async def mini_app_admin_requests(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return pending incoming and outgoing requests for the Mini App."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")

    topups = (
        await db.execute(
            select(TopupRequest)
            .where(TopupRequest.status == "pending")
            .order_by(TopupRequest.created_at.desc(), TopupRequest.id.desc())
            .limit(20)
        )
    ).scalars().all()
    withdrawals = (
        await db.execute(
            select(Disbursements)
            .where(Disbursements.status.in_(("pending", "processing")))
            .order_by(Disbursements.created_at.desc(), Disbursements.id.desc())
            .limit(20)
        )
    ).scalars().all()

    return {
        "topups": [
            {
                "id": item.id,
                "amount": float(item.amount_usdt or 0),
                "currency": item.currency or "USDT",
                "user_id": item.chat_id,
                "note": item.note or "",
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in topups
        ],
        "withdrawals": [
            {
                "id": item.id,
                "amount": float(item.amount or 0),
                "currency": item.currency or "PHP",
                "account": _mask_account(item.account_number),
                "status": item.status or "pending",
                "user_id": item.user_id,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in withdrawals
        ],
    }
