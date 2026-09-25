"""
Team Invitations and Role Management API
"""
import secrets
import os
import re
from datetime import datetime, timezone, timedelta
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr

from core.database import get_db
from core.config import settings
from core.auth import hash_password
from dependencies.auth import get_admin_user, get_current_user
from services.email_service import EmailService
from models.admin_users import AdminUser
from models.team_invitations import TeamInvitation, AdminRole
from models.referral_links import ReferralLink
from models.downline import Downline, DownlineCommission
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from services.downline import DownlineService
from core.roles import (
    get_invited_super_admin_permissions,
    get_role_permissions,
    get_role_permissions_by_name,
    PredefinedRoleEnum,
)
from schemas.auth import UserResponse
from utils.datetime import serialize_utc_datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/team", tags=["team-management"])


class DownlinePasswordRequest(BaseModel):
    password: str
    confirm_password: str


@router.get("/downline")
async def list_downline(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the authenticated user's referral downline and network totals."""
    if not current_user.permissions or not current_user.permissions.can_manage_team:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view downline")

    service = DownlineService(db)
    relationships = await service.list_downline(str(current_user.id), active_only=False)
    stats = await service.get_network_stats(str(current_user.id))
    user_ids = {item.downline_user_id for item in relationships}
    users = {}
    if user_ids:
        result = await db.execute(select(AdminUser).where(AdminUser.telegram_id.in_(user_ids)))
        users = {user.telegram_id: user for user in result.scalars().all()}

    return {
        "items": [
            {
                "id": relationship.id,
                "user_id": relationship.downline_user_id,
                "name": users.get(relationship.downline_user_id).name if relationship.downline_user_id in users else None,
                "email": users.get(relationship.downline_user_id).email if relationship.downline_user_id in users else None,
                "level": relationship.level,
                "is_direct": relationship.is_direct,
                "status": relationship.status,
                "total_commissions": relationship.total_commissions or 0,
                "pending_commissions": relationship.pending_commissions or 0,
                "service_fee_percent": relationship.service_fee_percent or 0,
                "created_at": relationship.created_at,
            }
            for relationship in relationships
        ],
        "stats": {
            "direct_referrals": stats.direct_referrals or 0,
            "total_network_size": stats.total_network_size or 0,
            "active_members": stats.active_members or 0,
            "total_earned": stats.total_earned or 0,
            "pending_earnings": stats.pending_earnings or 0,
            "paid_out": stats.paid_out or 0,
        },
    }


async def _get_downline_relationship(
            relationship_id: int,
            current_user: UserResponse,
            db: AsyncSession,
) -> Downline:
            relationship = await db.scalar(
                select(Downline).where(
                    Downline.id == relationship_id,
                    Downline.upline_user_id.in_(DownlineService._user_id_variants(str(current_user.id))),
                )
            )
            if relationship is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Downline member not found")
            return relationship


@router.get("/downline/{relationship_id}/activity")
async def get_downline_activity(
            relationship_id: int,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
):
            """Return wallet balances and recent activity for an authorized downline member."""
            if not current_user.permissions or not current_user.permissions.can_manage_team:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view downline activity")
            relationship = await _get_downline_relationship(relationship_id, current_user, db)
            wallet_result = await db.execute(
                select(Wallets)
                .where(Wallets.user_id == relationship.downline_user_id)
                .order_by(Wallets.currency.asc())
            )
            transaction_result = await db.execute(
                select(Wallet_transactions)
                .where(Wallet_transactions.user_id == relationship.downline_user_id)
                .order_by(Wallet_transactions.created_at.desc(), Wallet_transactions.id.desc())
                .limit(50)
            )
            wallets = list(wallet_result.scalars().all())
            wallet_currencies = {wallet.id: wallet.currency or "PHP" for wallet in wallets}
            return {
                "wallets": [
                    {
                        "currency": wallet.currency or "PHP",
                        "balance": wallet.balance or 0,
                        "available_balance": wallet.available_balance or 0,
                        "pending_balance": wallet.pending_balance or 0,
                        "is_frozen": bool(wallet.is_frozen),
                    }
                    for wallet in wallets
                ],
                "transactions": [
                    {
                        "id": transaction.id,
                        "currency": wallet_currencies.get(transaction.wallet_id, "PHP"),
                        "transaction_type": transaction.transaction_type,
                        "amount": transaction.amount,
                        "balance_after": transaction.balance_after,
                        "status": transaction.status,
                        "reference_id": transaction.reference_id,
                        "note": transaction.note,
                        "created_at": transaction.created_at,
                    }
                    for transaction in transaction_result.scalars().all()
                ],
            }


@router.delete("/downline/{relationship_id}/passkey")
async def remove_downline_passkey(
            relationship_id: int,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
):
            """Remove a downline member's passkey so they can recover account access."""
            if not current_user.permissions or not current_user.permissions.can_manage_team:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to remove passkeys")
            relationship = await _get_downline_relationship(relationship_id, current_user, db)
            admin = await db.scalar(
                select(AdminUser).where(AdminUser.telegram_id == relationship.downline_user_id)
            )
            if admin is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Downline member not found")
            admin.passkey_credential_id = None
            admin.passkey_public_key = None
            admin.passkey_sign_count = 0
            admin.passkey_transports = None
            await db.commit()
            return {"success": True, "message": "Downline passkey removed"}

@router.post("/downline/{relationship_id}/password")
async def change_downline_password(
            relationship_id: int,
            body: DownlinePasswordRequest,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
):
            """Set a downline member's password and require change at next login."""
            if not current_user.permissions or not current_user.permissions.can_manage_team:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to change downline passwords")
            password = body.password.strip()
            if len(password) < 8:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")
            if password != body.confirm_password.strip():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
            relationship = await _get_downline_relationship(relationship_id, current_user, db)
            admin = await db.scalar(
                select(AdminUser).where(AdminUser.telegram_id == relationship.downline_user_id)
            )
            if admin is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Downline member not found")
            admin.password_hash = hash_password(password)
            admin.must_change_password = True
            admin.updated_at = datetime.now(timezone.utc)
            await db.commit()
            return {"success": True, "message": "Downline password updated"}


@router.patch("/downline/{relationship_id}/status")
async def update_downline_status(
            relationship_id: int,
            body: dict,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
):
            """Suspend or reactivate a member in the authenticated user's downline."""
            if not current_user.permissions or not current_user.permissions.can_manage_team:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage downline")
            next_status = str(body.get("status") or "").strip().lower()
            if next_status not in {"active", "suspended", "inactive"}:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be active, suspended, or inactive")
            relationship = await _get_downline_relationship(relationship_id, current_user, db)
            relationship.status = next_status
            relationship.updated_at = datetime.now(timezone.utc)
            await db.commit()
            return {"success": True, "id": relationship.id, "status": relationship.status}


@router.patch("/downline/{relationship_id}/service-fee")
async def update_downline_service_fee(
            relationship_id: int,
            body: dict,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
):
            """Set the collection service-fee surcharge for one downline member."""
            if not current_user.permissions or not current_user.permissions.can_manage_team:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage downline")
            try:
                fee_percent = float(body.get("service_fee_percent"))
            except (TypeError, ValueError) as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service fee must be a number") from exc
            if not 0 <= fee_percent <= 100:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service fee must be between 0 and 100 percent")
            relationship = await _get_downline_relationship(relationship_id, current_user, db)
            relationship.service_fee_percent = round(fee_percent, 2)
            relationship.updated_at = datetime.now(timezone.utc)
            await db.commit()
            return {"success": True, "id": relationship.id, "service_fee_percent": relationship.service_fee_percent}


@router.post("/downline/{relationship_id}/approve-commissions")
async def approve_downline_commissions(
            relationship_id: int,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
):
            """Approve all pending commissions generated by one downline member."""
            if not current_user.permissions or not current_user.permissions.can_manage_team:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage commissions")
            relationship = await _get_downline_relationship(relationship_id, current_user, db)
            result = await db.execute(
                select(DownlineCommission).where(
                    DownlineCommission.recipient_id == str(current_user.id),
                    DownlineCommission.source_user_id == relationship.downline_user_id,
                    DownlineCommission.status == "pending",
                )
            )
            commissions = list(result.scalars().all())
            now = datetime.now(timezone.utc)
            approved_total = 0.0
            for commission in commissions:
                commission.status = "approved"
                commission.approved_at = now
                commission.updated_at = now
                approved_total += float(commission.amount or 0)
            relationship.pending_commissions = max(
                0.0,
                round(float(relationship.pending_commissions or 0) - approved_total, 2),
            )
            relationship.total_commissions = round(
                float(relationship.total_commissions or 0) + approved_total,
                2,
            )
            relationship.updated_at = now
            await db.commit()
            return {
                "success": True,
                "approved_count": len(commissions),
                "approved_total": round(approved_total, 2),
                "pending_commissions": relationship.pending_commissions,
                "total_commissions": relationship.total_commissions,
            }


@router.get("/referral-link")
async def get_referral_link(
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the reusable registration link for the current registered user."""
    user_id = str(current_user.id)
    result = await db.execute(
        select(ReferralLink)
        .where(ReferralLink.created_by == user_id, ReferralLink.is_active.is_(True))
        .order_by(ReferralLink.created_at.asc())
        .limit(1)
    )
    referral = result.scalar_one_or_none()
    if referral is None:
        referral = ReferralLink(
            token=secrets.token_urlsafe(32),
            created_by=user_id,
            organization_id=current_user.organization_id,
            organization_name=current_user.organization_name,
        )
        db.add(referral)
        await db.commit()
        await db.refresh(referral)

    frontend_url = (os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").rstrip("/")
    if not frontend_url:
        forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
        forwarded_proto = request.headers.get("x-forwarded-proto", "https").split(",")[0].strip()
        if forwarded_host:
            frontend_url = f"{forwarded_proto}://{forwarded_host}".rstrip("/")
    registration_link = f"{frontend_url}/register?referral={referral.token}" if frontend_url else f"/register?referral={referral.token}"
    return {"success": True, "registration_link": registration_link}

# ────────────────────────────────────────────────────────────────
# Pydantic Models
# ────────────────────────────────────────────────────────────────

class SendInvitationRequest(BaseModel):
    email: EmailStr
    role: str = "admin"  # admin, operator, viewer
    organization_name: Optional[str] = None
    organization_id: Optional[str] = None
    permissions: Optional[dict] = None
    notes: Optional[str] = None


class CompleteInvitationRequest(BaseModel):
    password: str
    confirm_password: str
    full_name: Optional[str] = None

class InvitationResponse(BaseModel):
    id: int
    email: str
    role: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    status: str
    invited_at: str
    expires_at: Optional[str]
    notes: Optional[str]
    manual_link: Optional[str] = None
    email_sent: bool = False
    email_error: Optional[str] = None

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    permissions: dict
    is_builtin: bool

class TeamMemberResponse(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[str]
    role: str
    status: str
    joined_at: Optional[str]
    permissions: dict


class CreateRoleRequest(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: dict


class SMTPError(Exception):
    """Raised when SMTP operations fail"""
    pass


def _normalize_invitation_email(email: str) -> str:
    return str(email).strip().lower()


def _is_invitation_expired(expires_at: Optional[datetime], now: Optional[datetime] = None) -> bool:
    if expires_at is None:
        return False
    current_time = now or datetime.now(timezone.utc)
    normalized_expiry = (
        expires_at.replace(tzinfo=timezone.utc)
        if expires_at.tzinfo is None
        else expires_at.astimezone(timezone.utc)
    )
    return normalized_expiry < current_time


def _resolve_frontend_origin(request: Optional[Request] = None, frontend_url: Optional[str] = None) -> str:
    candidate = (frontend_url or os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").strip().rstrip("/")
    if candidate:
        return candidate

    if request is not None:
        forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
        forwarded_proto = (request.headers.get("x-forwarded-proto") or "https").split(",")[0].strip() or "https"
        if forwarded_host:
            return f"{forwarded_proto}://{forwarded_host}".rstrip("/")

    return ""


def _invitation_link(token: str, request: Optional[Request] = None, frontend_url: Optional[str] = None) -> str:
    base_url = _resolve_frontend_origin(request=request, frontend_url=frontend_url)
    return f"{base_url}/accept-invitation?token={token}" if base_url else f"/accept-invitation?token={token}"


def _send_invitation_email(
    to_email: str,
    token: str,
    role: str,
    inviter_name: str = "",
    organization_name: str = "",
    expires_at: Optional[str] = None,
    notes: str = "",
    request: Optional[Request] = None,
) -> None:
    """Send invitation email. Raises SMTPError if sending fails.
    
    Args:
        to_email: Recipient email address
        token: Invitation token
        role: Role being invited as
        inviter_name: Name of person sending invitation
        
    Raises:
        SMTPError: If SMTP is not configured or email sending fails
    """
    accept_url = _invitation_link(token, request=request)

    config = EmailService._resolve_smtp_config()
    smtp_configured = bool(config["host"] and config["from_email"])
    resend_configured = bool(config["resend_api_key"] and (config["resend_from_email"] or config["from_email"]))
    if not smtp_configured and not resend_configured:
        logger.warning(
            "Email delivery is not configured — invitation link for %s (role: %s): %s",
            to_email, role, accept_url,
        )
        raise SMTPError(
            "Email sending is not configured on this server. "
            "Please contact the administrator. "
            f"Acceptance link: {accept_url}"
        )

    try:
        EmailService.send_invitation_email(
            to_email=to_email,
            token=token,
            role=role,
            inviter_name=inviter_name,
            organization_name=organization_name,
            expires_at=expires_at,
            notes=notes,
        )
        logger.info("Invitation email sent to %s", to_email)
    except Exception as exc:
        logger.error("Unexpected error sending invitation to %s: %s", to_email, exc, exc_info=True)
        raise SMTPError(f"Failed to send invitation email: {str(exc)}") from exc


def _can_manage_team(admin: Optional[AdminUser], current_user: Optional[UserResponse] = None) -> bool:
    if admin and admin.can_manage_team:
        return True
    if current_user and current_user.permissions and current_user.permissions.can_manage_team:
        return True
    if current_user and current_user.permissions and current_user.permissions.is_super_admin:
        return True
    return False


def _is_org_admin(admin: Optional[AdminUser]) -> bool:
    if not admin:
        return False
    return bool((not admin.is_super_admin) and admin.organization_id)


def _validate_role_name(role: str) -> str:
    normalized = (role or "").strip()
    if normalized not in PREDEFINED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    return normalized


def _to_org_slug(value: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")
    if not base:
        raise HTTPException(status_code=400, detail="Organization name or ID is required")
    return base[:48]


async def _resolve_super_admin_org_scope(
    db: AsyncSession,
    request: SendInvitationRequest,
    role_name: str,
) -> tuple[Optional[str], Optional[str]]:
    raw_org_name = (request.organization_name or "").strip()
    raw_org_id = (request.organization_id or "").strip()

    if role_name == "owner" and not (raw_org_name or raw_org_id):
        raise HTTPException(status_code=400, detail="organization_name or organization_id is required when inviting owner")

    if not (raw_org_name or raw_org_id):
        return None, None

    org_name = raw_org_name or raw_org_id
    org_id_base = _to_org_slug(raw_org_id or raw_org_name)

    # Keep org_id unique across pending invitations and existing admin users.
    org_id = org_id_base
    suffix = 1
    while True:
        inv_exists = await db.execute(
            select(TeamInvitation.id).where(TeamInvitation.organization_id == org_id).limit(1)
        )
        admin_exists = await db.execute(
            select(AdminUser.id).where(AdminUser.organization_id == org_id).limit(1)
        )
        if not inv_exists.scalar_one_or_none() and not admin_exists.scalar_one_or_none():
            break
        suffix += 1
        org_id = f"{org_id_base}-{suffix}"

    return org_id, org_name

# ────────────────────────────────────────────────────────────────
# Predefined Roles
# ────────────────────────────────────────────────────────────────

PREDEFINED_ROLES = {
    "super_admin": {
        "description": "Full access to all features and administration",
        "permissions": {
            "can_add_delete_user": True,
            "can_edit_user_access": True,
            "can_edit_business_settings": True,
            "can_add_edit_delete_cards_promotion": True,
            "can_upload_delete_batch_disbursements": True,
            "can_validate_batch_disbursements": True,
            "can_generate_invoice": True,
            "can_add_edit_customers": True,
            "can_view_transaction_details": True,
            "can_download_csv_report": True,
            "can_withdraw_funds": True,
            "can_create_transfers": True,
            "can_add_edit_delete_withdrawal_account": True,
            "can_see_api_keys": True,
            "can_resend_callbacks": True,
            "can_change_callback_urls": True,
            "can_approve_batch_disbursements": True,
            "can_refund_cards_charges": True,
            "can_manage_team": True,
        }
    },
    "admin": {
        "description": "User and business management",
        "permissions": {
            "can_add_delete_user": True,
            "can_edit_user_access": True,
            "can_edit_business_settings": True,
            "can_add_edit_delete_cards_promotion": True,
            "can_upload_delete_batch_disbursements": False,
            "can_validate_batch_disbursements": False,
            "can_generate_invoice": False,
            "can_add_edit_customers": False,
            "can_view_transaction_details": False,
            "can_download_csv_report": False,
            "can_withdraw_funds": False,
            "can_create_transfers": False,
            "can_add_edit_delete_withdrawal_account": False,
            "can_see_api_keys": False,
            "can_resend_callbacks": False,
            "can_change_callback_urls": False,
            "can_approve_batch_disbursements": False,
            "can_refund_cards_charges": False,
            "can_manage_team": True,
        }
    },
    "owner": {
        "description": "Organization owner with full org-level access",
        "permissions": {
            "can_add_delete_user": True,
            "can_edit_user_access": True,
            "can_edit_business_settings": True,
            "can_add_edit_delete_cards_promotion": True,
            "can_upload_delete_batch_disbursements": True,
            "can_validate_batch_disbursements": True,
            "can_generate_invoice": True,
            "can_add_edit_customers": True,
            "can_view_transaction_details": True,
            "can_download_csv_report": True,
            "can_withdraw_funds": True,
            "can_create_transfers": True,
            "can_add_edit_delete_withdrawal_account": True,
            "can_see_api_keys": True,
            "can_resend_callbacks": True,
            "can_change_callback_urls": True,
            "can_approve_batch_disbursements": True,
            "can_refund_cards_charges": True,
            "can_manage_team": True,
        }
    },
    "editor": {
        "description": "Batch disbursement and customer management",
        "permissions": {
            "can_add_delete_user": False,
            "can_edit_user_access": False,
            "can_edit_business_settings": False,
            "can_add_edit_delete_cards_promotion": False,
            "can_upload_delete_batch_disbursements": True,
            "can_validate_batch_disbursements": True,
            "can_generate_invoice": True,
            "can_add_edit_customers": True,
            "can_view_transaction_details": False,
            "can_download_csv_report": False,
            "can_withdraw_funds": False,
            "can_create_transfers": False,
            "can_add_edit_delete_withdrawal_account": False,
            "can_see_api_keys": False,
            "can_resend_callbacks": False,
            "can_change_callback_urls": False,
            "can_approve_batch_disbursements": False,
            "can_refund_cards_charges": False,
            "can_manage_team": False,
        }
    },
    "viewer": {
        "description": "View reports/transactions and manage withdrawals",
        "permissions": {
            "can_add_delete_user": False,
            "can_edit_user_access": False,
            "can_edit_business_settings": False,
            "can_add_edit_delete_cards_promotion": False,
            "can_upload_delete_batch_disbursements": False,
            "can_validate_batch_disbursements": False,
            "can_generate_invoice": False,
            "can_add_edit_customers": False,
            "can_view_transaction_details": True,
            "can_download_csv_report": True,
            "can_withdraw_funds": True,
            "can_create_transfers": True,
            "can_add_edit_delete_withdrawal_account": True,
            "can_see_api_keys": False,
            "can_resend_callbacks": False,
            "can_change_callback_urls": False,
            "can_approve_batch_disbursements": False,
            "can_refund_cards_charges": False,
            "can_manage_team": False,
        }
    },
    "developer": {
        "description": "API and webhook management",
        "permissions": {
            "can_add_delete_user": False,
            "can_edit_user_access": False,
            "can_edit_business_settings": False,
            "can_add_edit_delete_cards_promotion": False,
            "can_upload_delete_batch_disbursements": False,
            "can_validate_batch_disbursements": False,
            "can_generate_invoice": False,
            "can_add_edit_customers": False,
            "can_view_transaction_details": False,
            "can_download_csv_report": False,
            "can_withdraw_funds": False,
            "can_create_transfers": False,
            "can_add_edit_delete_withdrawal_account": False,
            "can_see_api_keys": True,
            "can_resend_callbacks": True,
            "can_change_callback_urls": True,
            "can_approve_batch_disbursements": False,
            "can_refund_cards_charges": False,
            "can_manage_team": False,
        }
    },
    "approver": {
        "description": "Approval and refund management",
        "permissions": {
            "can_add_delete_user": False,
            "can_edit_user_access": False,
            "can_edit_business_settings": False,
            "can_add_edit_delete_cards_promotion": False,
            "can_upload_delete_batch_disbursements": False,
            "can_validate_batch_disbursements": False,
            "can_generate_invoice": False,
            "can_add_edit_customers": False,
            "can_view_transaction_details": False,
            "can_download_csv_report": False,
            "can_withdraw_funds": False,
            "can_create_transfers": False,
            "can_add_edit_delete_withdrawal_account": False,
            "can_see_api_keys": False,
            "can_resend_callbacks": False,
            "can_change_callback_urls": False,
            "can_approve_batch_disbursements": True,
            "can_refund_cards_charges": True,
            "can_manage_team": False,
        }
    },
}


def _application_permissions(role_name: str, requested: Optional[dict] = None) -> dict[str, bool]:
    """Return permission keys consumed by the dashboard and API guards."""
    app_keys = {
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
    requested = requested if isinstance(requested, dict) else {}
    if role_name == "super_admin":
        # The restricted invitation policy is intentional and cannot be
        # expanded through request payload overrides.
        return get_invited_super_admin_permissions().model_dump()

    if any(key in requested for key in app_keys):
        return {key: bool(requested.get(key)) for key in app_keys}

    role_map = {
        "owner": PredefinedRoleEnum.OWNER,
        "admin": PredefinedRoleEnum.ADMIN,
        "manager": PredefinedRoleEnum.MANAGER,
        "editor": PredefinedRoleEnum.OPERATOR,
        "operator": PredefinedRoleEnum.OPERATOR,
        "viewer": PredefinedRoleEnum.VIEWER,
        "developer": PredefinedRoleEnum.DEVELOPER,
    }
    if role_name in role_map:
        return get_role_permissions(role_map[role_name]).model_dump()
    if role_name == "approver":
        return {
            key: key in {"can_approve_topups", "can_manage_transactions", "can_view_reports"}
            for key in app_keys
        }
    return {key: False for key in app_keys}

# ────────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────────

@router.post("/invite", response_model=InvitationResponse)
async def send_team_invitation(
    request: SendInvitationRequest,
    http_request: Request,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Send invitation to new team member"""
    # Super admins and organization admins with team permission can invite
    admin_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin = admin_res.scalar_one_or_none()

    if not _can_manage_team(admin, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to invite team members")

    role_name = _validate_role_name(request.role)

    # Organization admins cannot invite super admins
    if admin and _is_org_admin(admin) and role_name == "super_admin":
        raise HTTPException(status_code=400, detail="Organization admin cannot assign super_admin role")
    if admin and _is_org_admin(admin) and role_name == "owner":
        raise HTTPException(status_code=400, detail="Organization admin cannot assign owner role")

    # Organization admins must use predefined role templates only (no custom permissions overrides).
    if admin and _is_org_admin(admin) and request.permissions:
        raise HTTPException(status_code=400, detail="Organization admin cannot set custom permissions")

    invitation_email = _normalize_invitation_email(request.email)

    # Check both invitation and account state using the same canonical email.
    existing_query = select(TeamInvitation).where(
        func.lower(TeamInvitation.email) == invitation_email,
        TeamInvitation.status.in_(["pending", "accepted"])
    )
    if admin and _is_org_admin(admin):
        existing_query = existing_query.where(TeamInvitation.organization_id == admin.organization_id)
    existing = await db.execute(existing_query)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already invited or registered")

    existing_user_query = select(AdminUser).where(func.lower(AdminUser.email) == invitation_email)
    existing_user = await db.scalar(existing_user_query)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email. Ask the user to sign in.",
        )

    # Generate invitation token
    token = secrets.token_urlsafe(32)

    # Get permissions from predefined role or use custom
    permissions = _application_permissions(role_name, request.permissions)

    org_id = admin.organization_id if admin and _is_org_admin(admin) else None
    org_name = admin.organization_name if admin and _is_org_admin(admin) else None

    # Super admins can invite to existing org or create a new one (Step 1.1)
    is_super = current_user.permissions.is_super_admin if current_user.permissions else False
    if is_super:
        org_id, org_name = await _resolve_super_admin_org_scope(db, request, role_name)

    # Create invitation
    invitation = TeamInvitation(
        email=invitation_email,
        invitation_token=token,
        role=role_name,
        permissions=permissions,
        invited_by=str(current_user.id),
        organization_id=org_id,
        organization_name=org_name,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        notes=request.notes,
    )

    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    logger.info(f"Team invitation created for {request.email} by {current_user.id}")

    # Build manual link for response
    manual_link = _invitation_link(token, request=http_request)

    # Send email notification
    email_error = None
    email_sent = False
    try:
        inviter = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
        _send_invitation_email(
            to_email=request.email,
            token=token,
            role=role_name,
            inviter_name=(inviter.name if inviter else ""),
            organization_name=org_name or "",
            expires_at=serialize_utc_datetime(invitation.expires_at),
            notes=request.notes or "",
            request=http_request,
        )
        logger.info(f"Team invitation email sent to {request.email}")
        email_sent = True
    except SMTPError as exc:
        logger.warning(f"Failed to send invitation email to {request.email}: {exc}")
        email_error = str(exc)

    return InvitationResponse(
        id=invitation.id,
        email=invitation.email,
        role=invitation.role,
        organization_id=invitation.organization_id,
        organization_name=invitation.organization_name,
        status=invitation.status,
        invited_at=serialize_utc_datetime(invitation.invited_at),
        expires_at=serialize_utc_datetime(invitation.expires_at),
        notes=invitation.notes,
        manual_link=manual_link,
        email_sent=email_sent,
        email_error=email_error,
    )


@router.get("/invitations")
async def list_invitations(
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all pending invitations"""
    admin_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin = admin_res.scalar_one_or_none()

    if not _can_manage_team(admin, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    query = select(TeamInvitation)
    if _is_org_admin(admin):
        query = query.where(TeamInvitation.organization_id == admin.organization_id)
    result = await db.execute(query.order_by(TeamInvitation.invited_at.desc()))
    invitations = result.scalars().all()

    return {
        "invitations": [
            {
                "id": inv.id,
                "email": inv.email,
                "role": inv.role,
                "status": inv.status,
                "invited_at": serialize_utc_datetime(inv.invited_at),
                "expires_at": serialize_utc_datetime(inv.expires_at),
                "invited_by": inv.invited_by,
                "organization_id": inv.organization_id,
                "organization_name": inv.organization_name,
                "permissions": inv.permissions,
                "notes": inv.notes,
            }
            for inv in invitations
        ]
    }


@router.put("/invitations/{invitation_id}")
async def update_invitation(
    invitation_id: int,
    request: SendInvitationRequest,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update invitation role and permissions"""
    admin_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin = admin_res.scalar_one_or_none()

    if not _can_manage_team(admin, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    role_name = _validate_role_name(request.role)

    inv_res = await db.execute(
        select(TeamInvitation).where(TeamInvitation.id == invitation_id)
    )
    invitation = inv_res.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if _is_org_admin(admin) and invitation.organization_id != admin.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized for this invitation")

    if _is_org_admin(admin) and role_name == "super_admin":
        raise HTTPException(status_code=400, detail="Organization admin cannot assign super_admin role")
    if _is_org_admin(admin) and role_name == "owner":
        raise HTTPException(status_code=400, detail="Organization admin cannot assign owner role")

    if _is_org_admin(admin) and request.permissions:
        raise HTTPException(status_code=400, detail="Organization admin cannot set custom permissions")

    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Can only update pending invitations")

    invitation_email = _normalize_invitation_email(request.email)
    if invitation_email != _normalize_invitation_email(invitation.email):
        duplicate_query = select(TeamInvitation.id).where(
            func.lower(TeamInvitation.email) == invitation_email,
            TeamInvitation.status.in_(["pending", "accepted"]),
            TeamInvitation.id != invitation.id,
        )
        if _is_org_admin(admin):
            duplicate_query = duplicate_query.where(
                TeamInvitation.organization_id == admin.organization_id
            )
        if await db.scalar(duplicate_query):
            raise HTTPException(status_code=400, detail="User already invited or registered")

        existing_user_query = select(AdminUser.id).where(
            func.lower(AdminUser.email) == invitation_email
        )
        if await db.scalar(existing_user_query):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account already exists for this email. Ask the user to sign in.",
            )

    # Update permissions
    permissions = _application_permissions(role_name, request.permissions)

    invitation.email = invitation_email
    invitation.role = role_name
    invitation.permissions = permissions
    invitation.notes = request.notes

    await db.commit()
    await db.refresh(invitation)

    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "status": invitation.status,
        "permissions": invitation.permissions,
    }


@router.delete("/invitations/{invitation_id}")
async def revoke_invitation(
    invitation_id: int,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a pending invitation"""
    admin_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin = admin_res.scalar_one_or_none()

    if not _can_manage_team(admin, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    inv_res = await db.execute(
        select(TeamInvitation).where(TeamInvitation.id == invitation_id)
    )
    invitation = inv_res.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if _is_org_admin(admin) and invitation.organization_id != admin.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized for this invitation")

    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending invitations can be revoked")

    invitation.status = "revoked"
    await db.commit()

    logger.info(f"Invitation {invitation_id} revoked by {current_user.id}")

    return {"status": "revoked"}


@router.get("/roles")
async def list_roles(
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all available roles"""
    admin_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin = admin_res.scalar_one_or_none()

    if not _can_manage_team(admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Get custom roles from database
    result = await db.execute(select(AdminRole))
    custom_roles = result.scalars().all()

    builtin_roles = PREDEFINED_ROLES.items()
    if _is_org_admin(admin):
        builtin_roles = ((name, cfg) for name, cfg in builtin_roles if name not in {"super_admin", "owner"})

    # Return predefined + custom roles
    return {
        "roles": [
            {
                "name": name,
                "description": config["description"],
                "permissions": config["permissions"],
                "is_builtin": True,
            }
            for name, config in builtin_roles
        ] + [
            {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": role.permissions,
                "is_builtin": False,
            }
            for role in custom_roles
        ]
    }


@router.post("/roles")
async def create_custom_role(
    request: CreateRoleRequest,
    current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom role"""
    admin_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin = admin_res.scalar_one_or_none()

    if not admin or not admin.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Check if role exists
    existing = await db.execute(
        select(AdminRole).where(AdminRole.name == request.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role already exists")

    role = AdminRole(
        name=request.name,
        description=request.description,
        permissions=request.permissions,
        is_builtin=False,
    )

    db.add(role)
    await db.commit()
    await db.refresh(role)

    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "permissions": role.permissions,
        "is_builtin": False,
    }


@router.get("/members")
async def list_team_members(
    include_inactive: bool = False,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List team members. Super admins may include inactive accounts."""
    admin_scope_res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(current_user.id))
    )
    admin_scope = admin_scope_res.scalar_one_or_none()

    if not admin_scope or not admin_scope.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")

    query = select(AdminUser)
    if not include_inactive:
        query = query.where(AdminUser.is_active == True)

    admin_res = await db.execute(query)
    admins = admin_res.scalars().all()

    return {
        "members": [
            {
                "id": admin.id,
                "name": admin.name or admin.telegram_username,
                "email": admin.email,
                "telegram_id": admin.telegram_id,
                "role": admin.role or ("super_admin" if admin.is_super_admin else "admin"),
                "permissions": admin.team_permissions or {},
                "organization_id": admin.organization_id,
                "organization_name": admin.organization_name,
                "joined_at": serialize_utc_datetime(admin.created_at),
                "is_active": admin.is_active,
                "service_fee_percent": float(admin.service_fee_percent or 0.0),
                "vip_gold": bool(admin.vip_gold),
                "added_by": admin.added_by,
            }
            for admin in admins
        ]
    }


@router.get("/vip-status")
async def get_vip_status(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    from services.downline import DownlineService
    own_vip_gold = bool(admin and admin.vip_gold)
    inherited_vip_gold = await DownlineService(db).has_vip_gold_upline(str(current_user.id))
    return {
        "vip_gold": own_vip_gold,
        "vip_gold_upline": inherited_vip_gold,
        "wallet_minimums_exempt": own_vip_gold or inherited_vip_gold,
    }


@router.patch("/members/{user_id}/vip-gold")
async def set_vip_gold(
    user_id: str,
    body: dict,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == user_id))
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    value = body.get("vip_gold")
    if not isinstance(value, bool):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="vip_gold must be true or false")
    admin.vip_gold = value
    await db.commit()
    return {"success": True, "user_id": admin.telegram_id, "vip_gold": admin.vip_gold}


@router.get("/invitations/{token}")
async def preview_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """Validate an invitation without consuming it."""
    invitation = await db.scalar(
        select(TeamInvitation).where(TeamInvitation.invitation_token == token)
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.status == "revoked":
        raise HTTPException(status_code=410, detail="This invitation has been revoked")
    if invitation.status == "accepted":
        existing = await db.scalar(
            select(AdminUser).where(AdminUser.email.ilike(invitation.email))
        )
        if existing:
            raise HTTPException(status_code=409, detail="Invitation already completed")
    if _is_invitation_expired(invitation.expires_at):
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(status_code=410, detail="Invitation has expired")
    return {
        "success": True,
        "invitation": {
            "id": invitation.id,
            "email": invitation.email,
            "role": invitation.role,
            "organization_name": invitation.organization_name,
        },
    }


@router.post("/invitations/accept/{token}")
async def accept_invitation(
    token: str,
    request: CompleteInvitationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create the invited team account after the invitee chooses a password."""
    inv_res = await db.execute(
        select(TeamInvitation)
        .where(TeamInvitation.invitation_token == token)
        .with_for_update()
    )
    invitation = inv_res.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")

    if invitation.status == "revoked":
        raise HTTPException(status_code=410, detail="This invitation has been revoked")

    now = datetime.now(timezone.utc)
    if _is_invitation_expired(invitation.expires_at, now):
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(status_code=410, detail="Invitation has expired")

    password = request.password.strip()
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    invitation_email = _normalize_invitation_email(invitation.email)
    existing = await db.scalar(
        select(AdminUser).where(func.lower(AdminUser.email) == invitation_email)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email. Please sign in.",
        )
    # Invitations accepted by the previous link-only flow can still finish
    # account creation once, as long as no account was created yet.

    permissions = get_role_permissions_by_name(invitation.role).model_dump()
    telegram_id = f"invite-{secrets.token_urlsafe(18)}"
    admin_user = AdminUser(
        telegram_id=telegram_id,
        email=invitation_email,
        name=(request.full_name or invitation.email.split("@", 1)[0]).strip(),
        role=invitation.role,
        team_permissions=permissions,
        organization_id=invitation.organization_id,
        organization_name=invitation.organization_name,
        password_hash=hash_password(password),
        must_change_password=False,
        is_active=True,
        is_super_admin=bool(permissions.get("is_super_admin")),
        can_manage_payments=bool(permissions.get("can_manage_payments")),
        can_manage_disbursements=bool(permissions.get("can_manage_disbursements")),
        can_view_reports=bool(permissions.get("can_view_reports")),
        can_manage_wallet=bool(permissions.get("can_manage_wallet")),
        can_manage_transactions=bool(permissions.get("can_manage_transactions")),
        can_manage_bot=bool(permissions.get("can_manage_bot")),
        can_approve_topups=bool(permissions.get("can_approve_topups")),
        can_manage_team=bool(permissions.get("can_manage_team")),
        can_credit_wallet=bool(permissions.get("can_credit_wallet")),
        can_debit_wallet=bool(permissions.get("can_debit_wallet")),
        can_freeze_wallet=bool(permissions.get("can_freeze_wallet")),
        can_unfreeze_wallet=bool(permissions.get("can_unfreeze_wallet")),
    )
    db.add(admin_user)
    invitation.status = "accepted"
    invitation.accepted_at = now
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        logger.warning("Invitation %s acceptance conflicted with another account creation", invitation.id)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invitation was accepted already. Please sign in or request a new invitation.",
        ) from exc
    await db.refresh(admin_user)

    logger.info("Invitation %s completed by %s", invitation.id, invitation.email)

    return {
        "success": True,
        "message": "Account created successfully. You can now sign in.",
        "invitation": {
            "id": invitation.id,
            "email": invitation.email,
            "role": invitation.role,
            "permissions": invitation.permissions,
            "organization_id": invitation.organization_id,
            "organization_name": invitation.organization_name,
            "accepted_at": serialize_utc_datetime(invitation.accepted_at),
        },
    }
