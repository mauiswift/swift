"""
Role Management Service

Service for assigning predefined roles to admin users and validating permissions.
"""

import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.admin_users import AdminUser
from core.roles import PERMISSION_KEYS, PredefinedRoleEnum, get_role_permissions, PREDEFINED_ROLES

logger = logging.getLogger(__name__)


class RolesService:
    """Service for managing user roles and permissions"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def assign_predefined_role(
        self,
        admin_id: str,
        role: PredefinedRoleEnum,
    ) -> Optional[AdminUser]:
        """
        Assign a predefined role to an admin user.
        
        This will update all permission flags on the AdminUser record to match
        the role's permission configuration.
        
        Args:
            admin_id: The admin user's ID
            role: A PredefinedRoleEnum value
            
        Returns:
            Updated AdminUser object, or None if user not found
            
        Raises:
            ValueError: If role is not a valid predefined role
        """
        try:
            # Validate role
            if role not in PREDEFINED_ROLES:
                raise ValueError(f"Unknown predefined role: {role}")
            
            # Fetch admin user
            query = select(AdminUser).where(AdminUser.id == admin_id)
            result = await self.db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                logger.warning(f"Admin user not found: {admin_id}")
                return None
            
            # Get role permissions
            permissions = get_role_permissions(role)
            
            for permission in PERMISSION_KEYS:
                setattr(admin_user, permission, getattr(permissions, permission))
            
            # Store the role name for reference
            admin_user.role = role.value
            
            await self.db.commit()
            await self.db.refresh(admin_user)
            
            logger.info(f"Assigned role '{role.value}' to admin {admin_id}")
            return admin_user
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error assigning role to admin {admin_id}: {e}")
            raise

    async def get_admin_role(self, admin_id: str) -> Optional[PredefinedRoleEnum]:
        """
        Get the predefined role assigned to an admin user.
        
        Infers the role by matching permission flags to known role definitions.
        
        Args:
            admin_id: The admin user's ID
            
        Returns:
            PredefinedRoleEnum if user has a matching predefined role, None otherwise
        """
        try:
            query = select(AdminUser).where(AdminUser.id == admin_id)
            result = await self.db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                return None
            
            # Try to match the admin's permission configuration to a predefined role
            for role, permissions in PREDEFINED_ROLES.items():
                if all(getattr(admin_user, permission, False) is permissions[permission] for permission in PERMISSION_KEYS):
                    return role
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting role for admin {admin_id}: {e}")
            return None

    async def validate_permission(
        self,
        admin_id: str,
        required_permission: str,
    ) -> bool:
        """
        Check if an admin user has a specific permission.
        
        Args:
            admin_id: The admin user's ID
            required_permission: Permission flag name (e.g., "can_manage_payments")
            
        Returns:
            True if user has the permission, False otherwise
        """
        try:
            query = select(AdminUser).where(AdminUser.id == admin_id)
            result = await self.db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                return False
            
            # Check if permission exists and is True
            return getattr(admin_user, required_permission, False) is True
            
        except Exception as e:
            logger.error(f"Error validating permission for admin {admin_id}: {e}")
            return False

    async def has_any_permission(
        self,
        admin_id: str,
        required_permissions: list[str],
    ) -> bool:
        """
        Check if an admin user has ANY of the specified permissions.
        
        Args:
            admin_id: The admin user's ID
            required_permissions: List of permission flag names
            
        Returns:
            True if user has at least one permission, False otherwise
        """
        try:
            query = select(AdminUser).where(AdminUser.id == admin_id)
            result = await self.db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                return False
            
            for permission in required_permissions:
                if getattr(admin_user, permission, False) is True:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking permissions for admin {admin_id}: {e}")
            return False

    async def has_all_permissions(
        self,
        admin_id: str,
        required_permissions: list[str],
    ) -> bool:
        """
        Check if an admin user has ALL of the specified permissions.
        
        Args:
            admin_id: The admin user's ID
            required_permissions: List of permission flag names
            
        Returns:
            True if user has all permissions, False otherwise
        """
        try:
            query = select(AdminUser).where(AdminUser.id == admin_id)
            result = await self.db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                return False
            
            for permission in required_permissions:
                if getattr(admin_user, permission, False) is not True:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking permissions for admin {admin_id}: {e}")
            return False

    async def list_admin_permissions(self, admin_id: str) -> dict[str, bool]:
        """
        Get all permission flags for an admin user.
        
        Args:
            admin_id: The admin user's ID
            
        Returns:
            Dictionary of all permissions and their boolean values
        """
        try:
            query = select(AdminUser).where(AdminUser.id == admin_id)
            result = await self.db.execute(query)
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                return {}
            
            return {
                "is_super_admin": admin_user.is_super_admin,
                "can_manage_payments": admin_user.can_manage_payments,
                "can_manage_disbursements": admin_user.can_manage_disbursements,
                "can_view_reports": admin_user.can_view_reports,
                "can_manage_wallet": admin_user.can_manage_wallet,
                "can_manage_transactions": admin_user.can_manage_transactions,
                "can_manage_bot": admin_user.can_manage_bot,
                "can_approve_topups": admin_user.can_approve_topups,
                "can_manage_team": admin_user.can_manage_team,
                "can_credit_wallet": admin_user.can_credit_wallet,
                "can_debit_wallet": admin_user.can_debit_wallet,
                "can_freeze_wallet": admin_user.can_freeze_wallet,
                "can_unfreeze_wallet": admin_user.can_unfreeze_wallet,
            }
            
        except Exception as e:
            logger.error(f"Error listing permissions for admin {admin_id}: {e}")
            return {}
