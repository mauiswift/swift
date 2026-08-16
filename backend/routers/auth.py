import logging
import os
import hashlib
import hmac
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from pydantic import BaseModel, Field, field_validator
from core.auth import (
    IDTokenValidationError,
    build_authorization_url,
    build_logout_url,
    generate_code_challenge,
    generate_code_verifier,
    generate_nonce,
    generate_state,
    validate_id_token,
    create_access_token,
    verify_password,
)
from core.config import settings
from core.database import get_db
from dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from models.auth import User
from models.admin_users import AdminUser
from models.bot_settings import Bot_settings
from models.kyb_registrations import KybRegistration
from models.merchant_api_config import MerchantApiConfig
from schemas.auth import (
    PlatformTokenExchangeRequest,
    TelegramWidgetLoginRequest,
    TokenExchangeResponse,
    UserResponse,
    UserPermissions,
    LoginRequest,
    LoginResponse,
)
from services.auth import AuthService, _get_platform_organization
from services.telegram_service import TelegramService
from sqlalchemy import select, and_, inspect, func
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


def _local_patch(url: str) -> str:
    """Patch URL for local development."""
    if os.getenv("LOCAL_PATCH", "").lower() not in ("true", "1"):
        return url

    patched_url = url.replace("https://", "http://").replace(":8000", ":3000")
    logger.debug("[get_dynamic_backend_url] patching URL from %s to %s", url, patched_url)
    return patched_url


def get_dynamic_backend_url(request: Request) -> str:
    """Get backend URL dynamically from request headers."""
    mgx_external_domain = request.headers.get("mgx-external-domain")
    x_forwarded_host = request.headers.get("x-forwarded-host")
    host = request.headers.get("host")
    scheme = request.headers.get("x-forwarded-proto", "https")

    effective_host = mgx_external_domain or x_forwarded_host or host
    if not effective_host:
        logger.warning("[get_dynamic_backend_url] No host found, fallback to %s", settings.backend_url)
        return settings.backend_url

    dynamic_url = _local_patch(f"{scheme}://{effective_host}")
    logger.debug(
        "[get_dynamic_backend_url] mgx-external-domain=%s, x-forwarded-host=%s, host=%s, scheme=%s, dynamic_url=%s",
        mgx_external_domain,
        x_forwarded_host,
        host,
        scheme,
        dynamic_url,
    )
    return dynamic_url


def derive_name_from_email(email: str) -> str:
    return email.split("@", 1)[0] if email else ""


def _get_runtime_config_value(setting_name: str, env_name: str) -> str:
    """Prefer the active settings value but fall back to the live OS environment when the cache is empty.

    This keeps test-time patches and runtime configuration overrides working while still tolerating a
    stale settings singleton that was initialized before the process environment was populated.
    """
    settings_value = str(getattr(settings, setting_name, "") or "").strip()
    if settings_value:
        return settings_value

    env_value = os.environ.get(env_name, "")
    if env_value:
        return str(env_value).strip()

    return ""


def _get_allowed_telegram_admin_ids() -> tuple[set[str], set[str]]:
    """Parse TELEGRAM_ADMIN_IDS into two sets: numeric IDs and lowercase usernames."""
    allowed_ids: set[str] = set()
    allowed_usernames: set[str] = set()

    raw = _get_runtime_config_value("telegram_admin_ids", "TELEGRAM_ADMIN_IDS")
    for entry in raw.split(","):
        cleaned = entry.strip()
        if not cleaned:
            continue
        if cleaned.startswith("@"):
            allowed_usernames.add(cleaned[1:].lower())
        elif cleaned.isdigit():
            allowed_ids.add(cleaned)
        else:
            allowed_usernames.add(cleaned.lower())

    return allowed_ids, allowed_usernames


_CLOCK_SKEW_TOLERANCE_SECONDS = 30


