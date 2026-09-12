"""Telegram Mini App authentication and wallet bootstrap endpoints."""

import hashlib
import hmac
import json
import time
from typing import Any
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import create_access_token
from core.config import settings
from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from schemas.auth import UserPermissions, UserResponse
from services.wallets import WalletsService

router = APIRouter(prefix="/api/v1/mini-app", tags=["telegram-mini-app"])


class MiniAppAuthRequest(BaseModel):
    init_data: str = Field(min_length=1, max_length=8192)


class MiniAppWithdrawalRequest(BaseModel):
    amount: float = Field(gt=0)
    currency: str = "PHP"
    bank_name: str = Field(min_length=2, max_length=128)
    account_number: str = Field(min_length=4, max_length=64)
    account_name: str = Field(min_length=2, max_length=256)
    recipient_phone: str | None = None
    note: str | None = Field(default=None, max_length=500)


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
    if not admin:
        admin = AdminUser(
            telegram_id=telegram_id,
            telegram_username=username,
            name=display_name,
            email=f"{telegram_id}@telegram.local",
            role="user",
            is_active=True,
            is_super_admin=False,
        )
        db.add(admin)
    else:
        if not admin.is_active:
            raise HTTPException(status_code=403, detail="This Telegram account is disabled")
        admin.telegram_username = username or admin.telegram_username
        admin.name = display_name

    await db.flush()
    await WalletsService(db).ensure_admin_wallets(telegram_id, ["PHP", "USD"])
    await db.commit()

    permissions = UserPermissions()
    claims = {
        "sub": telegram_id,
        "email": admin.email or f"{telegram_id}@telegram.local",
        "role": "user",
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
    """Submit an authenticated wallet withdrawal for admin approval."""
    try:
        result = await WalletsService(db).withdraw_request(
            user_id=str(current_user.id),
            amount=payload.amount,
            bank_name=payload.bank_name,
            account_number=payload.account_number,
            account_name=payload.account_name,
            recipient_phone=payload.recipient_phone,
            note=payload.note or "Telegram Mini App withdrawal",
            currency=payload.currency,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"success": True, **result, "status": "processing"}


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
