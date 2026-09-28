import logging
import os
import time
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from core.auth import create_access_token
from core.config import settings
from core.database import db_manager
from core.roles import PredefinedRoleEnum, get_role_permissions_by_name
from models.auth import OIDCState, User
from models.admin_users import AdminUser
from schemas.auth import UserPermissions
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


def _get_platform_organization() -> tuple[str, str]:
    return (
        getattr(settings, "platform_organization_id", "swiftpay-ph").strip() or "swiftpay-ph",
        getattr(settings, "platform_organization_name", "SwiftPay Philippines").strip() or "SwiftPay Philippines",
    )


def get_admin_user_permissions(admin_record: AdminUser) -> UserPermissions:
    """Build effective permissions from the current persisted admin assignment."""
    platform_org_id, _ = _get_platform_organization()
    is_platform_owner = admin_record.organization_id == platform_org_id
    role_name = (admin_record.role or "").strip().lower()
    builtin_roles = {role.value for role in PredefinedRoleEnum}
    if role_name in builtin_roles | {"editor", "super_admin", "approver"}:
        permissions = get_role_permissions_by_name(role_name).model_dump()
        if role_name == "owner" and not is_platform_owner:
            permissions["is_super_admin"] = False
        return UserPermissions(**permissions)

    if isinstance(admin_record.team_permissions, dict):
        return UserPermissions(
            **{
                field: bool(admin_record.team_permissions.get(field, False))
                for field in UserPermissions.model_fields
            }
        )

    return UserPermissions(
        is_super_admin=bool(admin_record.is_super_admin)
        and (role_name != "owner" or is_platform_owner),
        can_manage_payments=bool(admin_record.can_manage_payments),
        can_manage_disbursements=bool(admin_record.can_manage_disbursements),
        can_view_reports=bool(admin_record.can_view_reports),
        can_manage_wallet=bool(admin_record.can_manage_wallet),
        can_manage_transactions=bool(admin_record.can_manage_transactions),
        can_manage_bot=bool(admin_record.can_manage_bot),
        can_approve_topups=bool(admin_record.can_approve_topups),
        can_manage_team=bool(admin_record.can_manage_team),
        can_credit_wallet=bool(admin_record.can_credit_wallet),
        can_debit_wallet=bool(admin_record.can_debit_wallet),
        can_freeze_wallet=bool(admin_record.can_freeze_wallet),
        can_unfreeze_wallet=bool(admin_record.can_unfreeze_wallet),
    )


def normalize_organization_owner_scope(admin_record: AdminUser) -> bool:
    """Keep business owners scoped to their organization, not the platform."""
    platform_org_id, _ = _get_platform_organization()
    if (
        admin_record.role != "owner"
        or not admin_record.organization_id
        or admin_record.organization_id == platform_org_id
        or not admin_record.is_super_admin
    ):
        return False

    admin_record.is_super_admin = False
    if isinstance(admin_record.team_permissions, dict):
        admin_record.team_permissions = {
            **admin_record.team_permissions,
            "is_super_admin": False,
        }
    return True


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_user(self, platform_sub: str, email: str, name: Optional[str] = None) -> User:
        """Get existing user or create new one."""
        start_time = time.time()
        logger.debug(f"[DB_OP] Starting get_or_create_user - platform_sub: {platform_sub}")
        # Try to find existing user
        result = await self.db.execute(select(User).where(User.id == platform_sub))
        user = result.scalar_one_or_none()
        logger.debug(f"[DB_OP] User lookup completed in {time.time() - start_time:.4f}s - found: {user is not None}")

        if user:
            # Update user info if needed
            user.email = email
            user.name = name
            user.last_login = datetime.now(timezone.utc)
        else:
            # Create new user
            user = User(id=platform_sub, email=email, name=name, last_login=datetime.now(timezone.utc))
            self.db.add(user)

        start_time_commit = time.time()
        logger.debug("[DB_OP] Starting user commit/refresh")
        await self.db.commit()
        await self.db.refresh(user)
        logger.debug(f"[DB_OP] User commit/refresh completed in {time.time() - start_time_commit:.4f}s")
        return user

    async def issue_app_token(
        self,
        user: User,
        permissions: Optional[UserPermissions] = None,
        organization_id: Optional[str] = None,
        organization_name: Optional[str] = None,
        store_name: Optional[str] = None,
        store_logo_url: Optional[str] = None,
        permanent_link_slug: Optional[str] = None,
        settlement_data: Optional[Dict[str, Any]] = None,
        must_change_password: bool = False,
    ) -> Tuple[str, datetime, Dict[str, Any]]:
        """Generate application JWT token for the authenticated user."""
        try:
            expires_minutes = int(getattr(settings, "jwt_expire_minutes", 60))
        except (TypeError, ValueError):
            logger.warning("Invalid JWT_EXPIRE_MINUTES value; fallback to 60 minutes")
            expires_minutes = 60
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

        claims: Dict[str, Any] = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
        }

        if user.name:
            claims["name"] = user.name
        if user.last_login:
            claims["last_login"] = user.last_login.isoformat()
        if organization_id:
            claims["organization_id"] = organization_id
        if organization_name:
            claims["organization_name"] = organization_name
        if store_name:
            claims["store_name"] = store_name
        if store_logo_url:
            claims["store_logo_url"] = store_logo_url
        if permanent_link_slug:
            claims["permanent_link_slug"] = permanent_link_slug
        if permissions:
            claims["permissions"] = permissions.model_dump()
        claims["must_change_password"] = bool(must_change_password)
        if settlement_data:
            claims.update(settlement_data)
        token = create_access_token(claims, expires_minutes=expires_minutes)

        return token, expires_at, claims

    async def store_oidc_state(self, state: str, nonce: str, code_verifier: str):
        """Store OIDC state in database."""
        # Clean up expired states first
        await self.db.execute(delete(OIDCState).where(OIDCState.expires_at < datetime.now(timezone.utc)))

        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)  # 10 minute expiry

        oidc_state = OIDCState(state=state, nonce=nonce, code_verifier=code_verifier, expires_at=expires_at)

        self.db.add(oidc_state)
        await self.db.commit()

    async def get_and_delete_oidc_state(self, state: str) -> Optional[dict]:
        """Get and delete OIDC state from database."""
        # Clean up expired states first
        await self.db.execute(delete(OIDCState).where(OIDCState.expires_at < datetime.now(timezone.utc)))

        # Find and validate state
        result = await self.db.execute(select(OIDCState).where(OIDCState.state == state))
        oidc_state = result.scalar_one_or_none()

        if not oidc_state:
            return None

        # Extract data before deleting
        state_data = {"nonce": oidc_state.nonce, "code_verifier": oidc_state.code_verifier}

        # Delete the used state (one-time use)
        await self.db.delete(oidc_state)
        await self.db.commit()

        return state_data

    async def verify_pin(self, user_id: str, pin: str) -> bool:
        """Verify the user's PIN. Returns True if valid or if user has no PIN set."""
        if not pin:
            # If PIN is required but not provided, it should fail elsewhere.
            # Here we just verify against the DB.
            pass

        res = await self.db.execute(select(AdminUser).where(AdminUser.telegram_id == user_id))
        admin = res.scalar_one_or_none()

        if not admin or not admin.pin_hash:
            return True # No PIN set, bypass check

        # Check lock
        pin_locked_until = admin.pin_locked_until
        if pin_locked_until is not None and pin_locked_until.tzinfo is None:
            pin_locked_until = pin_locked_until.replace(tzinfo=timezone.utc)
        if pin_locked_until and datetime.now(timezone.utc) < pin_locked_until:
            return False

        hashed = hashlib.sha256(f"{admin.pin_salt}:{pin}".encode()).hexdigest()
        if hashed == admin.pin_hash:
            # Reset failed attempts
            admin.pin_failed_attempts = 0
            admin.pin_locked_until = None
            await self.db.commit()
            return True
        else:
            # Increment failed attempts
            admin.pin_failed_attempts += 1
            if admin.pin_failed_attempts >= 3:
                admin.pin_locked_until = datetime.now(timezone.utc) + timedelta(minutes=5)
            await self.db.commit()
            return False


