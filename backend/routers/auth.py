import logging
import os
import hashlib
import hmac
import secrets
import time
import uuid
import base64
import json
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
    hash_password,
    verify_password,
)
from core.config import settings
from core.database import get_db
from dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, Response
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from models.auth import User, PasswordResetToken, TransactionOtpChallenge
from models.admin_users import AdminUser
from models.bot_settings import Bot_settings
from models.kyb_registrations import KybRegistration
from models.merchant_api_config import MerchantApiConfig
from models.referral_links import ReferralLink
from models.team_invitations import TeamInvitation
from schemas.auth import (
    GoogleLoginRequest,
    PlatformTokenExchangeRequest,
    TelegramWidgetLoginRequest,
    TokenExchangeResponse,
    UserResponse,
    UserPermissions,
    LoginRequest,
    LoginResponse,
)
from services.auth import (
    AuthService,
    _get_platform_organization,
    get_admin_user_permissions,
    normalize_organization_owner_scope,
)
from core.roles import (
    get_invited_super_admin_permissions,
    get_role_permissions,
    PredefinedRoleEnum,
    scope_permissions_to_organization,
)
from services.telegram_service import TelegramService
from services.wallets import WalletsService
from models.passkeys import PasskeyChallenge
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from sqlalchemy import select, and_, inspect, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


def _admin_permissions(admin: Optional[AdminUser]) -> UserPermissions:
    """Build login permissions from the persisted permission assignments."""
    if not admin:
        return UserPermissions(is_super_admin=False)
    return get_admin_user_permissions(admin)


def _passkey_origin(request: Request) -> str:
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc))
    return f"{scheme}://{host}"


def _passkey_rp_id(request: Request) -> str:
    configured = str(getattr(settings, "passkey_rp_id", "") or "").strip()
    return configured or request.headers.get("x-forwarded-host", request.headers.get("host", request.url.hostname or "localhost")).split(":")[0]


async def _save_passkey_challenge(db: AsyncSession, challenge: bytes, purpose: str, user_id: Optional[str] = None) -> None:
    db.add(PasskeyChallenge(
        challenge=bytes_to_base64url(challenge),
        purpose=purpose,
        user_id=user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    ))
    await db.commit()


async def _consume_passkey_challenge(db: AsyncSession, challenge: bytes, purpose: str) -> PasskeyChallenge:
    result = await db.execute(select(PasskeyChallenge).where(
        PasskeyChallenge.challenge == bytes_to_base64url(challenge),
        PasskeyChallenge.purpose == purpose,
        PasskeyChallenge.expires_at > datetime.now(timezone.utc),
    ))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=400, detail="Passkey challenge is invalid or expired")
    await db.delete(record)
    await db.commit()
    return record


async def _record_failed_passkey_attempt(db: AsyncSession, admin: AdminUser, exc: Optional[Exception] = None) -> None:
    """Track repeated passkey failures and freeze the wallet after three strikes."""
    failed_attempts = int(getattr(admin, "passkey_failed_attempts", 0) or 0) + 1
    admin.passkey_failed_attempts = failed_attempts
    await db.commit()

    if failed_attempts >= 3:
        wallet_service = WalletsService(db)
        try:
            await wallet_service.freeze_wallet(
                str(admin.telegram_id),
                "Suspended after 3 failed passkey verification attempts. Contact customer service to restore access.",
            )
        except Exception:
            logger.exception("Failed to freeze wallet after repeated passkey failures for %s", admin.telegram_id)
        raise HTTPException(
            status_code=403,
            detail="Passkey verification failed 3 times. Your wallet has been frozen for security and customer service must restore access.",
        ) from exc

    raise HTTPException(
        status_code=403,
        detail=(
            f"Passkey verification failed. This was attempt {failed_attempts} of 3. "
            "After 3 failed attempts, the wallet is frozen and customer service must restore access."
        ),
    ) from exc


async def verify_transaction_passkey(
    credential: dict,
    purpose: str,
    request: Request,
    current_user: UserResponse,
    db: AsyncSession,
) -> None:
    """Verify and consume a passkey assertion for one money-moving operation."""
    if purpose not in {"withdrawal", "disbursement", "usdt_trade"}:
        raise HTTPException(status_code=400, detail="Invalid passkey verification purpose")
    credential_id = str(credential.get("id") or credential.get("rawId") or "").strip()
    client_data_value = credential.get("response", {}).get("clientDataJSON")
    if not credential_id or not client_data_value:
        raise HTTPException(status_code=400, detail="Passkey verification is required before this transaction can proceed.")

    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    if not admin or not admin.passkey_public_key or admin.passkey_credential_id != credential_id:
        raise HTTPException(status_code=403, detail="Register a passkey before continuing with this protected transaction.")

    failed_attempts = int(getattr(admin, "passkey_failed_attempts", 0) or 0)
    if failed_attempts >= 3:
        raise HTTPException(
            status_code=403,
            detail="Your wallet has been frozen after repeated failed passkey verification attempts. Please contact customer service to restore access.",
        )

    try:
        client_data = json.loads(base64url_to_bytes(client_data_value))
        challenge = base64url_to_bytes(client_data["challenge"])
        challenge_record = await _consume_passkey_challenge(db, challenge, purpose)
        if challenge_record.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Passkey verification does not belong to this account")
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=_passkey_rp_id(request),
            expected_origin=_passkey_origin(request),
            credential_public_key=base64url_to_bytes(admin.passkey_public_key),
            credential_current_sign_count=admin.passkey_sign_count,
        )
    except HTTPException as exc:
        await _record_failed_passkey_attempt(db, admin, exc)
    except Exception as exc:
        await _record_failed_passkey_attempt(db, admin, exc)

    admin.passkey_sign_count = verification.new_sign_count
    admin.passkey_failed_attempts = 0
    await db.commit()


