"""
KYB (Know Your Business) Registration Management Router
Super admins can list, approve, and reject KYB registration applications.
"""
import logging
import hashlib
import os
import secrets
import string
from datetime import datetime
from typing import List, Optional

from services.email_service import EmailService

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import hash_password
from core.config import settings
from core.database import get_db
from core.mask_crypto import encrypt_text
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.api_configs import Api_configs
from models.kyb_registrations import KybRegistration
from models.team_invitations import TeamInvitation
from models.downline import Downline
from routers.admin_users import _ensure_unique_email, _ensure_unique_usdt_wallet_address, _normalize_usdt_wallet_address
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/kyb", tags=["kyb"])


# ---------- Schemas ----------

class KybRegistrationOut(BaseModel):
    id: int
    chat_id: str
    telegram_username: Optional[str] = None
    step: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None
    id_photo_file_id: Optional[str] = None
    reference_code: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class KybListResponse(BaseModel):
    items: List[KybRegistrationOut]
    total: int


class ApproveKybRequest(BaseModel):
    note: str = ""
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None


class RejectKybRequest(BaseModel):
    reason: str = "No reason provided."


class IssuedCredentials(BaseModel):
    """One-time-only secrets shown to the admin right after approval.

    These are never persisted in plaintext — only their hashes / encrypted
    values are stored — so this payload is the only chance to see them.
    """
    email: str
    password: str
    test_access_key: str
    live_access_key: str
    integration_guide_url: str = ""


class ApproveKybResponse(KybRegistrationOut):
    credentials: Optional[IssuedCredentials] = None


# ---------- Helpers ----------

def _generate_password(length: int = 14) -> str:
    """Generate a random, readable dashboard login password."""
    alphabet = string.ascii_letters + string.digits
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        # Ensure at least one of each character class for basic strength.
        if any(c.islower() for c in pwd) and any(c.isupper() for c in pwd) and any(c.isdigit() for c in pwd):
            return pwd


def _generate_access_key(mode: str) -> str:
    """Generate a SwiftPay Access Key in the documented sk_<mode>_... format."""
    return f"sk_{mode}_{secrets.token_hex(16)}"