def _verify_telegram_widget_payload(
    payload: TelegramWidgetLoginRequest,
    bot_token: str,
    max_age_seconds: int = 86400,
) -> tuple[bool, str]:
    """Verify a Telegram Login Widget HMAC payload."""
    if not bot_token:
        logger.error("[_verify_telegram_widget_payload] bot_token is empty or None")
        return False, "bot_token_missing"

    now = int(time.time())
    if payload.auth_date > (now + _CLOCK_SKEW_TOLERANCE_SECONDS):
        logger.error(
            "[_verify_telegram_widget_payload] auth_date is in the future: "
            "auth_date=%s, now=%s, diff=%ss",
            payload.auth_date, now, payload.auth_date - now,
        )
        return False, "auth_date_future"
    if (now - payload.auth_date) > max_age_seconds:
        logger.error(
            "[_verify_telegram_widget_payload] auth_date is too old: "
            "auth_date=%s, now=%s, age=%ss",
            payload.auth_date, now, now - payload.auth_date,
        )
        return False, "auth_date_expired"

    fields = payload.model_dump(exclude={"hash", "cf_turnstile_token"}, exclude_none=True)

    data_check_string = "\n".join(
        f"{key}={str(value).lower() if isinstance(value, bool) else value}"
        for key, value in sorted(fields.items())
        if value is not None and value != ""
    )

    logger.debug(
        "[_verify_telegram_widget_payload] data_check_string=%s",
        repr(data_check_string),
    )

    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, payload.hash):
        logger.error(
            "[_verify_telegram_widget_payload] hash mismatch: "
            "computed=%s, received=%s",
            computed_hash, payload.hash,
        )
        return False, "hash_mismatch"

    return True, "ok"


async def _verify_turnstile_token(token: str, secret_key: str, remote_ip: Optional[str] = None) -> bool:
    """Verify a Cloudflare Turnstile token."""
    data: dict = {"secret": secret_key, "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data=data,
            )
        resp.raise_for_status()
        result = resp.json()
        success = bool(result.get("success"))
        if not success:
            logger.warning(
                "[_verify_turnstile_token] Turnstile verification failed: error-codes=%s",
                result.get("error-codes"),
            )
        return success
    except Exception as exc:
        logger.error("[_verify_turnstile_token] Request failed: %s", exc)
        return False