async def initialize_admin_user():
    """Initialize admin user if not exists"""
    if "MGX_IGNORE_INIT_ADMIN" in os.environ:
        logger.info("Ignore initialize admin")
        return

    from services.database import initialize_database

    # Ensure database is initialized first
    await initialize_database()

    if not db_manager.async_session_maker:
        logger.warning("Database not initialized, skipping admin user initialization")
        return

    admin_user_id = getattr(settings, "admin_user_id", "")
    admin_user_email = getattr(settings, "admin_user_email", "")

    if not admin_user_id or not admin_user_email:
        logger.warning("Admin user ID or email not configured, skipping admin initialization")
        return

    async with db_manager.async_session_maker() as db:
        # Check if admin user already exists using the stable ID
        result = await db.execute(select(User).where(User.id == admin_user_id))
        user = result.scalar_one_or_none()

        # Handle AdminUser (permissions) logic
        from models.admin_users import AdminUser
        res_admin = await db.execute(select(AdminUser).where(AdminUser.telegram_id == admin_user_id))
        admin_entry = res_admin.scalar_one_or_none()

        if user:
            # Update existing user to admin if not already
            if user.role != "admin":
                user.role = "admin"
            user.id = admin_user_id # Ensure ID is consistent
            await db.commit()
            logger.debug(f"Updated user {admin_user_email} to admin role")
        else:
            # Create new admin user
            user = User(id=admin_user_id, email=admin_user_email, role="admin", name="Admin User")
            db.add(user)
            await db.commit()
            logger.debug(f"Created admin user: {admin_user_id} with email: {admin_user_email}")

        # Ensure Super Admin entry exists in AdminUser table
        platform_org_id, platform_org_name = _get_platform_organization()
        if not admin_entry:
            new_admin = AdminUser(
                telegram_id=admin_user_id,
                telegram_username="alipayboss", # Initialized as @alipayboss
                name="Super Admin",
                email=admin_user_email,
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
                added_by="system",
            )
            db.add(new_admin)
            await db.commit()
            logger.info(f"Initialized super admin @alipayboss for {admin_user_email}")
        else:
            # Ensure permissions and platform organization are set correctly for the existing admin entry
            admin_entry.is_super_admin = True
            admin_entry.can_manage_payments = True
            admin_entry.can_manage_disbursements = True
            admin_entry.can_view_reports = True
            admin_entry.can_manage_wallet = True
            admin_entry.can_manage_transactions = True
            admin_entry.can_manage_bot = True
            admin_entry.can_approve_topups = True
            admin_entry.can_manage_team = True
            admin_entry.can_credit_wallet = True
            admin_entry.can_debit_wallet = True
            admin_entry.can_freeze_wallet = True
            admin_entry.can_unfreeze_wallet = True
            admin_entry.telegram_username = "alipayboss"
            admin_entry.email = admin_user_email
            admin_entry.organization_id = platform_org_id
            admin_entry.organization_name = platform_org_name
            await db.commit()
