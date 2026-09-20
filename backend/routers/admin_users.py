"""
Admin User Management Router
CRUD for managing Telegram-based admin users and their permissions.
Only the platform super admin can add/remove/modify other admins.
Newly-created super admins are intentionally not granted admin-user management.
"""
import logging
import secrets
import re
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import hash_password
from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from schemas.auth import UserResponse
from services.auth import _get_platform_organization
from utils.audit import log_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin-users", tags=["admin-users"])


# ---------- Schemas ----------

class AdminUserOut(BaseModel):
    id: int
    telegram_id: str
    telegram_username: Optional[str] = None
    name: Optional[str] = None
    is_active: bool
    is_super_admin: bool
    can_manage_payments: bool
    can_manage_disbursements: bool
    can_view_reports: bool
    can_manage_wallet: bool
    can_manage_transactions: bool
    can_manage_bot: bool
    can_approve_topups: bool
    can_manage_team: bool
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    added_by: Optional[str] = None
    test_mode: bool = True
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_super_admin: bool = False
    can_manage_payments: bool = False
    can_manage_disbursements: bool = False
    can_view_reports: bool = False
    can_manage_wallet: bool = False
    can_manage_transactions: bool = False
    can_manage_bot: bool = False
    can_approve_topups: bool = False
    can_manage_team: bool = False
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    usdt_wallet_address: Optional[str] = None


class AdminUserUpdate(BaseModel):
    telegram_username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_super_admin: Optional[bool] = None
    can_manage_payments: Optional[bool] = None
    can_manage_disbursements: Optional[bool] = None
    can_view_reports: Optional[bool] = None
    can_manage_wallet: Optional[bool] = None
    can_manage_transactions: Optional[bool] = None
    can_manage_bot: Optional[bool] = None
    can_approve_topups: Optional[bool] = None
    can_manage_team: Optional[bool] = None
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    test_mode: Optional[bool] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None


def _require_super_admin(current_user: UserResponse):
    perms = current_user.permissions
    # is_super_admin alone is deliberately insufficient. The platform/root
    # super admin retains can_manage_team; newly-created super admins do not.
    if not perms or not perms.is_super_admin or not perms.can_manage_team:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform super admin access required to manage admin users.",
        )