async def verify_transaction_otp(
    reference: str,
    code: str,
    purpose: str,
    current_user: UserResponse,
    db: AsyncSession,
) -> None:
    if purpose != "withdrawal" or not reference or not code:
        raise HTTPException(status_code=400, detail="Withdrawal OTP verification is required.")
    challenge = await db.scalar(
        select(TransactionOtpChallenge).where(
            TransactionOtpChallenge.reference == reference,
            TransactionOtpChallenge.purpose == purpose,
            TransactionOtpChallenge.used_at.is_(None),
            TransactionOtpChallenge.expires_at > datetime.now(timezone.utc),
        )
    )
    if not challenge or challenge.attempts >= 5:
        raise HTTPException(status_code=403, detail="Withdrawal OTP is invalid or expired.")
    challenge.attempts += 1
    expected_hash = hashlib.sha256(code.strip().encode()).hexdigest()
    if not hmac.compare_digest(expected_hash, challenge.code_hash):
        await db.commit()
        raise HTTPException(status_code=403, detail="Withdrawal OTP is invalid or expired.")
    admin = await db.scalar(select(AdminUser).where(AdminUser.id == challenge.admin_user_id))
    if not admin or admin.telegram_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Withdrawal OTP does not belong to this account.")
    challenge.used_at = datetime.now(timezone.utc)
    await db.commit()


async def _issue_passkey_login(user: User, db: AsyncSession) -> LoginResponse:
    admin_result = await db.execute(select(AdminUser).where(AdminUser.telegram_id == user.id))
    admin = admin_result.scalar_one_or_none()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin account is inactive or unavailable")

    permissions = _admin_permissions(admin)
    auth_service = AuthService(db)
    token, _, _ = await auth_service.issue_app_token(
        user=user,
        permissions=permissions,
        organization_id=admin.organization_id if admin else None,
        organization_name=admin.organization_name if admin else None,
        must_change_password=bool(admin and admin.must_change_password),
    )
    return LoginResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            organization_id=admin.organization_id if admin else None,
            organization_name=admin.organization_name if admin else None,
            permissions=permissions,
            must_change_password=bool(admin and admin.must_change_password),
        ),
    )


@router.get("/passkey/registration-options")
async def passkey_registration_options(
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    options = generate_registration_options(
        rp_id=_passkey_rp_id(request),
        rp_name="SwiftPay",
        user_id=str(current_user.id).encode(),
        user_name=current_user.email,
        user_display_name=current_user.name or current_user.email,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED,
            resident_key=ResidentKeyRequirement.PREFERRED,
        ),
    )
    await _save_passkey_challenge(db, options.challenge, "registration", current_user.id)
    return json.loads(options_to_json(options))


