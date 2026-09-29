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
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import hash_password
from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.api_configs import Api_configs
from models.auth import User
from models.merchant_api_config import MerchantApiConfig
from schemas.auth import UserResponse
from services.auth import _get_platform_organization
from core.roles import get_role_permissions_by_name, scope_permissions_to_organization
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
    role: Optional[str] = None
    can_manage_payments: bool
    can_manage_disbursements: bool
    can_view_reports: bool
    can_manage_wallet: bool
    can_manage_transactions: bool
    can_manage_bot: bool
    can_approve_topups: bool
    can_manage_team: bool
    can_credit_wallet: bool
    can_debit_wallet: bool
    can_freeze_wallet: bool
    can_unfreeze_wallet: bool
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
    payment_channels: Optional[dict[str, list[str]]] = None
    toss_virtual_account_status: str = "not_started"
    toss_virtual_account_application: Optional[dict] = None
    krw_benefits_unlocked: bool = False
    krw_benefits_unlocked_at: Optional[datetime] = None
    krw_benefits_unlock_source: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: str = "admin"
    is_super_admin: bool = False
    can_manage_payments: bool = False
    can_manage_disbursements: bool = False
    can_view_reports: bool = False
    can_manage_wallet: bool = False
    can_manage_transactions: bool = False
    can_manage_bot: bool = False
    can_approve_topups: bool = False
    can_manage_team: bool = False
    can_credit_wallet: bool = False
    can_debit_wallet: bool = False
    can_freeze_wallet: bool = False
    can_unfreeze_wallet: bool = False
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    service_fee_percent: float = Field(default=0.0, ge=0, le=100)
    collection_fee_percent: float = Field(default=0.0, ge=0, le=100)
    withdrawal_fee_percent: float = Field(default=0.0, ge=0, le=100)
    withdrawal_fee_php: float = Field(default=15.0, ge=0)
    withdrawal_fee_krw: float = Field(default=1500.0, ge=0)
    withdrawal_fee_usdt: float = Field(default=1.0, ge=0)
    withdrawal_fee_cny: float = Field(default=10.0, ge=0)
    withdrawal_fee_usd: float = Field(default=1.0, ge=0)


class AdminUserUpdate(BaseModel):
    telegram_username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
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
    can_credit_wallet: Optional[bool] = None
    can_debit_wallet: Optional[bool] = None
    can_freeze_wallet: Optional[bool] = None
    can_unfreeze_wallet: Optional[bool] = None
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


ROLE_PERMISSION_FIELDS = (
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
)

SUPER_ADMIN_PERMISSION_FIELDS = tuple(
    field for field in ROLE_PERMISSION_FIELDS if field != "is_super_admin"
)


def _apply_role_permissions(admin: AdminUser, role_name: str) -> None:
    permissions = get_role_permissions_by_name(role_name)
    platform_org_id, _ = _get_platform_organization()
    values = scope_permissions_to_organization(
        permissions.model_dump(), admin.organization_id, platform_org_id
    )
    admin.role = "operator" if role_name == "editor" else role_name
    for field in ROLE_PERMISSION_FIELDS:
        setattr(admin, field, values[field])
    admin.team_permissions = values


def _custom_permission_values(values: dict) -> dict:
    permissions = {
        field: bool(values.get(field, False))
        for field in SUPER_ADMIN_PERMISSION_FIELDS
    }
    permissions["is_super_admin"] = False
    return permissions


def _apply_custom_permission_values(admin: AdminUser, values: dict) -> None:
    platform_org_id, _ = _get_platform_organization()
    scoped_values = scope_permissions_to_organization(
        _custom_permission_values(values),
        admin.organization_id,
        platform_org_id,
    )
    for field in ROLE_PERMISSION_FIELDS:
        setattr(admin, field, scoped_values[field])
    admin.team_permissions = scoped_values


def _apply_super_admin_permissions(values: dict) -> dict:
    """Preserve the legacy helper for callers outside the role assignment API."""
    if values.get("is_super_admin") is True:
        values["role"] = "super_admin"
        for field in SUPER_ADMIN_PERMISSION_FIELDS:
            values[field] = True
    elif values.get("is_super_admin") is False and values.get("role") in {"super_admin", "owner"}:
        values["role"] = "admin"
    return values


