from datetime import datetime
from typing import List, Optional

from core.database import get_db
from dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.auth import User
from models.admin_users import AdminUser
from pydantic import BaseModel, ConfigDict
from routers.admin_users import _ensure_unique_usdt_wallet_address, _normalize_usdt_wallet_address
from schemas.auth import UserResponse
from services.user import UserService
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None


@router.get("/profile", response_model=UserResponse)
async def get_profile(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    profile = await UserService.get_user_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return profile


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile"""
    profile = await UserService.update_user_profile(db, current_user.id, profile_data.name)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return profile


# ── User Management (super admin only) ───────────────────────────────────────


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserRoleUpdate(BaseModel):
    role: str  # "user" | "admin"


def _require_super_admin(current_user: UserResponse):
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required.",
        )


@router.get("", response_model=List[UserOut])
async def list_users(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all registered users. Super admin only."""
    _require_super_admin(current_user)
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: str,
    data: UserRoleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role. Super admin only."""
    _require_super_admin(current_user)

    if data.role not in ("user", "admin", "co_admin", "agent", "super_admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user', 'admin', 'co_admin', 'agent', or 'super_admin'.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user


class SettlementUpdateRequest(BaseModel):
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None


@router.patch("/{user_id}/settlement", response_model=UserResponse)
async def update_user_settlement(
    user_id: str,
    data: SettlementUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow a user to update their own settlement details, while super admins may update any user."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own settlement details.")

    result = await db.execute(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=404, detail="User not found.")
        user = AdminUser(
            telegram_id=str(user_id),
            telegram_username=current_user.name or user_id,
            name=current_user.name,
            email=current_user.email,
            is_active=True,
            is_super_admin=bool(current_user.permissions and current_user.permissions.is_super_admin),
            organization_id=current_user.organization_id,
            organization_name=current_user.organization_name,
            added_by=str(current_user.id),
        )
        db.add(user)

    payload_data = data.model_dump(exclude_unset=True)
    if "usdt_wallet_address" in payload_data:
        normalized = _normalize_usdt_wallet_address(payload_data["usdt_wallet_address"])
        payload_data["usdt_wallet_address"] = normalized
        if normalized:
            await _ensure_unique_usdt_wallet_address(db, normalized, exclude_admin_id=user.id)

    for field, value in payload_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.telegram_id),
        email=user.email or current_user.email,
        name=user.name or current_user.name,
        role=(user.role or current_user.role or "user"),
        organization_id=user.organization_id or current_user.organization_id,
        organization_name=user.organization_name or current_user.organization_name,
        permissions=current_user.permissions,
        bank_name=user.bank_name,
        bank_account_number=user.bank_account_number,
        bank_account_name=user.bank_account_name,
        bank_address=user.bank_address,
        usdt_wallet_address=user.usdt_wallet_address,
        settlement_type=user.settlement_type,
        settlement_currency=user.settlement_currency,
    )