@router.post("/telegram-login", response_model=TokenExchangeResponse)
async def telegram_login_legacy_disabled():
    """Legacy endpoint intentionally disabled."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Legacy login is disabled. Use Telegram Login Widget sign-in.",
    )


@router.post("/telegram-login-widget", response_model=TokenExchangeResponse)
async def telegram_login_widget(payload: TelegramWidgetLoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Telegram Login Widget admin login."""
    bot_token = _get_runtime_config_value("telegram_bot_token", "TELEGRAM_BOT_TOKEN")
    allowed_admin_ids, allowed_admin_usernames = _get_allowed_telegram_admin_ids()

    logger.info(
        "[telegram-login-widget] Login attempt: user_id=%s, username=%s, "
        "bot_token_set=%s, admins_configured=%s",
        payload.id,
        payload.username,
        bool(bot_token),
        bool(allowed_admin_ids or allowed_admin_usernames),
    )

    turnstile_secret = _get_runtime_config_value("cloudflare_turnstile_secret_key", "CLOUDFLARE_TURNSTILE_SECRET_KEY")
    if turnstile_secret:
        if not payload.cf_turnstile_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Turnstile verification token is required.",
            )
        cf_ip = request.headers.get("CF-Connecting-IP")
        client_ip = request.client.host if request.client else None
        remote_ip = cf_ip or client_ip
        token_valid = await _verify_turnstile_token(payload.cf_turnstile_token, turnstile_secret, remote_ip)
        if not token_valid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Turnstile verification failed. Please refresh and try again.",
            )

    if not bot_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram bot token is not configured.",
        )

    valid, reason = _verify_telegram_widget_payload(payload, bot_token)
    if not valid:
        logger.error(
            "[telegram-login-widget] Verification failed for user_id=%s, username=%s, reason=%s",
            payload.id,
            payload.username,
            reason,
        )
        _REASON_DETAILS = {
            "auth_date_future": "Telegram payload timestamp is in the future. Check your server clock.",
            "auth_date_expired": "Telegram login session has expired. Please sign in again.",
            "hash_mismatch": (
                "Invalid Telegram login payload. "
                "Ensure TELEGRAM_BOT_TOKEN matches the token from @BotFather."
            ),
        }
        detail = _REASON_DETAILS.get(reason, "Invalid Telegram login payload.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    telegram_user_id = str(payload.id)
    payload_username = (payload.username or "").lower()

    db_admin = None
    try:
        res = await db.execute(select(AdminUser).where(AdminUser.telegram_id == telegram_user_id))
        db_admin = res.scalar_one_or_none()

        if not db_admin and payload_username:
            res = await db.execute(select(AdminUser).where(func.lower(AdminUser.telegram_username) == payload_username))
            db_admin = res.scalar_one_or_none()
            if db_admin and db_admin.telegram_id.startswith("web-"):
                db_admin.telegram_id = telegram_user_id
                await db.commit()
                logger.info("[telegram-login-widget] Linked web registration to Telegram ID: %s", telegram_user_id)
    except Exception as e:
        logger.error("[telegram-login-widget] DB lookup failed: %s", e)

    in_env = telegram_user_id in allowed_admin_ids or payload_username in allowed_admin_usernames
    in_db = db_admin is not None and db_admin.is_active

    if not in_db and not in_env:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access the admin dashboard.",
        )
    
    # Payload verification already performed earlier; proceed with login flow
    logger.info("[telegram-login-widget] Payload verified for user_id=%s", payload.id)

    display_name = " ".join(part for part in [payload.first_name, payload.last_name] if part).strip()
    if not display_name:
        display_name = payload.username or telegram_user_id

    if in_env:
        perms = UserPermissions(
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
        platform_org_id, platform_org_name = _get_platform_organization()
        if db_admin:
            try:
                db_admin.is_super_admin = True
                db_admin.can_manage_bot = True
                db_admin.can_approve_topups = True
                db_admin.can_manage_team = True
                db_admin.name = display_name
                db_admin.telegram_username = payload.username or db_admin.telegram_username
                db_admin.organization_id = platform_org_id
                db_admin.organization_name = platform_org_name
                await db.commit()
            except Exception:
                await db.rollback()
        else:
            try:
                new_admin = AdminUser(
                    telegram_id=telegram_user_id,
                    telegram_username=payload.username,
                    name=display_name,
                    is_active=True,
                    is_super_admin=True,
                    can_manage_payments=True,
                    can_manage_disbursements=True,
                    can_view_reports=True,
                    can_manage_wallet=True,
                    can_manage_transactions=True,
                    can_manage_bot=True,
                    can_approve_topups=True,
                    can_manage_team=True,
                    organization_id=platform_org_id,
                    organization_name=platform_org_name,
                    added_by="env_config",
                )
                db.add(new_admin)
                await db.commit()
            except Exception:
                await db.rollback()
    else:
        perms = UserPermissions(
            is_super_admin=db_admin.is_super_admin,
            can_manage_payments=db_admin.can_manage_payments,
            can_manage_disbursements=db_admin.can_manage_disbursements,
            can_view_reports=db_admin.can_view_reports,
            can_manage_wallet=db_admin.can_manage_wallet,
            can_manage_transactions=db_admin.can_manage_transactions,
            can_manage_bot=db_admin.can_manage_bot,
            can_approve_topups=db_admin.can_approve_topups,
            can_manage_team=db_admin.can_manage_team,
        )
        try:
            db_admin.name = display_name
            db_admin.telegram_username = payload.username or db_admin.telegram_username
            await db.commit()
        except Exception:
            await db.rollback()

    admin_email = getattr(settings, "admin_user_email", "") or f"{telegram_user_id}@paybot.local"
    user = User(id=telegram_user_id, email=admin_email, name=display_name, role="admin")
    auth_service = AuthService(db)
    token_org_id = None
    token_org_name = None
    store_name = None
    store_logo = None
    perm_link = None

    if in_env:
        token_org_id, token_org_name = _get_platform_organization()
    elif db_admin:
        token_org_id = db_admin.organization_id
        token_org_name = db_admin.organization_name

    if token_org_id:
        api_stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == token_org_id)
        api_cfg = (await db.execute(api_stmt)).scalar_one_or_none()
        if api_cfg:
            store_name = api_cfg.store_name
            store_logo = api_cfg.store_logo_url
            perm_link = api_cfg.permanent_link_slug

    try:
        app_token, _, _ = await auth_service.issue_app_token(
            user=user,
            permissions=perms,
            organization_id=token_org_id,
            organization_name=token_org_name,
            store_name=store_name,
            store_logo_url=store_logo,
            permanent_link_slug=perm_link
        )
    except ValueError as exc:
        logger.error("[telegram-login-widget] Failed to issue token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured.",
        )

    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        organization_id=token_org_id,
        organization_name=token_org_name,
        permissions=perms,
        store_name=store_name,
        store_logo_url=store_logo,
        permanent_link_slug=perm_link
    )

    logger.info("[telegram-login-widget] Bot admin authenticated: %s", telegram_user_id)

    try:
        secure = os.getenv("ENVIRONMENT", "prod").lower() not in ("dev", "development", "local")
        response.set_cookie(key="turnstile_verified", value="1", httponly=True, secure=secure, max_age=86400, path="/")
    except Exception:
        pass
    return TokenExchangeResponse(token=app_token, user=user_resp)