@router.post("/passkey/register")
async def passkey_register(
    payload: dict,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    credential = payload.get("credential")
    if not isinstance(credential, dict):
        raise HTTPException(status_code=400, detail="Passkey credential is required")
    challenge_value = credential.get("response", {}).get("clientDataJSON")
    if not challenge_value:
        raise HTTPException(status_code=400, detail="Passkey client data is missing")
    try:
        client_data = json.loads(base64url_to_bytes(challenge_value))
        challenge = base64url_to_bytes(client_data["challenge"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Passkey client data is invalid") from exc
    challenge_record = await _consume_passkey_challenge(db, challenge, "registration")
    if challenge_record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Passkey challenge does not belong to this account")
    try:
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=_passkey_rp_id(request),
            expected_origin=_passkey_origin(request),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Passkey registration could not be verified") from exc
    result = await db.execute(select(AdminUser).where(AdminUser.telegram_id == current_user.id))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Account not found")
    admin.passkey_credential_id = bytes_to_base64url(verification.credential_id)
    admin.passkey_public_key = bytes_to_base64url(verification.credential_public_key)
    admin.passkey_sign_count = verification.sign_count
    await db.commit()
    return {"success": True}


@router.get("/passkey/authentication-options")
async def passkey_authentication_options(request: Request, db: AsyncSession = Depends(get_db)):
    options = generate_authentication_options(
        rp_id=_passkey_rp_id(request),
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    await _save_passkey_challenge(db, options.challenge, "authentication")
    return json.loads(options_to_json(options))


@router.get("/passkey/transaction-options")
async def passkey_transaction_options(
    request: Request,
    purpose: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if purpose not in {"withdrawal", "disbursement", "usdt_trade"}:
        raise HTTPException(status_code=400, detail="Invalid passkey verification purpose")
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    if not admin or not admin.passkey_credential_id:
        raise HTTPException(status_code=403, detail="Register a passkey before continuing with this protected transaction.")
    options = generate_authentication_options(
        rp_id=_passkey_rp_id(request),
        allow_credentials=[PublicKeyCredentialDescriptor(id=base64url_to_bytes(admin.passkey_credential_id))],
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    await _save_passkey_challenge(db, options.challenge, purpose, str(current_user.id))
    return json.loads(options_to_json(options))


@router.post("/passkey/login", response_model=LoginResponse)
async def passkey_login(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    credential = payload.get("credential")
    if not isinstance(credential, dict):
        raise HTTPException(status_code=400, detail="Passkey credential is required")
    credential_id = str(credential.get("id") or credential.get("rawId") or "").strip()
    if not credential_id:
        raise HTTPException(status_code=400, detail="Passkey credential ID is missing")
    result = await db.execute(select(AdminUser).where(AdminUser.passkey_credential_id == credential_id))
    admin = result.scalar_one_or_none()
    if not admin or not admin.is_active or not admin.passkey_public_key:
        raise HTTPException(status_code=401, detail="Passkey is not registered")
    try:
        client_data_value = credential.get("response", {}).get("clientDataJSON", "")
        client_data = json.loads(base64url_to_bytes(client_data_value))
        challenge = base64url_to_bytes(client_data["challenge"])
        await _consume_passkey_challenge(db, challenge, "authentication")
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=_passkey_rp_id(request),
            expected_origin=_passkey_origin(request),
            credential_public_key=base64url_to_bytes(admin.passkey_public_key),
            credential_current_sign_count=admin.passkey_sign_count,
        )
    except HTTPException as exc:
        await _record_failed_passkey_attempt(db, admin, exc)
    except Exception as exc:
        await _record_failed_passkey_attempt(db, admin, exc)
    admin.passkey_sign_count = verification.new_sign_count
    admin.passkey_failed_attempts = 0
    admin_user = User(id=admin.telegram_id, email=admin.email or "", name=admin.name or admin.email, role="admin")
    admin_user.last_login = datetime.now(timezone.utc)
    await db.commit()
    return await _issue_passkey_login(admin_user, db)


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

    # The Google OAuth client ID is a public identifier and is also compiled
    # into the browser client. Keep a deployment-safe fallback for instances
    # where Railway has not yet synchronized the non-secret variable.
    if env_name == "GOOGLE_CLIENT_ID":
        return "840780053380-sl5ukuvs63nt8u4d1kriblpbb9chohd4.apps.googleusercontent.com"
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


async def _verify_turnstile_token(
    token: str,
    secret_key: str,
    remote_ip: Optional[str] = None,
    expected_action: Optional[str] = None,
) -> bool:
    """Verify a Cloudflare Turnstile token."""
    if not token or len(token) > 2048:
        return False
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
        if expected_action and result.get("action") != expected_action:
            logger.warning(
                "[_verify_turnstile_token] Unexpected action: expected=%s actual=%s",
                expected_action,
                result.get("action"),
            )
            return False
        allowed_hosts = {
            hostname.strip().lower()
            for hostname in str(
                getattr(settings, "cloudflare_turnstile_allowed_hostnames", "")
            ).split(",")
            if hostname.strip()
        }
        hostname = str(result.get("hostname") or "").strip().lower()
        if expected_action and (not allowed_hosts or hostname not in allowed_hosts):
            logger.warning(
                "[_verify_turnstile_token] Unexpected hostname: hostname=%s",
                hostname,
            )
            return False
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
        token_valid = await _verify_turnstile_token(
            payload.cf_turnstile_token,
            turnstile_secret,
            remote_ip,
            expected_action="login",
        )
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

    if db_admin and not db_admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is inactive")

    in_env = telegram_user_id in allowed_admin_ids or payload_username in allowed_admin_usernames
    in_db = db_admin is not None and db_admin.is_active

    if not in_db and not in_env:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access the admin dashboard.",
        )

    if db_admin:
        try:
            from services.wallets import WalletsService
            await WalletsService(db).ensure_admin_wallets(str(db_admin.telegram_id), ["PHP", "CNY", "KRW", "USDT"])
            await db.commit()
        except Exception:
            await db.rollback()
    
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
            can_credit_wallet=True,
            can_debit_wallet=True,
            can_freeze_wallet=True,
            can_unfreeze_wallet=True,
        )
        platform_org_id, platform_org_name = _get_platform_organization()
        if db_admin:
            try:
                db_admin.is_super_admin = True
                db_admin.can_manage_bot = True
                db_admin.can_approve_topups = True
                db_admin.can_manage_team = True
                db_admin.can_credit_wallet = True
                db_admin.can_debit_wallet = True
                db_admin.can_freeze_wallet = True
                db_admin.can_unfreeze_wallet = True
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
                    can_credit_wallet=True,
                    can_debit_wallet=True,
                    can_freeze_wallet=True,
                    can_unfreeze_wallet=True,
                    organization_id=platform_org_id,
                    organization_name=platform_org_name,
                    added_by="env_config",
                )
                db.add(new_admin)
                await db.commit()
            except Exception:
                await db.rollback()
    else:
        perms = _admin_permissions(db_admin)
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
    settlement_data = {}
    must_change_password = bool(db_admin.must_change_password) if db_admin else False

    if in_env:
        token_org_id, token_org_name = _get_platform_organization()
    elif db_admin:
        token_org_id = db_admin.organization_id
        token_org_name = db_admin.organization_name
        settlement_data = {
            "bank_name": db_admin.bank_name,
            "bank_account_number": db_admin.bank_account_number,
            "bank_account_name": db_admin.bank_account_name,
            "bank_address": db_admin.bank_address,
            "usdt_wallet_address": db_admin.usdt_wallet_address,
            "settlement_type": db_admin.settlement_type,
            "settlement_currency": db_admin.settlement_currency,
            "payment_channels": db_admin.payment_channels if isinstance(db_admin.payment_channels, dict) else None,
        }

    if token_org_id:
        api_stmt = (
            select(MerchantApiConfig)
            .where(
                MerchantApiConfig.organization_id == token_org_id,
                or_(MerchantApiConfig.user_id.is_(None), MerchantApiConfig.user_id == str(telegram_user_id)),
            )
            .order_by((MerchantApiConfig.user_id.is_(None)).desc(), MerchantApiConfig.id.asc())
            .limit(1)
        )
        api_cfg = (await db.execute(api_stmt)).scalars().first()
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
            permanent_link_slug=perm_link,
            settlement_data=settlement_data,
            must_change_password=must_change_password,
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
        permanent_link_slug=perm_link,
        must_change_password=must_change_password,
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


def _is_linked_telegram_account(telegram_id: Optional[str]) -> bool:
    """Return whether the stored Telegram ID represents a real linked account."""
    if telegram_id is None:
        return False
    cleaned = str(telegram_id).strip()
    return bool(cleaned) and not cleaned.startswith("web-")


@router.get("/telegram-link-status")
async def telegram_link_status(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return Telegram linking status for the currently authenticated web account."""
    result = await db.execute(
        select(AdminUser).where(
            (AdminUser.telegram_id == str(current_user.id))
            | (AdminUser.email == current_user.email)
        )
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Account not found")

    linked = _is_linked_telegram_account(admin.telegram_id)
    return {
        "linked": linked,
        "telegram_id": admin.telegram_id if linked else None,
        "telegram_username": admin.telegram_username if linked else None,
    }


@router.post("/telegram-link")
async def link_telegram_account(
    payload: TelegramWidgetLoginRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Link a verified Telegram identity to the authenticated web account."""
    bot_token = _get_runtime_config_value("telegram_bot_token", "TELEGRAM_BOT_TOKEN")
    valid, reason = _verify_telegram_widget_payload(payload, bot_token)
    if not valid:
        raise HTTPException(status_code=401, detail=f"Invalid Telegram login payload: {reason}")

    account_result = await db.execute(
        select(AdminUser).where(
            (AdminUser.telegram_id == str(current_user.id))
            | (AdminUser.email == current_user.email)
        )
    )
    account = account_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    telegram_id = str(payload.id)
    existing_result = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == telegram_id)
    )
    existing = existing_result.scalar_one_or_none()
    if existing and existing.id != account.id:
        raise HTTPException(status_code=409, detail="This Telegram account is already linked")

    account.telegram_id = telegram_id
    account.telegram_username = payload.username or account.telegram_username
    await db.commit()
    logger.info("Linked Telegram account %s to web account %s", telegram_id, account.id)
    return {
        "success": True,
        "linked": True,
        "telegram_id": telegram_id,
        "telegram_username": account.telegram_username,
    }


@router.post("/telegram-unlink")
async def unlink_telegram_account(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove Telegram sign-in from a web account without deleting the account."""
    result = await db.execute(
        select(AdminUser).where(
            (AdminUser.telegram_id == str(current_user.id))
            | (AdminUser.email == current_user.email)
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if not _is_linked_telegram_account(account.telegram_id):
        return {"success": True, "linked": False}

    account.telegram_id = f"web-{uuid.uuid4().hex}"
    account.telegram_username = None
    await db.commit()
    return {"success": True, "linked": False}


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


@router.post("/google-login", response_model=TokenExchangeResponse)
async def google_login(
    payload: GoogleLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Validate a Google Identity Services ID token and issue a SwiftPay token."""
    client_id = _get_runtime_config_value("google_client_id", "GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured.",
        )

    turnstile_secret = _get_runtime_config_value(
        "cloudflare_turnstile_secret_key", "CLOUDFLARE_TURNSTILE_SECRET_KEY"
    )
    if turnstile_secret:
        if not payload.cf_turnstile_token:
            raise HTTPException(status_code=400, detail="Turnstile verification token is required.")
        remote_ip = request.headers.get("CF-Connecting-IP") or (
            request.client.host if request.client else None
        )
        if not await _verify_turnstile_token(
            payload.cf_turnstile_token,
            turnstile_secret,
            remote_ip,
            expected_action="login",
        ):
            raise HTTPException(status_code=403, detail="Turnstile verification failed. Please try again.")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": payload.credential},
            )
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google login token.")
        claims = token_response.json()
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        logger.error("[google-login] Token verification request failed: %s", exc)
        raise HTTPException(status_code=503, detail="Google login is temporarily unavailable.") from exc

    if claims.get("aud") != client_id or claims.get("email_verified") != "true":
        raise HTTPException(status_code=401, detail="Google account could not be verified.")

    email = str(claims.get("email") or "").strip().lower()
    google_sub = str(claims.get("sub") or "").strip()
    if not email or not google_sub:
        raise HTTPException(status_code=401, detail="Google account did not provide a valid identity.")

    admin_record = await db.scalar(
        select(AdminUser).where(AdminUser.google_id == google_sub)
    )
    if not admin_record:
        admin_record = await db.scalar(
            select(AdminUser).where(func.lower(AdminUser.email) == email)
        )
    if not admin_record:
        configured_admin_email = str(getattr(settings, "admin_user_email", "") or "").strip().lower()
        configured_admin_id = str(getattr(settings, "admin_user_id", "") or "").strip()
        if configured_admin_email == email and configured_admin_id:
            admin_record = await db.scalar(
                select(AdminUser).where(AdminUser.telegram_id == configured_admin_id)
            )

    if admin_record and not admin_record.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is inactive")

    if admin_record and not admin_record.email:
        admin_record.email = email
        await db.commit()

    user_id = admin_record.telegram_id if admin_record else f"google:{google_sub}"
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        user = User(
            id=user_id,
            email=email,
            name=str(claims.get("name") or derive_name_from_email(email)),
            role="admin" if admin_record else "user",
        )
        db.add(user)
    else:
        user.email = email
        user.name = str(claims.get("name") or user.name or derive_name_from_email(email))
        user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    permissions = _admin_permissions(admin_record)
    auth_service = AuthService(db)
    app_token, _, _ = await auth_service.issue_app_token(
        user=user,
        permissions=permissions,
        organization_id=admin_record.organization_id if admin_record else None,
        organization_name=admin_record.organization_name if admin_record else None,
        must_change_password=bool(admin_record and admin_record.must_change_password),
    )
    return TokenExchangeResponse(
        token=app_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            permissions=permissions,
            organization_id=admin_record.organization_id if admin_record else None,
            organization_name=admin_record.organization_name if admin_record else None,
            must_change_password=bool(admin_record and admin_record.must_change_password),
        ),
    )


async def _get_google_claims(credential: str) -> dict[str, str]:
    client_id = _get_runtime_config_value("google_client_id", "GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="Google login is not configured.")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
            )
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google login token.")
        claims = token_response.json()
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Google login is temporarily unavailable.") from exc
    if claims.get("aud") != client_id or claims.get("email_verified") != "true":
        raise HTTPException(status_code=401, detail="Google account could not be verified.")
    google_id = str(claims.get("sub") or "").strip()
    email = str(claims.get("email") or "").strip().lower()
    if not google_id or not email:
        raise HTTPException(status_code=401, detail="Google account did not provide a valid identity.")
    return {"google_id": google_id, "email": email, "name": str(claims.get("name") or "")}


@router.get("/google-link-status")
async def google_link_status(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account_result = await db.execute(
        select(AdminUser).where(
            (AdminUser.telegram_id == str(current_user.id))
            | (func.lower(AdminUser.email) == current_user.email.lower())
        )
    )
    account = account_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"linked": bool(account.google_id), "google_email": account.email if account.google_id else None}


@router.get("/google-config")
async def google_config():
    """Return the public Google client ID needed by Google Identity Services."""
    client_id = _get_runtime_config_value("google_client_id", "GOOGLE_CLIENT_ID")
    return {"configured": bool(client_id), "client_id": client_id or None}


@router.post("/google-link")
async def link_google_account(
    payload: GoogleLoginRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    claims = await _get_google_claims(payload.credential)
    if claims["email"] != current_user.email.lower():
        raise HTTPException(status_code=409, detail="Use the Google account that matches your SwiftPay email.")
    account_result = await db.execute(
        select(AdminUser).where(
            (AdminUser.telegram_id == str(current_user.id))
            | (func.lower(AdminUser.email) == current_user.email.lower())
        )
    )
    account = account_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    existing_result = await db.execute(select(AdminUser).where(AdminUser.google_id == claims["google_id"]))
    existing = existing_result.scalar_one_or_none()
    if existing and existing.id != account.id:
        raise HTTPException(status_code=409, detail="This Google account is already linked.")
    account.google_id = claims["google_id"]
    await db.commit()
    return {"success": True, "linked": True, "google_email": account.email}


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
        token_valid = await _verify_turnstile_token(
            payload.cf_turnstile_token,
            turnstile_secret,
            remote_ip,
            expected_action="login",
        )
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
    if admin_record and not admin_record.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is inactive")

    org_id = None
    org_name = None
    store_name = None
    store_logo = None
    perm_link = None
    settlement_data = {}

    if admin_record:
        if normalize_organization_owner_scope(admin_record):
            await db.commit()

        org_id = admin_record.organization_id
        org_name = admin_record.organization_name
        settlement_data = {
            "bank_name": admin_record.bank_name,
            "bank_account_number": admin_record.bank_account_number,
            "bank_account_name": admin_record.bank_account_name,
            "bank_address": admin_record.bank_address,
            "usdt_wallet_address": admin_record.usdt_wallet_address,
            "settlement_type": admin_record.settlement_type,
            "settlement_currency": admin_record.settlement_currency,
            "payment_channels": admin_record.payment_channels if isinstance(admin_record.payment_channels, dict) else None,
        }

        # Fetch branding if organization exists
        if org_id:
            api_stmt = (
                select(MerchantApiConfig)
                .where(MerchantApiConfig.organization_id == org_id)
                .order_by(MerchantApiConfig.user_id.is_(None).desc(), MerchantApiConfig.id.asc())
            )
            api_cfg = (await db.execute(api_stmt)).scalars().first()
            if api_cfg:
                store_name = api_cfg.store_name
                store_logo = api_cfg.store_logo_url
                perm_link = api_cfg.permanent_link_slug

        role_map = {
            "owner": PredefinedRoleEnum.OWNER,
            "admin": PredefinedRoleEnum.ADMIN,
            "manager": PredefinedRoleEnum.MANAGER,
            "editor": PredefinedRoleEnum.OPERATOR,
            "operator": PredefinedRoleEnum.OPERATOR,
            "viewer": PredefinedRoleEnum.VIEWER,
            "developer": PredefinedRoleEnum.DEVELOPER,
        }
        canonical_permission_keys = {
            "is_super_admin",
            "can_manage_payments",
            "can_manage_disbursements",
            "can_view_reports",
            "can_manage_wallet",
            "can_manage_transactions",
            "can_manage_bot",
            "can_approve_topups",
            "can_manage_team",
            "can_credit_wallet",
            "can_debit_wallet",
            "can_freeze_wallet",
            "can_unfreeze_wallet",
        }
        has_canonical_permissions = (
            isinstance(admin_record.team_permissions, dict)
            and canonical_permission_keys.issubset(admin_record.team_permissions)
        )
        if admin_record.role in role_map and not has_canonical_permissions:
            repaired = get_role_permissions(role_map[admin_record.role]).model_dump()
            repaired = scope_permissions_to_organization(
                repaired,
                admin_record.organization_id,
                _get_platform_organization()[0],
            )
            for key, value in repaired.items():
                if hasattr(admin_record, key):
                    setattr(admin_record, key, value)
            admin_record.team_permissions = repaired
            await db.commit()
        elif admin_record.role == "super_admin" and not has_canonical_permissions:
            repaired = {
                "can_approve_topups": True,
                "can_manage_transactions": True,
                "can_view_reports": True,
            }
            if admin_record.role == "super_admin":
                # Incomplete JSON permissions are most commonly from invited
                # accounts; repair them with the restricted invitation policy
                # instead of restoring wallet and platform controls.
                repaired = (
                    get_invited_super_admin_permissions().model_dump()
                    if isinstance(admin_record.team_permissions, dict)
                    else get_role_permissions(PredefinedRoleEnum.OWNER).model_dump()
                )
            for key, value in repaired.items():
                setattr(admin_record, key, value)
            admin_record.team_permissions = repaired
            await db.commit()

        perms = _admin_permissions(admin_record)
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
            can_credit_wallet=True,
            can_debit_wallet=True,
            can_freeze_wallet=True,
            can_unfreeze_wallet=True,
        )
    else:
        perms = UserPermissions(is_super_admin=False)
    
    must_change_password = bool(admin_record.must_change_password) if admin_record else False
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
        "must_change_password": must_change_password,
        **settlement_data,
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
        permanent_link_slug=perm_link,
        must_change_password=must_change_password,
        **settlement_data,
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
    if admin_record and not admin_record.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is inactive")

    org_id = None
    org_name = None
    store_name = None
    store_logo = None
    perm_link = None
    settlement_data = {}

    if admin_record:
        org_id = admin_record.organization_id
        org_name = admin_record.organization_name
        settlement_data = {
            "bank_name": admin_record.bank_name,
            "bank_account_number": admin_record.bank_account_number,
            "bank_account_name": admin_record.bank_account_name,
            "bank_address": admin_record.bank_address,
            "usdt_wallet_address": admin_record.usdt_wallet_address,
            "settlement_type": admin_record.settlement_type,
            "settlement_currency": admin_record.settlement_currency,
            "payment_channels": admin_record.payment_channels if isinstance(admin_record.payment_channels, dict) else None,
        }

        # Fetch branding if organization exists
        if org_id:
            api_stmt = (
                select(MerchantApiConfig)
                .where(MerchantApiConfig.organization_id == org_id)
                .order_by(MerchantApiConfig.user_id.is_(None).desc(), MerchantApiConfig.id.asc())
            )
            api_cfg = (await db.execute(api_stmt)).scalars().first()
            if api_cfg:
                store_name = api_cfg.store_name
                store_logo = api_cfg.store_logo_url
                perm_link = api_cfg.permanent_link_slug

        perms = _admin_permissions(admin_record)
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
            can_credit_wallet=True,
            can_debit_wallet=True,
            can_freeze_wallet=True,
            can_unfreeze_wallet=True,
        )
    else:
        perms = UserPermissions(is_super_admin=False)

    must_change_password = bool(admin_record.must_change_password) if admin_record else False
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
        "must_change_password": must_change_password,
        **settlement_data,
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
        permanent_link_slug=perm_link,
        must_change_password=must_change_password,
        **settlement_data,
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

    api_stmt = (
        select(MerchantApiConfig)
        .where(MerchantApiConfig.organization_id == platform_org_id)
        .order_by(MerchantApiConfig.user_id.is_(None).desc(), MerchantApiConfig.id.asc())
    )
    api_cfg = (await db.execute(api_stmt)).scalars().first()
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


