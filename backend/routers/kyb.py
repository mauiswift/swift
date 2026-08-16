"""
KYB (Know Your Business) Registration Management Router
Super admins can list, approve, and reject KYB registration applications.
"""
import logging
import hashlib
import secrets
import string
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import hash_password
from core.database import get_db
from core.mask_crypto import encrypt_text
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.api_configs import Api_configs
from models.kyb_registrations import KybRegistration
from models.team_invitations import TeamInvitation
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
        db.add(Api_configs(
            user_id=owner_id,
            service_name="swiftpay",
            config_key=config_key,
            config_value=encrypt_text(plaintext_key),
            is_active=True,
        ))
        db.add(Api_configs(
            user_id=owner_id,
            service_name="swiftpay",
            config_key=f"{config_key}_scopes",
            config_value=full_scopes,
            is_active=True,
        ))
        db.add(Api_configs(
            user_id=owner_id,
            service_name="swiftpay",
            config_key=f"{config_key}_issued_at",
            config_value=issued_at,
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

    # Create or update AdminUser for approved registration with organization context.
    existing = await db.execute(select(AdminUser).where(AdminUser.telegram_id == kyb.chat_id))
    admin_user = existing.scalar_one_or_none()

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

    # Direct registrants own their organization; invited users keep the role from their invitation.
    role_value = invitation.role if (is_invited_user and invitation) else "owner"

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
            added_by=current_user.id,
        )
        db.add(admin_user)

    # Issue dashboard login credentials + SwiftPay Access Keys (TEST/LIVE) so the
    # merchant can log in and start integrating immediately. Shown once, here only.
    plaintext_password = _generate_password()
    admin_user.email = email or admin_user.email
    admin_user.password_hash = hash_password(plaintext_password)

    if invitation and invitation.status == "pending":
        invitation.status = "accepted"
        invitation.accepted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(kyb)
    await db.refresh(admin_user)

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