class TurnstileVerifyRequest(BaseModel):
    token: str


@router.post("/turnstile/verify")
async def turnstile_verify(payload: TurnstileVerifyRequest, request: Request, response: Response):
    """Verify a Cloudflare Turnstile token."""
    secret = str(getattr(settings, "cloudflare_turnstile_secret_key", "") or "")
    if not secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Turnstile not configured")
    token = payload.token
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing turnstile token")
    cf_ip = request.headers.get("CF-Connecting-IP")
    client_ip = request.client.host if request.client else None
    remote_ip = cf_ip or client_ip
    valid = await _verify_turnstile_token(token, secret, remote_ip)
    if not valid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Turnstile verification failed")
    secure = os.getenv("ENVIRONMENT", "prod").lower() not in ("dev", "development", "local")
    resp = JSONResponse({"success": True})
    resp.set_cookie(key="turnstile_verified", value="1", httponly=True, secure=secure, max_age=86400, path="/")
    return resp


@router.get("/telegram-login-config")
async def telegram_login_config():
    """Provide Telegram Login Widget config at runtime."""
    configured_username = (os.getenv("VITE_TELEGRAM_BOT_USERNAME") or settings.telegram_bot_username or "").strip()
    if configured_username:
        return {"bot_username": configured_username.lstrip("@")}

    bot_token = str(getattr(settings, "telegram_bot_token", "") or "")
    if not bot_token:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Telegram bot token not configured")

    service = TelegramService()
    result = await service.get_bot_info()
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to resolve Telegram bot username")

    username = str(result.get("bot", {}).get("username", "") or "").strip()
    if not username:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Telegram bot username unavailable")

    return {"bot_username": username}


