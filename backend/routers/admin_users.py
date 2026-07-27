"""
Admin User Management Router
CRUD for managing Telegram-based admin users and their permissions.
Only super admins can add/remove/modify other admins.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
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
    test_mode: bool = True  # Sandbox (true) or Live (false)

    # Bank Information
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    telegram_id: str
    telegram_username: Optional[str] = None
    name: Optional[str] = None
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


class AdminUserUpdate(BaseModel):
    telegram_username: Optional[str] = None
    name: Optional[str] = None
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
    test_mode: Optional[bool] = None  # Toggle between sandbox and live

    # Bank Information
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None


def _require_super_admin(current_user: UserResponse):
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required to manage admin users.",
        )


# ---------- Endpoints ----------

@router.get("", response_model=List[AdminUserOut])
async def list_admin_users(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List admin users. Super admins see all; org admins see their organization only."""
    query = select(AdminUser)
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        actor_res = await db.execute(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
        actor = actor_res.scalar_one_or_none()
        if not actor or not actor.organization_id:
            raise HTTPException(status_code=403, detail="Organization admin access required.")
        if not actor.can_manage_team:
            raise HTTPException(status_code=403, detail="Team management permission required.")
        query = query.where(AdminUser.organization_id == actor.organization_id)

    res = await db.execute(query.order_by(AdminUser.id))
    return res.scalars().all()


@router.post("", response_model=AdminUserOut, status_code=201)
async def create_admin_user(
    data: AdminUserCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new admin user. Only super admins can do this."""
    _require_super_admin(current_user)

    existing = await db.execute(select(AdminUser).where(AdminUser.telegram_id == data.telegram_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Admin with this Telegram ID already exists.")

    platform_org_id, platform_org_name = _get_platform_organization()
    admin = AdminUser(
        telegram_id=data.telegram_id,
        telegram_username=data.telegram_username,
        name=data.name,
        is_active=True,
        is_super_admin=data.is_super_admin,
        can_manage_payments=data.can_manage_payments,
        can_manage_disbursements=data.can_manage_disbursements,
        can_view_reports=data.can_view_reports,
        can_manage_wallet=data.can_manage_wallet,
        can_manage_transactions=data.can_manage_transactions,
        can_manage_bot=data.can_manage_bot,
        can_approve_topups=data.can_approve_topups,
        can_manage_team=data.can_manage_team,
        organization_id=platform_org_id if data.is_super_admin else data.organization_id,
        organization_name=platform_org_name if data.is_super_admin else data.organization_name,
        added_by=current_user.id,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)

    await log_action(
        db, current_user, "create_admin",
        target_type="admin_user", target_id=data.telegram_id,
        details=f"Created admin user {data.name or data.telegram_id}",
        payload=data.model_dump()
    )
    await db.commit()

    logger.info("Admin %s added user %s", current_user.id, data.telegram_id)
    return admin


@router.patch("/{admin_id}", response_model=AdminUserOut)
async def update_admin_user(
    admin_id: int,
    data: AdminUserUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update admin user permissions or status. Only super admins can do this."""
    _require_super_admin(current_user)

    res = await db.execute(select(AdminUser).where(AdminUser.id == admin_id))
    admin = res.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")

    # Prevent removing super admin status from yourself
    if admin.telegram_id == current_user.id and data.is_super_admin is False:
        raise HTTPException(status_code=400, detail="Cannot remove your own super admin status.")

    payload_data = data.model_dump(exclude_none=True)
    if payload_data.get("is_super_admin") is True:
        platform_org_id, platform_org_name = _get_platform_organization()
        payload_data["organization_id"] = platform_org_id
        payload_data["organization_name"] = platform_org_name

    for field, value in payload_data.items():
        setattr(admin, field, value)

    await log_action(
        db, current_user, "update_admin",
        target_type="admin_user", target_id=admin.telegram_id,
        details=f"Updated permissions/status for {admin.name or admin.telegram_id}",
        payload=data.model_dump(exclude_none=True)
    )

    await db.commit()
    await db.refresh(admin)
    return admin


@router.delete("/{admin_id}", status_code=204)
async def delete_admin_user(
    admin_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an admin user. Only super admins can do this."""
    _require_super_admin(current_user)

    res = await db.execute(select(AdminUser).where(AdminUser.id == admin_id))
    admin = res.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")

    if admin.telegram_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself.")

    await log_action(
        db, current_user, "delete_admin",
        target_type="admin_user", target_id=admin.telegram_id,
        details=f"Deleted admin user {admin.name or admin.telegram_id}"
    )

    await db.delete(admin)
    await db.commit()


class TestModeResponse(BaseModel):
    test_mode: bool
    model_config = ConfigDict(from_attributes=True)


class TestModeUpdate(BaseModel):
    test_mode: bool


@router.get("/me/test-mode", response_model=TestModeResponse)
async def get_my_test_mode(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's test mode setting (sandbox=true, live=false)."""
    res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == current_user.id)
    )
    admin = res.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")
    
    return TestModeResponse(test_mode=admin.test_mode)


@router.patch("/me/test-mode", response_model=TestModeResponse)
async def update_my_test_mode(
    data: TestModeUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's test mode setting. Merchants can switch between sandbox and live."""
    res = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == current_user.id)
    )
    admin = res.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found.")
    
    admin.test_mode = data.test_mode
    
    await log_action(
        db, current_user, "update_test_mode",
        target_type="admin_user", target_id=admin.telegram_id,
        details=f"Switched to {'sandbox (test mode)' if data.test_mode else 'live mode'}",
        payload=data.model_dump()
    )
    
    await db.commit()
    await db.refresh(admin)
    return TestModeResponse(test_mode=admin.test_mode)