def _require_super_admin(current_user: UserResponse):
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
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
    supplied_permission_fields = set(data.model_fields_set).intersection(ROLE_PERMISSION_FIELDS)
    role_name = data.role.strip().lower()
    if supplied_permission_fields and role_name != "custom":
        # Legacy clients still send explicit permission flags and/or the legacy
        # ``is_super_admin`` checkbox. Accept that payload so older admin
        # onboarding flows keep working while the newer role model remains in place.
        pass
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
    if role_name not in {"owner", "admin", "manager", "editor", "operator", "viewer", "developer", "super_admin", "custom"}:
        raise HTTPException(status_code=400, detail="Invalid role.")
    if role_name == "custom":
        permission_values = _custom_permission_values(data.model_dump())
    else:
        permission_values = get_role_permissions_by_name(role_name).model_dump()
        if role_name == "owner":
            permission_values["is_super_admin"] = False
        if supplied_permission_fields:
            for field in SUPER_ADMIN_PERMISSION_FIELDS:
                if field in data.model_fields_set:
                    permission_values[field] = bool(getattr(data, field))
            if "is_super_admin" in data.model_fields_set:
                permission_values["is_super_admin"] = bool(data.is_super_admin)
    permission_values["role"] = role_name
    is_super_admin = permission_values["is_super_admin"]
    if is_super_admin:
        organization_id, organization_name = platform_org_id, platform_org_name
    else:
        organization_id = f"merchant-{telegram_id}"
        organization_name = (data.organization_name or data.name).strip()
    permission_values = scope_permissions_to_organization(
        permission_values, organization_id, platform_org_id
    )
    is_super_admin = permission_values["is_super_admin"]

    admin = AdminUser(
        telegram_id=telegram_id,
        telegram_username=data.telegram_username,
        name=data.name,
        email=normalized_email,
        password_hash=hash_password(password_value) if password_value else None,
        is_active=True,
        is_super_admin=is_super_admin,
        role=permission_values["role"],
        can_manage_payments=permission_values["can_manage_payments"],
        can_manage_disbursements=permission_values["can_manage_disbursements"],
        can_view_reports=permission_values["can_view_reports"],
        can_manage_wallet=permission_values["can_manage_wallet"],
        can_manage_transactions=permission_values["can_manage_transactions"],
        can_manage_bot=permission_values["can_manage_bot"],
        can_approve_topups=permission_values["can_approve_topups"],
        can_manage_team=permission_values["can_manage_team"],
        can_credit_wallet=permission_values["can_credit_wallet"],
        can_debit_wallet=permission_values["can_debit_wallet"],
        can_freeze_wallet=permission_values["can_freeze_wallet"],
        can_unfreeze_wallet=permission_values["can_unfreeze_wallet"],
        team_permissions=permission_values,
        organization_id=organization_id,
        organization_name=organization_name,
        added_by=current_user.id,
        usdt_wallet_address=normalized_address,
        service_fee_percent=float(data.service_fee_percent or 0.0),
        collection_fee_percent=float(data.collection_fee_percent or 0.0),
        withdrawal_fee_percent=float(data.withdrawal_fee_percent or 0.0),
        withdrawal_fee_php=float(data.withdrawal_fee_php),
        withdrawal_fee_krw=float(data.withdrawal_fee_krw),
        withdrawal_fee_usdt=float(data.withdrawal_fee_usdt),
        withdrawal_fee_cny=float(data.withdrawal_fee_cny),
        withdrawal_fee_usd=float(data.withdrawal_fee_usd),
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
    payload_data = data.model_dump(exclude_none=True)
    supplied_permission_fields = set(payload_data).intersection(ROLE_PERMISSION_FIELDS)
    requested_role = payload_data.pop("role", None)
    target_role = (requested_role or admin.role or "").strip().lower()
    if supplied_permission_fields and target_role != "custom":
        # Preserve backward compatibility with older client payloads that send
        # permission flags and the legacy ``is_super_admin`` field alongside a
        # predefined role.
        pass
    if requested_role is not None:
        requested_role = requested_role.strip().lower()
        if requested_role not in {"owner", "admin", "manager", "editor", "operator", "viewer", "developer", "super_admin", "custom"}:
            raise HTTPException(status_code=400, detail="Invalid role.")
        platform_org_id, _ = _get_platform_organization()
        if requested_role == "super_admin" and admin.organization_id != platform_org_id:
            raise HTTPException(status_code=400, detail="Super admin role can only be assigned within the platform organization.")
        if admin.telegram_id == current_user.id and requested_role != "owner":
            raise HTTPException(status_code=400, detail="Cannot change your own platform role.")
    if "email" in payload_data:
        payload_data["email"] = _normalize_email(payload_data["email"])
        if payload_data["email"]:
            await _ensure_unique_email(db, payload_data["email"], exclude_admin_id=admin.id)
        login_user = await db.get(User, admin.telegram_id)
        if login_user:
            login_user.email = payload_data["email"] or login_user.email
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
    custom_permission_values = None
    if target_role == "custom":
        permission_input = {
            field: payload_data.pop(field, getattr(admin, field, False))
            for field in SUPER_ADMIN_PERMISSION_FIELDS
        }
        custom_permission_values = _custom_permission_values(permission_input)
    elif supplied_permission_fields:
        permission_input = {
            field: payload_data.pop(field, getattr(admin, field, False))
            for field in SUPER_ADMIN_PERMISSION_FIELDS
            if field in payload_data or field in data.model_fields_set
        }
        for field in SUPER_ADMIN_PERMISSION_FIELDS:
            if field in data.model_fields_set:
                permission_input[field] = bool(getattr(data, field))
        if "is_super_admin" in data.model_fields_set:
            permission_input["is_super_admin"] = bool(data.is_super_admin)
        custom_permission_values = _custom_permission_values(permission_input)
    for field, value in payload_data.items():
        if field in {
            "service_fee_percent",
            "collection_fee_percent",
            "withdrawal_fee_percent",
            "withdrawal_fee_php",
            "withdrawal_fee_krw",
            "withdrawal_fee_usdt",
            "withdrawal_fee_cny",
            "withdrawal_fee_usd",
        }:
            try:
                value = float(value)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail=f"{field} must be a valid number.")
            if value < 0 or (field.endswith("_percent") and value > 100):
                raise HTTPException(status_code=400, detail=f"{field} must be between 0 and 100 percent.")
            if field.endswith("_percent"):
                value = round(value, 2)
            else:
                value = round(value, 2)
        setattr(admin, field, value)
    if requested_role is not None:
        admin.role = requested_role
    if custom_permission_values is not None:
        _apply_custom_permission_values(admin, custom_permission_values)
    elif requested_role is not None:
        _apply_role_permissions(admin, requested_role)
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