@router.get("/social-config")
async def social_config(db: AsyncSession = Depends(get_db)):
    """Public endpoint: returns social channel contact info."""
    telegram_bot_username = (
        os.getenv("VITE_TELEGRAM_BOT_USERNAME") or settings.telegram_bot_username or ""
    ).strip().lstrip("@")

    messenger_page_username = ""
    whatsapp_number = ""
    result = await db.execute(select(Bot_settings).limit(1))
    row = result.scalar_one_or_none()
    if row:
        messenger_page_username = (row.messenger_page_username or "").strip()
        whatsapp_number = (row.whatsapp_number or "").strip()

    return {
        "telegram_bot_username": telegram_bot_username,
        "messenger_page_username": messenger_page_username,
        "whatsapp_number": whatsapp_number,
    }


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Email/password login for dashboard access."""
    turnstile_secret = str(getattr(settings, "cloudflare_turnstile_secret_key", "") or "")
    if turnstile_secret:
        if not payload.cf_turnstile_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Turnstile verification token is required.",
            )
        cf_ip = request.headers.get("CF-Connecting-IP")
        client_ip = request.client.host if request.client else None
        remote_ip = cf_ip or client_ip
        token_valid = await _verify_turnstile_token(payload.cf_turnstile_token, turnstile_secret, remote_ip)
        if not token_valid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Turnstile verification failed. Please refresh and try again.",
            )

    admin_email = getattr(settings, "admin_user_email", "") or "admin@paybot.local"
    admin_password = getattr(settings, "admin_user_password", "") or os.getenv("ADMIN_PASSWORD", "admin123")

    authenticated_user = None
    if payload.email == admin_email and payload.password == admin_password:
        admin_id = getattr(settings, "admin_user_id", "admin")
        authenticated_user = User(id=admin_id, email=admin_email, name="Admin User", role="admin")

    if not authenticated_user and payload.email == "demo@paybot.local" and payload.password == "demo123":
        authenticated_user = User(id="demo_user", email="demo@paybot.local", name="Demo User", role="user")

    if not authenticated_user:
        # Merchant login using admin-issued dashboard credentials (set on KYB approval).
        merchant_res = await db.execute(
            select(AdminUser).where(func.lower(AdminUser.email) == payload.email.strip().lower())
        )
        merchant_record = merchant_res.scalar_one_or_none()
        if (
            merchant_record
            and merchant_record.is_active
            and merchant_record.password_hash
            and verify_password(payload.password, merchant_record.password_hash)
        ):
            authenticated_user = User(
                id=merchant_record.telegram_id,
                email=merchant_record.email,
                name=merchant_record.name or merchant_record.email,
                role="admin",
            )

    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    auth_service = AuthService(db)
    claims_override = {"device_id": payload.device_id} if payload.device_id else {}
    expires_minutes = int(getattr(settings, "jwt_expire_minutes", 60))
    
    res_perms = await db.execute(select(AdminUser).where(AdminUser.telegram_id == authenticated_user.id))
    admin_record = res_perms.scalar_one_or_none()
    
    org_id = None
    org_name = None
    store_name = None
    store_logo = None
    perm_link = None

    if admin_record:
        org_id = admin_record.organization_id
        org_name = admin_record.organization_name

        # Fetch branding if organization exists
        if org_id:
            api_stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == org_id)
            api_cfg = (await db.execute(api_stmt)).scalar_one_or_none()
            if api_cfg:
                store_name = api_cfg.store_name
                store_logo = api_cfg.store_logo_url
                perm_link = api_cfg.permanent_link_slug

        perms = UserPermissions(
            is_super_admin=admin_record.is_super_admin,
            can_manage_payments=admin_record.can_manage_payments,
            can_manage_disbursements=admin_record.can_manage_disbursements,
            can_view_reports=admin_record.can_view_reports,
            can_manage_wallet=admin_record.can_manage_wallet,
            can_manage_transactions=admin_record.can_manage_transactions,
            can_manage_bot=admin_record.can_manage_bot,
            can_approve_topups=admin_record.can_approve_topups,
            can_manage_team=admin_record.can_manage_team,
        )
    elif authenticated_user.role == "admin":
        # Fallback for environment-configured admin
        org_id, org_name = _get_platform_organization()
        perms = UserPermissions(
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
    else:
        perms = UserPermissions(is_super_admin=False)
    
    token_claims = {
        "sub": authenticated_user.id,
        "email": authenticated_user.email,
        "role": authenticated_user.role,
        "name": authenticated_user.name,
        "permissions": perms.model_dump(),
        "organization_id": org_id,
        "organization_name": org_name,
        "store_name": store_name,
        "store_logo_url": store_logo,
        "permanent_link_slug": perm_link,
        **claims_override
    }
    
    app_token = create_access_token(token_claims, expires_minutes=expires_minutes)

    user_resp = UserResponse(
        id=authenticated_user.id,
        email=authenticated_user.email,
        name=authenticated_user.name,
        role=authenticated_user.role,
        organization_id=org_id,
        organization_name=org_name,
        permissions=perms,
        store_name=store_name,
        store_logo_url=store_logo,
        permanent_link_slug=perm_link
    )

    return LoginResponse(
        access_token=app_token,
        user=user_resp,
    )


@router.post("/terminal-login", response_model=LoginResponse)
async def terminal_login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Mobile POS terminal login."""
    admin_email = getattr(settings, "admin_user_email", "") or "admin@paybot.local"
    admin_password = getattr(settings, "admin_user_password", "") or os.getenv("ADMIN_PASSWORD", "admin123")

    authenticated_user = None
    if payload.email == admin_email and payload.password == admin_password:
        admin_id = getattr(settings, "admin_user_id", "admin")
        authenticated_user = User(id=admin_id, email=admin_email, name="Admin User", role="admin")

    if not authenticated_user and payload.email == "demo@paybot.local" and payload.password == "demo123":
        authenticated_user = User(id="demo_user", email="demo@paybot.local", name="Demo User", role="user")

    if not authenticated_user:
        # Merchant login using admin-issued dashboard credentials (set on KYB approval).
        merchant_res = await db.execute(
            select(AdminUser).where(func.lower(AdminUser.email) == payload.email.strip().lower())
        )
        merchant_record = merchant_res.scalar_one_or_none()
        if (
            merchant_record
            and merchant_record.is_active
            and merchant_record.password_hash
            and verify_password(payload.password, merchant_record.password_hash)
        ):
            authenticated_user = User(
                id=merchant_record.telegram_id,
                email=merchant_record.email,
                name=merchant_record.name or merchant_record.email,
                role="admin",
            )

    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    auth_service = AuthService(db)
    claims_override = {"device_id": payload.device_id} if payload.device_id else {}
    expires_minutes = int(getattr(settings, "jwt_expire_minutes", 60))
    
    res_perms = await db.execute(select(AdminUser).where(AdminUser.telegram_id == authenticated_user.id))
    admin_record = res_perms.scalar_one_or_none()
    
    org_id = None
    org_name = None
    store_name = None
    store_logo = None
    perm_link = None

    if admin_record:
        org_id = admin_record.organization_id
        org_name = admin_record.organization_name

        # Fetch branding if organization exists
        if org_id:
            api_stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == org_id)
            api_cfg = (await db.execute(api_stmt)).scalar_one_or_none()
            if api_cfg:
                store_name = api_cfg.store_name
                store_logo = api_cfg.store_logo_url
                perm_link = api_cfg.permanent_link_slug

        perms = UserPermissions(
            is_super_admin=admin_record.is_super_admin,
            can_manage_payments=admin_record.can_manage_payments,
            can_manage_disbursements=admin_record.can_manage_disbursements,
            can_view_reports=admin_record.can_view_reports,
            can_manage_wallet=admin_record.can_manage_wallet,
            can_manage_transactions=admin_record.can_manage_transactions,
            can_manage_bot=admin_record.can_manage_bot,
            can_approve_topups=admin_record.can_approve_topups,
            can_manage_team=admin_record.can_manage_team,
        )
    elif authenticated_user.role == "admin":
        # Fallback for environment-configured admin
        org_id, org_name = _get_platform_organization()
        perms = UserPermissions(
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
    else:
        perms = UserPermissions(is_super_admin=False)
    
    token_claims = {
        "sub": authenticated_user.id,
        "email": authenticated_user.email,
        "role": authenticated_user.role,
        "name": authenticated_user.name,
        "permissions": perms.model_dump(),
        "organization_id": org_id,
        "organization_name": org_name,
        "store_name": store_name,
        "store_logo_url": store_logo,
        "permanent_link_slug": perm_link,
        **claims_override
    }
    
    app_token = create_access_token(token_claims, expires_minutes=expires_minutes)

    user_resp = UserResponse(
        id=authenticated_user.id,
        email=authenticated_user.email,
        name=authenticated_user.name,
        role=authenticated_user.role,
        organization_id=org_id,
        organization_name=org_name,
        permissions=perms,
        store_name=store_name,
        store_logo_url=store_logo,
        permanent_link_slug=perm_link
    )

    return LoginResponse(
        access_token=app_token,
        user=user_resp,
    )


@router.get("/login-oidc")
async def login_oidc(request: Request, db: AsyncSession = Depends(get_db)):
    """Start OIDC login flow with PKCE."""
    state = generate_state()
    nonce = generate_nonce()
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)

    auth_service = AuthService(db)
    await auth_service.store_oidc_state(state, nonce, code_verifier)

    backend_url = get_dynamic_backend_url(request)
    redirect_uri = f"{backend_url}/api/v1/auth/callback"
    logger.info("[login-oidc] Starting OIDC flow with redirect_uri=%s", redirect_uri)

    auth_url = build_authorization_url(state, nonce, code_challenge, redirect_uri=redirect_uri)
    return RedirectResponse(
        url=auth_url,
        status_code=status.HTTP_302_FOUND,
        headers={"X-Request-ID": state},
    )