def _normalize_email(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    email = str(value).strip()
    if not email:
        return None
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address.")
    return email.lower()


def _normalize_usdt_wallet_address(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    address = value.strip()
    if not address:
        return None
    if not (address.startswith("T") and len(address) == 34):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid USDT wallet address. Must start with 'T' and be exactly 34 characters.")
    return address


async def _ensure_unique_email(db: AsyncSession, email: str, exclude_admin_id: Optional[int] = None) -> None:
    if not email:
        return
    existing = (await db.execute(select(AdminUser).where(AdminUser.email == email))).scalar_one_or_none()
    if existing and (exclude_admin_id is None or existing.id != exclude_admin_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An admin user with this email already exists.")


async def _ensure_unique_usdt_wallet_address(db: AsyncSession, address: str, exclude_admin_id: Optional[int] = None) -> None:
    if not address:
        return
    existing = (await db.execute(select(AdminUser).where(AdminUser.usdt_wallet_address == address))).scalar_one_or_none()
    if existing and (exclude_admin_id is None or existing.id != exclude_admin_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This USDT wallet address is already assigned to another user.")


@router.get("", response_model=List[AdminUserOut])
async def list_admin_users(current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """List admin users. Super admins see all; org admins see their organization only."""
    query = select(AdminUser)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        actor = (await db.execute(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))).scalar_one_or_none()
        if not actor or not actor.organization_id:
            raise HTTPException(status_code=403, detail="Organization admin access required.")
        if not actor.can_manage_team:
            raise HTTPException(status_code=403, detail="Team management permission required.")
        query = query.where(AdminUser.organization_id == actor.organization_id)
    elif not perms.can_manage_team:
        raise HTTPException(status_code=403, detail="Platform super admin access required to manage admin users.")
    return (await db.execute(query.order_by(AdminUser.id))).scalars().all()


@router.post("", response_model=AdminUserOut, status_code=201)
async def create_admin_user(data: AdminUserCreate, current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Add an admin user. Only the platform/root super admin can do this."""
    _require_super_admin(current_user)
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    normalized_email = _normalize_email(data.email) if data.email is not None else None
    telegram_id = (data.telegram_id or f"email:{uuid.uuid4().hex}").strip()
    if (await db.execute(select(AdminUser).where(AdminUser.telegram_id == telegram_id))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Admin with this Telegram ID already exists.")
    if normalized_email:
        await _ensure_unique_email(db, normalized_email)
    password_value = data.password.strip() if data.password is not None else None
    if data.password is not None and not password_value:
        raise HTTPException(status_code=400, detail="Password cannot be empty.")
    normalized_address = _normalize_usdt_wallet_address(data.usdt_wallet_address)
    if normalized_address:
        await _ensure_unique_usdt_wallet_address(db, normalized_address)

    platform_org_id, platform_org_name = _get_platform_organization()
    is_super_admin = bool(data.is_super_admin)
    if is_super_admin:
        organization_id, organization_name = platform_org_id, platform_org_name
    else:
        organization_id = f"merchant-{telegram_id}"
        organization_name = (data.organization_name or data.name).strip()

    admin = AdminUser(
        telegram_id=telegram_id, telegram_username=data.telegram_username, name=data.name,
        email=normalized_email, password_hash=hash_password(password_value) if password_value else None,
        is_active=True, is_super_admin=is_super_admin,
        can_manage_payments=data.can_manage_payments, can_manage_disbursements=data.can_manage_disbursements,
        can_view_reports=data.can_view_reports, can_manage_wallet=data.can_manage_wallet,
        can_manage_transactions=data.can_manage_transactions, can_manage_bot=data.can_manage_bot,
        can_approve_topups=data.can_approve_topups,
        # A newly-created super admin must not inherit platform admin-user management.
        can_manage_team=False if is_super_admin else data.can_manage_team,
        organization_id=organization_id, organization_name=organization_name,
        added_by=current_user.id, usdt_wallet_address=normalized_address,
    )
    db.add(admin)
    db.add(MerchantApiConfig(
        organization_id=organization_id, user_id=telegram_id, store_name=organization_name,
        permanent_link_slug=f"{organization_id.lower().replace(':', '-')}-{secrets.token_hex(3).lower()}",
        store_slug="3", collection_currency="PHP",
    ))
    await db.commit()
    await db.refresh(admin)
    await log_action(db, current_user, "create_admin", target_type="admin_user", target_id=telegram_id,
                     details=f"Created admin user {data.name or telegram_id}", payload=data.model_dump())
    await db.commit()
    logger.info("Admin %s added user %s", current_user.id, data.telegram_id)
    return admin


@router.patch("/{admin_id}", response_model=AdminUserOut)
async def update_admin_user(admin_id: int, data: AdminUserUpdate, current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update an admin user. Only the platform/root super admin can do this."""
    _require_super_admin(current_user)
    admin = (await db.execute(select(AdminUser).where(AdminUser.id == admin_id))).scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")
    if admin.telegram_id == current_user.id and data.is_super_admin is False:
        raise HTTPException(status_code=400, detail="Cannot remove your own super admin status.")
    payload_data = data.model_dump(exclude_none=True)
    if "email" in payload_data:
        payload_data["email"] = _normalize_email(payload_data["email"])
        if payload_data["email"]:
            await _ensure_unique_email(db, payload_data["email"], exclude_admin_id=admin.id)
    if "password" in payload_data:
        password_value = str(payload_data["password"]).strip()
        if not password_value:
            raise HTTPException(status_code=400, detail="Password cannot be empty.")
        payload_data["password_hash"] = hash_password(password_value)
        del payload_data["password"]
    if "usdt_wallet_address" in payload_data:
        payload_data["usdt_wallet_address"] = _normalize_usdt_wallet_address(payload_data["usdt_wallet_address"])
        if payload_data["usdt_wallet_address"]:
            await _ensure_unique_usdt_wallet_address(db, payload_data["usdt_wallet_address"], exclude_admin_id=admin.id)
    if payload_data.get("is_super_admin") is True:
        platform_org_id, platform_org_name = _get_platform_organization()
        payload_data["organization_id"], payload_data["organization_name"] = platform_org_id, platform_org_name
    for field, value in payload_data.items():
        setattr(admin, field, value)
    await log_action(db, current_user, "update_admin", target_type="admin_user", target_id=admin.telegram_id,
                     details=f"Updated permissions/status for {admin.name or admin.telegram_id}", payload=data.model_dump(exclude_none=True))
    await db.commit()
    await db.refresh(admin)
    return admin


@router.delete("/{admin_id}", status_code=204)
async def delete_admin_user(admin_id: int, current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Deactivate an admin user without deleting its wallet or history."""
    _require_super_admin(current_user)
    admin = (await db.execute(select(AdminUser).where(AdminUser.id == admin_id))).scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")
    if admin.telegram_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself.")
    await log_action(db, current_user, "delete_admin", target_type="admin_user", target_id=admin.telegram_id,
                     details=f"Deactivated admin user {admin.name or admin.telegram_id}")
    admin.is_active = False
    await db.commit()


class TestModeResponse(BaseModel):
    test_mode: bool
    model_config = ConfigDict(from_attributes=True)


class TestModeUpdate(BaseModel):
    test_mode: bool


@router.get("/me/test-mode", response_model=TestModeResponse)
async def get_my_test_mode(current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    admin = (await db.execute(select(AdminUser).where(AdminUser.telegram_id == current_user.id))).scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")
    return TestModeResponse(test_mode=admin.test_mode)


@router.patch("/me/test-mode", response_model=TestModeResponse)
async def update_my_test_mode(data: TestModeUpdate, current_user: UserResponse = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    admin = (await db.execute(select(AdminUser).where(AdminUser.telegram_id == current_user.id))).scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")
    admin.test_mode = data.test_mode
    await log_action(db, current_user, "update_test_mode", target_type="admin_user", target_id=admin.telegram_id,
                     details=f"Switched to {'sandbox (test mode)' if data.test_mode else 'live mode'}", payload=data.model_dump())
    await db.commit()
    await db.refresh(admin)
    return TestModeResponse(test_mode=admin.test_mode)