def _get_integration_guide_url() -> str:
    """Return a merchant-facing integration guide URL for the dashboard."""
    frontend_url = (os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").rstrip("/")
    if frontend_url:
        return f"{frontend_url}/api-docs"
    return "/api-docs"


def _send_merchant_credentials_email(
    email: str,
    password: str,
    test_access_key: str,
    live_access_key: str,
    merchant_name: Optional[str] = None,
) -> None:
    """Email merchant dashboard login credentials and integration keys once approval is complete."""
    if not email:
        logger.warning("Skipping merchant email: no email address on record")
        return

    try:
        frontend_url = (os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").rstrip("/")
        EmailService.send_merchant_credentials_email(
            email,
            password,
            test_access_key,
            live_access_key,
            merchant_name,
            f"{frontend_url}/login" if frontend_url else "/login",
            _get_integration_guide_url(),
        )
        logger.info("Merchant onboarding email sent to %s", email)
    except Exception as exc:  # pragma: no cover - defensive, logs for operators but preserves approval flow
        logger.exception("Failed to send merchant onboarding email to %s: %s", email, exc)


async def _issue_merchant_access_keys(db: AsyncSession, admin_user: AdminUser) -> tuple:
    """Create and store encrypted TEST/LIVE API config rows for a merchant.

    Reuses the existing self-service `api_configs` storage/validation path
    (X-API-Key header, see dependencies/auth.py::_resolve_user_by_api_key) so
    admin-issued keys work exactly like developer-generated ones.
    """
    full_scopes = (
        "payments:read,payments:write,disbursements:read,disbursements:write,"
        "wallet:read,wallet:write,customers:read,customers:write,webhooks:read,webhooks:manage"
    )
    issued_at = datetime.utcnow().isoformat()
    keys: dict = {}
    # Scope keys to the merchant's telegram_id — this is the same identifier used as
    # `current_user.id` (JWT `sub`) after login, which is what api_configs lookups filter by.
    owner_id = admin_user.telegram_id
    for mode in ("test", "live"):
        plaintext_key = _generate_access_key(mode)
        config_key = f"payment_api_key_{mode}_{admin_user.id}"
        config_values = {
            config_key: encrypt_text(plaintext_key),
            f"{config_key}_scopes": full_scopes,
            f"{config_key}_issued_at": issued_at,
        }
        existing_configs = (
            await db.execute(
                select(Api_configs).where(
                    Api_configs.user_id == owner_id,
                    Api_configs.service_name == "swiftpay",
                    Api_configs.config_key.in_(config_values),
                )
            )
        ).scalars().all()
        existing_by_key = {config.config_key: config for config in existing_configs}
        for key, value in config_values.items():
            config = existing_by_key.get(key)
            if config:
                config.config_value = value
                config.is_active = True
            else:
                db.add(Api_configs(
                    user_id=owner_id,
                    service_name="swiftpay",
                    config_key=key,
                    config_value=value,
                    is_active=True,
                ))
        keys[mode] = plaintext_key
    return keys["test"], keys["live"]


def _require_super_admin(current_user: UserResponse):
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required to manage KYB registrations.",
        )


# ---------- Endpoints ----------

@router.get("", response_model=KybListResponse)
async def list_kyb_registrations(
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all KYB registrations. Super admin only."""
    _require_super_admin(current_user)
    stmt = select(KybRegistration).order_by(KybRegistration.created_at.desc())
    if status:
        stmt = stmt.where(KybRegistration.status == status)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return KybListResponse(items=list(items), total=len(items))


@router.get("/{kyb_id}", response_model=KybRegistrationOut)
async def get_kyb_registration(
    kyb_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific KYB registration. Super admin only."""
    _require_super_admin(current_user)
    result = await db.execute(select(KybRegistration).where(KybRegistration.id == kyb_id))
    kyb = result.scalar_one_or_none()
    if not kyb:
        raise HTTPException(status_code=404, detail="KYB registration not found")
    return kyb


@router.post("/{kyb_id}/approve", response_model=ApproveKybResponse)
async def approve_kyb_registration(
    kyb_id: int,
    body: ApproveKybRequest = ApproveKybRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a KYB registration and create an AdminUser for the applicant. Super admin only."""
    _require_super_admin(current_user)

    result = await db.execute(select(KybRegistration).where(KybRegistration.id == kyb_id))
    kyb = result.scalar_one_or_none()
    if not kyb:
        raise HTTPException(status_code=404, detail="KYB registration not found")
    if kyb.status == "approved":
        raise HTTPException(status_code=400, detail="KYB registration is already approved")
    if kyb.status not in ("pending_review", "in_progress", "rejected"):
        raise HTTPException(status_code=400, detail=f"Cannot approve a registration with status: {kyb.status}")

    settlement_values = {
        "bank_name": (body.bank_name or kyb.bank_name or "").strip(),
        "bank_account_number": (body.bank_account_number or kyb.bank_account_number or "").strip(),
        "bank_account_name": (body.bank_account_name or kyb.bank_account_name or "").strip(),
        "bank_address": (body.bank_address or kyb.bank_address or "").strip(),
        "usdt_wallet_address": (body.usdt_wallet_address or kyb.usdt_wallet_address or "").strip(),
        "settlement_type": (body.settlement_type or kyb.settlement_type or "").strip(),
        "settlement_currency": (body.settlement_currency or kyb.settlement_currency or "").strip(),
    }
    required_fields = [
        ("bank_name", settlement_values["bank_name"]),
        ("bank_account_number", settlement_values["bank_account_number"]),
        ("bank_account_name", settlement_values["bank_account_name"]),
        ("usdt_wallet_address", settlement_values["usdt_wallet_address"]),
        ("settlement_currency", settlement_values["settlement_currency"]),
    ]
    missing = [name for name, value in required_fields if not value]
    if missing:
        raise HTTPException(
            status_code=400,
            detail="Settlement details are required before approval: " + ", ".join(missing),
        )

    if settlement_values["usdt_wallet_address"]:
        normalized_address = _normalize_usdt_wallet_address(settlement_values["usdt_wallet_address"])
        settlement_values["usdt_wallet_address"] = normalized_address

    kyb.bank_name = settlement_values["bank_name"]
    kyb.bank_account_number = settlement_values["bank_account_number"]
    kyb.bank_account_name = settlement_values["bank_account_name"]
    kyb.bank_address = settlement_values["bank_address"]
    kyb.usdt_wallet_address = settlement_values["usdt_wallet_address"]
    kyb.settlement_type = settlement_values["settlement_type"] or "Bank Transfer"
    kyb.settlement_currency = settlement_values["settlement_currency"]
    kyb.status = "approved"
    kyb.rejection_reason = None

    # Resolve organization assignment from invitation when available.
    # If there is no invitation, create/assign a dedicated organization for this direct registration.
    org_id: Optional[str] = None
    org_name: Optional[str] = None
    invitation = None
    email = (kyb.email or "").strip().lower()
    if email:
        inv_res = await db.execute(
            select(TeamInvitation)
            .where(
                func.lower(TeamInvitation.email) == email,
                TeamInvitation.status.in_(["pending", "accepted"]),
            )
            .order_by(TeamInvitation.created_at.desc())
        )
        invitation = inv_res.scalar_one_or_none()

    if invitation and invitation.organization_id:
        org_id = invitation.organization_id
        org_name = invitation.organization_name or kyb.bank_name or kyb.full_name
    else:
        # Direct website registration: user becomes owner under their own organization.
        stable_key = (kyb.chat_id or email or str(kyb.id)).strip().lower().encode()
        org_id = f"org-{hashlib.sha256(stable_key).hexdigest()[:16]}"
        org_name = (kyb.bank_name or kyb.full_name or "My Organization").strip()

    invitation_permissions = invitation.permissions if invitation and isinstance(invitation.permissions, dict) else {}
    is_invited_user = invitation is not None and invitation.organization_id is not None
    referrer = None
    if invitation:
        referrer = await db.scalar(
            select(AdminUser).where(AdminUser.telegram_id == str(invitation.invited_by))
        )
    referral_role = invitation.role if is_invited_user and invitation else "owner"

    # Create or update AdminUser for approved registration with organization context.
    existing = await db.execute(select(AdminUser).where(AdminUser.telegram_id == kyb.chat_id))
    admin_user = existing.scalar_one_or_none()

    await _ensure_unique_email(db, email, exclude_admin_id=admin_user.id if admin_user else None)
    await _ensure_unique_usdt_wallet_address(
        db,
        settlement_values["usdt_wallet_address"],
        exclude_admin_id=admin_user.id if admin_user else None,
    )
    admin_wallet_address = settlement_values["usdt_wallet_address"]

    if is_invited_user:
        can_manage_team = bool(invitation_permissions.get("can_manage_team", False))
        can_manage_payments = bool(
            invitation_permissions.get("can_edit_business_settings", False)
            or invitation_permissions.get("can_add_edit_delete_cards_promotion", False)
            or invitation_permissions.get("can_refund_cards_charges", False)
        )
        can_manage_disbursements = bool(
            invitation_permissions.get("can_upload_delete_batch_disbursements", False)
            or invitation_permissions.get("can_validate_batch_disbursements", False)
            or invitation_permissions.get("can_approve_batch_disbursements", False)
        )
        can_view_reports = bool(
            invitation_permissions.get("can_view_transaction_details", False)
            or invitation_permissions.get("can_download_csv_report", False)
        )
        can_manage_wallet = bool(
            invitation_permissions.get("can_withdraw_funds", False)
            or invitation_permissions.get("can_create_transfers", False)
            or invitation_permissions.get("can_add_edit_delete_withdrawal_account", False)
        )
        can_manage_transactions = bool(
            invitation_permissions.get("can_generate_invoice", False)
            or invitation_permissions.get("can_add_edit_customers", False)
            or invitation_permissions.get("can_view_transaction_details", False)
        )
        can_manage_bot = bool(
            invitation_permissions.get("can_see_api_keys", False)
            or invitation_permissions.get("can_resend_callbacks", False)
            or invitation_permissions.get("can_change_callback_urls", False)
        )
        can_approve_topups = bool(invitation_permissions.get("can_approve_batch_disbursements", False))
    else:
        # Organization owner defaults for direct registrants.
        can_manage_team = True
        can_manage_payments = True
        can_manage_disbursements = True
        can_view_reports = True
        can_manage_wallet = True
        can_manage_transactions = True
        can_manage_bot = True
        can_approve_topups = False

    # Direct registrants own their organization; referral registrations inherit the
    # account tier of the user who created the referral link.
    role_value = referral_role
    if is_invited_user and referrer and referrer.is_super_admin:
        role_value = "admin"
    elif is_invited_user and referrer and not referrer.is_super_admin:
        role_value = "user"
        can_manage_team = False
        can_manage_payments = True
        can_manage_disbursements = False
        can_view_reports = True
        can_manage_wallet = True
        can_manage_transactions = True
        can_manage_bot = False
        can_approve_topups = False

    if admin_user:
        admin_user.telegram_username = kyb.telegram_username
        admin_user.name = kyb.full_name or kyb.telegram_username or kyb.chat_id
        admin_user.is_active = True
        admin_user.organization_id = org_id
        admin_user.organization_name = org_name
        admin_user.role = role_value
        admin_user.can_manage_team = can_manage_team
        admin_user.can_manage_payments = can_manage_payments
        admin_user.can_manage_disbursements = can_manage_disbursements
        admin_user.can_view_reports = can_view_reports
        admin_user.can_manage_wallet = can_manage_wallet
        admin_user.can_manage_transactions = can_manage_transactions
        admin_user.can_manage_bot = can_manage_bot
        admin_user.can_approve_topups = can_approve_topups
        admin_user.bank_name = settlement_values["bank_name"]
        admin_user.bank_account_number = settlement_values["bank_account_number"]
        admin_user.bank_account_name = settlement_values["bank_account_name"]
        admin_user.bank_address = settlement_values["bank_address"]
        admin_user.usdt_wallet_address = admin_wallet_address
        admin_user.settlement_type = settlement_values["settlement_type"] or "Bank Transfer"
        admin_user.settlement_currency = settlement_values["settlement_currency"]
    else:
        admin_user = AdminUser(
            telegram_id=kyb.chat_id,
            telegram_username=kyb.telegram_username,
            name=kyb.full_name or kyb.telegram_username or kyb.chat_id,
            is_active=True,
            is_super_admin=False,
            role=role_value,
            can_manage_payments=can_manage_payments,
            can_manage_disbursements=can_manage_disbursements,
            can_view_reports=can_view_reports,
            can_manage_wallet=can_manage_wallet,
            can_manage_transactions=can_manage_transactions,
            can_manage_bot=can_manage_bot,
            can_approve_topups=can_approve_topups,
            can_manage_team=can_manage_team,
            organization_id=org_id,
            organization_name=org_name,
            added_by=(referrer.telegram_id if is_invited_user and referrer else current_user.id),
            bank_name=settlement_values["bank_name"],
            bank_account_number=settlement_values["bank_account_number"],
            bank_account_name=settlement_values["bank_account_name"],
            bank_address=settlement_values["bank_address"],
            usdt_wallet_address=admin_wallet_address,
            settlement_type=settlement_values["settlement_type"] or "Bank Transfer",
            settlement_currency=settlement_values["settlement_currency"],
        )
        db.add(admin_user)

    # Issue dashboard login credentials + SwiftPay Access Keys (TEST/LIVE) so the
    # merchant can log in and start integrating immediately. Shown once, here only.
    plaintext_password = _generate_password()
    admin_user.email = email or admin_user.email
    admin_user.password_hash = hash_password(plaintext_password)
    admin_user.must_change_password = True

    if invitation and invitation.status == "pending":
        invitation.status = "accepted"
        invitation.accepted_at = datetime.utcnow()

    if is_invited_user and referrer:
        existing_relation = await db.scalar(
            select(Downline).where(
                Downline.upline_user_id == str(referrer.telegram_id),
                Downline.downline_user_id == str(kyb.chat_id),
            )
        )
        if not existing_relation:
            db.add(Downline(
                upline_user_id=str(referrer.telegram_id),
                downline_user_id=str(kyb.chat_id),
                level=1,
                is_direct=True,
                status="active",
            ))
        if not referrer.is_super_admin and referrer.added_by:
            super_relation = await db.scalar(
                select(Downline).where(
                    Downline.upline_user_id == str(referrer.added_by),
                    Downline.downline_user_id == str(kyb.chat_id),
                )
            )
            if not super_relation:
                db.add(Downline(
                    upline_user_id=str(referrer.added_by),
                    downline_user_id=str(kyb.chat_id),
                    level=2,
                    is_direct=False,
                    status="active",
                ))

    await db.commit()
    await db.refresh(kyb)
    await db.refresh(admin_user)

    # Ensure the approved user has wallet rows for every admin-managed currency so
    # their account appears in the manual wallet credit/debit screens immediately.
    from services.wallets import WalletsService
    wallet_service = WalletsService(db)
    await wallet_service.ensure_admin_wallets(str(admin_user.telegram_id), ["PHP", "USD", "KRW"])

    test_key, live_key = await _issue_merchant_access_keys(db, admin_user)
    await db.commit()

    # Optionally notify the user via Telegram
    try:
        from services.telegram_service import TelegramService
        tg = TelegramService()
        await tg.send_message(
            kyb.chat_id,
            "🎉 <b>KYB Registration Approved!</b>\n"
            "━━━━━━━━━━━━━━━━━━━━\n"
            "Your registration has been approved. You can now use all bot commands.\n\n"
            "Type /start to begin.",
        )
    except Exception as e:
        logger.warning("Failed to send KYB approval notification to %s: %s", kyb.chat_id, e)

    if email:
        _send_merchant_credentials_email(
            email=email,
            password=plaintext_password,
            test_access_key=test_key,
            live_access_key=live_key,
            merchant_name=admin_user.name or kyb.full_name or kyb.bank_name or "Merchant",
        )
    else:
        logger.warning("KYB #%d approved without email, skipping onboarding email. chat_id=%s", kyb_id, kyb.chat_id)

    logger.info("KYB #%d approved by admin %s — chat_id %s (%s)", kyb_id, current_user.id, kyb.chat_id, kyb.full_name)
    return ApproveKybResponse(
        **KybRegistrationOut.model_validate(kyb).model_dump(),
        credentials=IssuedCredentials(
            email=admin_user.email,
            password=plaintext_password,
            test_access_key=test_key,
            live_access_key=live_key,
        ),
    )


@router.post("/{kyb_id}/reject", response_model=KybRegistrationOut)
async def reject_kyb_registration(
    kyb_id: int,
    body: RejectKybRequest = RejectKybRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a KYB registration with an optional reason. Super admin only."""
    _require_super_admin(current_user)

    result = await db.execute(select(KybRegistration).where(KybRegistration.id == kyb_id))
    kyb = result.scalar_one_or_none()
    if not kyb:
        raise HTTPException(status_code=404, detail="KYB registration not found")
    if kyb.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot reject an already-approved KYB registration")

    kyb.status = "rejected"
    kyb.rejection_reason = body.reason

    await db.commit()
    await db.refresh(kyb)

    # Optionally notify the user via Telegram
    try:
        from services.telegram_service import TelegramService
        tg = TelegramService()
        await tg.send_message(
            kyb.chat_id,
            f"❌ <b>KYB Registration Rejected</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Reason: {body.reason}\n\n"
            f"Please contact the bot administrator for more information.",
        )
    except Exception as e:
        logger.warning("Failed to send KYB rejection notification to %s: %s", kyb.chat_id, e)

    logger.info("KYB #%d rejected by admin %s — chat_id %s", kyb_id, current_user.id, kyb.chat_id)
    return kyb