@router.get("/callback")
async def callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle OIDC callback."""
    backend_url = get_dynamic_backend_url(request)

    def redirect_with_error(message: str) -> RedirectResponse:
        fragment = urlencode({"msg": message})
        return RedirectResponse(
            url=f"{backend_url}/auth/error?{fragment}",
            status_code=status.HTTP_302_FOUND,
        )

    if error:
        return redirect_with_error(f"OIDC error: {error}")

    if not code or not state:
        return redirect_with_error("Missing code or state parameter")

    auth_service = AuthService(db)
    temp_data = await auth_service.get_and_delete_oidc_state(state)
    if not temp_data:
        return redirect_with_error("Invalid or expired state parameter")

    nonce = temp_data["nonce"]
    code_verifier = temp_data.get("code_verifier")

    try:
        redirect_uri = f"{backend_url}/api/v1/auth/callback"
        logger.info("[callback] Exchanging code for tokens with redirect_uri=%s", redirect_uri)

        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.oidc_client_id,
            "client_secret": settings.oidc_client_secret,
        }

        if code_verifier:
            token_data["code_verifier"] = code_verifier

        token_url = f"{settings.oidc_issuer_url}/token"
        try:
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    token_url,
                    data=token_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded", "X-Request-ID": state},
                )
        except httpx.HTTPError as e:
            logger.error("[callback] Token exchange HTTP error: %s", str(e), exc_info=True)
            return redirect_with_error(f"Token exchange failed: {e}")

        if token_response.status_code != 200:
            logger.error("[callback] Token exchange failed: status_code=%s, response=%s", token_response.status_code, token_response.text)
            return redirect_with_error(f"Token exchange failed: {token_response.text}")

        tokens = token_response.json()
        id_token = tokens.get("id_token")
        if not id_token:
            return redirect_with_error("No ID token received")

        id_claims = await validate_id_token(id_token)

        if id_claims.get("nonce") != nonce:
            return redirect_with_error("Invalid nonce")

        email = id_claims.get("email", "")
        name = id_claims.get("name") or derive_name_from_email(email)
        user = await auth_service.get_or_create_user(platform_sub=id_claims["sub"], email=email, name=name)

        app_token, expires_at, _ = await auth_service.issue_app_token(user=user)

        fragment = urlencode(
            {
                "token": app_token,
                "expires_at": int(expires_at.timestamp()),
                "token_type": "Bearer",
            }
        )

        redirect_url = f"{backend_url}/auth/callback?{fragment}"
        logger.info("[callback] OIDC callback successful")
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    except IDTokenValidationError as e:
        return redirect_with_error(f"Authentication failed: {e.message}")
    except HTTPException as e:
        return redirect_with_error(str(e.detail))
    except Exception as e:
        logger.exception(f"Unexpected error in OIDC callback: {e}")
        return redirect_with_error("Authentication processing failed.")


@router.post("/token/exchange", response_model=TokenExchangeResponse)
async def exchange_platform_token(
    payload: PlatformTokenExchangeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange Platform token for app token."""
    logger.info("[token/exchange] Received platform token exchange request")

    verify_url = f"{settings.oidc_issuer_url}/platform/tokens/verify"
    logger.debug(f"[token/exchange] Verifying token with issuer: {verify_url}")

    try:
        async with httpx.AsyncClient() as client:
            verify_response = await client.post(
                verify_url,
                json={"platform_token": payload.platform_token},
                headers={"Content-Type": "application/json"},
            )
    except httpx.HTTPError as exc:
        logger.error(f"[token/exchange] HTTP error: {exc}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to verify platform token")

    try:
        verify_body = verify_response.json()
    except ValueError:
        logger.error(f"[token/exchange] Failed to parse response")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid response")

    if not isinstance(verify_body, dict):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unexpected response")

    if verify_response.status_code != status.HTTP_200_OK or not verify_body.get("success"):
        message = verify_body.get("message", "")
        logger.warning(f"[token/exchange] Token verification failed: {message}")
        raise HTTPException(status_code=verify_response.status_code, detail=message or "Platform token verification failed")

    payload_data = verify_body.get("data") or {}
    raw_user_id = payload_data.get("user_id")
    logger.info(f"[token/exchange] Token verified for user_id={raw_user_id}")

    if not raw_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user_id in payload")

    platform_user_id = str(raw_user_id)
    if platform_user_id != str(settings.admin_user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin user can exchange platform token")

    auth_service = AuthService(db)
    admin_email = payload_data.get("email", "") or getattr(settings, "admin_user_email", "")
    admin_name = payload_data.get("name") or payload_data.get("username") or derive_name_from_email(admin_email)

    user = User(id=platform_user_id, email=admin_email, name=admin_name, role="admin")

    # Fetch branding for platform admin
    platform_org_id, platform_org_name = _get_platform_organization()
    store_name = None
    store_logo = None
    perm_link = None

    api_stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == platform_org_id)
    api_cfg = (await db.execute(api_stmt)).scalar_one_or_none()
    if api_cfg:
        store_name = api_cfg.store_name
        store_logo = api_cfg.store_logo_url
        perm_link = api_cfg.permanent_link_slug

    app_token, _, _ = await auth_service.issue_app_token(
        user=user,
        organization_id=platform_org_id,
        organization_name=platform_org_name,
        store_name=store_name,
        store_logo_url=store_logo,
        permanent_link_slug=perm_link
    )

    return TokenExchangeResponse(token=app_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user info."""
    return current_user


@router.get("/logout")
async def logout():
    """Logout user."""
    logout_url = build_logout_url()
    return {"redirect_url": logout_url}


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    address: Optional[str] = None
    business_name: Optional[str] = None
    telegram_username: Optional[str] = None
    nda_accepted: bool = Field(default=False, description="Required acceptance of the NDA before account registration.")

    @field_validator("email", mode="before")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        import re
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(v).strip()):
            raise ValueError("Invalid email address")
        return str(v).strip().lower()

    @field_validator("telegram_username", mode="before")
    @classmethod
    def strip_at(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        stripped = str(v).lstrip("@").strip()
        return stripped or None

    @field_validator("nda_accepted")
    @classmethod
    def validate_nda_accepted(cls, v: bool) -> bool:
        if not v:
            raise ValueError("NDA acceptance is required before account registration.")
        return True


class RegisterResponse(BaseModel):
    message: str
    kyb_id: int
    reference_code: Optional[str] = None
    xendit_customer_id: Optional[str] = None


def _generate_reference_code() -> str:
    return str(secrets.randbelow(900000) + 100000)


async def _get_unique_reference_code(db: AsyncSession) -> str:
    for _ in range(50):
        code = _generate_reference_code()
        result = await db.execute(select(KybRegistration).where(KybRegistration.reference_code == code))
        if result.scalar_one_or_none() is None:
            return code
    raise HTTPException(status_code=500, detail="Unable to generate a unique KYB reference code.")


@router.post("/register", response_model=RegisterResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Public registration endpoint."""
    chat_id = f"web-{hashlib.sha256(body.email.lower().encode()).hexdigest()[:16]}"

    existing = await db.execute(
        select(KybRegistration).where(KybRegistration.chat_id == chat_id)
    )
    existing_kyb = existing.scalar_one_or_none()
    if existing_kyb:
        if existing_kyb.status == "approved":
            raise HTTPException(status_code=400, detail="This email is already registered and approved.")
        return RegisterResponse(
            message="Your registration is already submitted and under review.",
            kyb_id=existing_kyb.id,
            reference_code=existing_kyb.reference_code,
            xendit_customer_id=None,
        )

    reference_code = await _get_unique_reference_code(db)
    kyb = KybRegistration(
        chat_id=chat_id,
        telegram_username=body.telegram_username,
        step="done",
        full_name=body.full_name,
        email=body.email,
        phone=body.phone,
        address=body.address,
        bank_name=body.business_name,
        reference_code=reference_code,
        nda_accepted=body.nda_accepted,
        nda_signed_at=datetime.now(timezone.utc),
        status="pending_review",
    )
    db.add(kyb)
    await db.commit()
    await db.refresh(kyb)

    return RegisterResponse(
        message="Registration submitted successfully.",
        kyb_id=kyb.id,
        reference_code=kyb.reference_code,
        xendit_customer_id=None,
    )