class ChangePasswordRequest(BaseModel):
    new_password: str
    confirm_password: str


@router.post("/change-password", response_model=LoginResponse)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Require a password reset before the user can continue to the dashboard."""
    new_password = (payload.new_password or "").strip()
    confirm_password = (payload.confirm_password or "").strip()

    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long.")
    if new_password != confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match.")

    res = await db.execute(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    admin_record = res.scalar_one_or_none()
    if not admin_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    admin_record.password_hash = hash_password(new_password)
    admin_record.must_change_password = False
    await db.commit()
    await db.refresh(admin_record)

    token_claims = {
        "sub": admin_record.telegram_id,
        "email": admin_record.email or current_user.email,
        "role": current_user.role,
        "name": admin_record.name or current_user.name,
        "permissions": (current_user.permissions.model_dump() if current_user.permissions else {}),
        "organization_id": admin_record.organization_id or current_user.organization_id,
        "organization_name": admin_record.organization_name or current_user.organization_name,
        "store_name": current_user.store_name,
        "store_logo_url": current_user.store_logo_url,
        "permanent_link_slug": current_user.permanent_link_slug,
        "must_change_password": False,
        "bank_name": admin_record.bank_name,
        "bank_account_number": admin_record.bank_account_number,
        "bank_account_name": admin_record.bank_account_name,
        "bank_address": admin_record.bank_address,
        "usdt_wallet_address": admin_record.usdt_wallet_address,
        "settlement_type": admin_record.settlement_type,
        "settlement_currency": admin_record.settlement_currency,
    }
    access_token = create_access_token(token_claims, expires_minutes=int(getattr(settings, "jwt_expire_minutes", 60)))

    user_response = UserResponse(
        id=str(admin_record.telegram_id),
        email=admin_record.email or current_user.email,
        name=admin_record.name or current_user.name,
        role=current_user.role,
        organization_id=admin_record.organization_id or current_user.organization_id,
        organization_name=admin_record.organization_name or current_user.organization_name,
        permissions=current_user.permissions,
        store_name=current_user.store_name,
        store_logo_url=current_user.store_logo_url,
        permanent_link_slug=current_user.permanent_link_slug,
        must_change_password=False,
        bank_name=admin_record.bank_name,
        bank_account_number=admin_record.bank_account_number,
        bank_account_name=admin_record.bank_account_name,
        bank_address=admin_record.bank_address,
        usdt_wallet_address=admin_record.usdt_wallet_address,
        settlement_type=admin_record.settlement_type,
        settlement_currency=admin_record.settlement_currency,
    )
    return LoginResponse(access_token=access_token, user=user_response)


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)
    confirm_password: str


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a one-time password reset link without revealing account existence."""
    email = payload.email.strip().lower()
    admin = await db.scalar(select(AdminUser).where(func.lower(AdminUser.email) == email))
    if admin and admin.is_active:
        raw_token = secrets.token_urlsafe(48)
        token = PasswordResetToken(
            admin_user_id=admin.id,
            token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(token)
        await db.commit()
        frontend_url = (os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").rstrip("/")
        reset_url = f"{frontend_url}/reset-password?token={raw_token}" if frontend_url else f"/reset-password?token={raw_token}"
        try:
            from services.email_service import EmailService
            EmailService.send_password_reset_email(email, reset_url)
        except Exception as exc:
            logger.exception("Password reset email delivery failed for %s", email)
            raise HTTPException(status_code=503, detail="Unable to send password reset email.") from exc
    return {"message": "If an active account exists for that email, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    reset = await db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    if not reset:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or expired.")
    admin = await db.get(AdminUser, reset.admin_user_id)
    if not admin or not admin.is_active:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or expired.")
    admin.password_hash = hash_password(payload.new_password)
    admin.must_change_password = False
    reset.used_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Password reset successfully. You can now sign in."}


class TransactionOtpRequest(BaseModel):
    purpose: str = Field(pattern="^(withdrawal)$")


class TransactionOtpVerifyRequest(BaseModel):
    purpose: str = Field(pattern="^(withdrawal)$")
    reference: str = Field(min_length=1)
    code: str = Field(min_length=6, max_length=6)


@router.post("/transaction-otp")
async def create_transaction_otp(
    payload: TransactionOtpRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    if not admin or not admin.is_active or not admin.email:
        raise HTTPException(status_code=400, detail="A verified account email is required for OTP withdrawal authorization.")
    raw_code = f"{secrets.randbelow(1_000_000):06d}"
    reference = secrets.token_urlsafe(24)
    db.add(TransactionOtpChallenge(
        admin_user_id=admin.id,
        purpose=payload.purpose,
        code_hash=hashlib.sha256(raw_code.encode()).hexdigest(),
        reference=reference,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    ))
    await db.commit()
    try:
        from services.email_service import EmailService
        EmailService.send_transaction_otp_email(admin.email, raw_code)
    except Exception as exc:
        logger.exception("Transaction OTP email delivery failed for %s", admin.email)
        raise HTTPException(status_code=503, detail="Unable to send withdrawal OTP email.") from exc
    return {"success": True, "reference": reference, "expires_in": 300}


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
    full_name: str = Field(min_length=2, max_length=100)
    email: str
    phone: str = Field(min_length=7, max_length=32)
    address: Optional[str] = Field(default=None, max_length=512)
    business_name: Optional[str] = Field(default=None, max_length=150)
    telegram_username: Optional[str] = None
    telegram_user_id: Optional[str] = None
    google_credential: Optional[str] = None
    telegram_auth: Optional[TelegramWidgetLoginRequest] = None
    referral_token: Optional[str] = None
    cf_turnstile_token: Optional[str] = None
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
async def register(
    body: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Public registration endpoint."""
    turnstile_secret = _get_runtime_config_value(
        "cloudflare_turnstile_secret_key", "CLOUDFLARE_TURNSTILE_SECRET_KEY"
    )
    if turnstile_secret:
        if not body.cf_turnstile_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Turnstile verification token is required.",
            )
        remote_ip = request.headers.get("CF-Connecting-IP") or (
            request.client.host if request.client else None
        )
        if not await _verify_turnstile_token(
            body.cf_turnstile_token,
            turnstile_secret,
            remote_ip,
            expected_action="signup",
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Turnstile verification failed. Please refresh and try again.",
            )
    chat_id = f"web-{hashlib.sha256(body.email.lower().encode()).hexdigest()[:16]}"
    google_id = None
    if body.google_credential:
        google_claims = await _get_google_claims(body.google_credential)
        if google_claims["email"] != body.email:
            raise HTTPException(status_code=409, detail="Google account email must match the registration email.")
        google_id = google_claims["google_id"]
        existing_google = await db.scalar(select(AdminUser).where(AdminUser.google_id == google_id))
        if existing_google:
            raise HTTPException(
                status_code=409,
                detail="This account is already registered. Please sign in at /login.",
            )
    if body.telegram_auth:
        bot_token = _get_runtime_config_value("telegram_bot_token", "TELEGRAM_BOT_TOKEN")
        if not bot_token:
            raise HTTPException(status_code=503, detail="Telegram linking is not configured.")
        valid, reason = _verify_telegram_widget_payload(body.telegram_auth, bot_token)
        if not valid:
            raise HTTPException(status_code=401, detail=f"Invalid Telegram account link ({reason}).")
        if str(body.telegram_auth.id) != str(body.telegram_user_id or ""):
            raise HTTPException(status_code=400, detail="Telegram account link data is inconsistent.")

    existing = await db.execute(
        select(KybRegistration).where(KybRegistration.chat_id == chat_id)
    )
    existing_kyb = existing.scalar_one_or_none()
    if existing_kyb:
        if existing_kyb.status == "approved":
            raise HTTPException(
                status_code=409,
                detail="This account is already registered and approved. Please sign in at /login.",
            )
        if google_id and existing_kyb.google_id and existing_kyb.google_id != google_id:
            raise HTTPException(status_code=409, detail="This email is already linked to another Google account.")
        if body.telegram_user_id and existing_kyb.telegram_user_id and existing_kyb.telegram_user_id != body.telegram_user_id:
            raise HTTPException(status_code=409, detail="This email is already linked to another Telegram account.")
        existing_kyb.google_id = google_id or existing_kyb.google_id
        existing_kyb.telegram_user_id = body.telegram_user_id or existing_kyb.telegram_user_id
        existing_kyb.telegram_username = body.telegram_username or existing_kyb.telegram_username
        await db.commit()
        return RegisterResponse(
            message="Your registration is already submitted and under review.",
            kyb_id=existing_kyb.id,
            reference_code=existing_kyb.reference_code,
            xendit_customer_id=None,
        )

    existing_account = await db.scalar(
        select(AdminUser).where(func.lower(AdminUser.email) == body.email.lower())
    )
    if existing_account:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered. Please sign in at /login.",
        )

    reference_code = await _get_unique_reference_code(db)
    referral = None
    if body.referral_token:
        referral_result = await db.execute(
            select(ReferralLink).where(
                ReferralLink.token == body.referral_token.strip(),
                ReferralLink.is_active.is_(True),
            )
        )
        referral = referral_result.scalar_one_or_none()
        if referral is None:
            raise HTTPException(status_code=400, detail="This referral registration link is invalid.")

    kyb = KybRegistration(
        chat_id=chat_id,
        telegram_username=body.telegram_username,
        telegram_user_id=body.telegram_user_id,
        google_id=google_id,
        referral_upline_id=str(referral.created_by) if referral else None,
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
