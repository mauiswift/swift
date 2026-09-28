"""
Role and Permission Definitions

This module defines the standard predefined roles with locked permission combinations.
All roles inherit from PredefinedRole and cannot be modified.

Standard Roles:
- Owner: Full organization access; platform super admin only for the platform organization
- Admin: All permissions except super admin status
- Manager: Payments, Disbursements, Reports, Wallet, Transactions, Team management
- Operator: Payments, Disbursements, Transactions processing
- Viewer: Read-only access to Reports and Transactions
- Developer: API keys, webhooks, bot configuration
"""

from enum import Enum
from typing import Dict
from pydantic import BaseModel


class PredefinedRoleEnum(str, Enum):
    """Standard predefined roles that cannot be modified"""
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    OPERATOR = "operator"
    VIEWER = "viewer"
    DEVELOPER = "developer"


class RolePermissions(BaseModel):
    """Permission model matching UserPermissions schema"""
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

    class Config:
        from_attributes = True


PERMISSION_KEYS = tuple(RolePermissions.model_fields)

WALLET_PERMISSION_KEYS = (
    "can_manage_wallet",
    "can_credit_wallet",
    "can_debit_wallet",
    "can_freeze_wallet",
    "can_unfreeze_wallet",
)

ROLE_DESCRIPTIONS = {
    PredefinedRoleEnum.OWNER: "Full access to one organization; platform-wide access is reserved for the platform owner",
    PredefinedRoleEnum.ADMIN: "Manage an organization's day-to-day operations, team, and wallet controls",
    PredefinedRoleEnum.MANAGER: "Manage organization operations, reports, wallet settings, and team access",
    PredefinedRoleEnum.OPERATOR: "Process organization payments and disbursements and review transactions",
    PredefinedRoleEnum.VIEWER: "Read organization reports and transaction history without operational controls",
    PredefinedRoleEnum.DEVELOPER: "Manage organization bot and integration settings without financial controls",
}


# ============================================================================
# ROLE DEFINITIONS - Locked Permission Combinations
# ============================================================================

PREDEFINED_ROLES: Dict[PredefinedRoleEnum, Dict[str, bool]] = {
    # ==== OWNER ====
    # Full platform access including super admin status
    PredefinedRoleEnum.OWNER: {
        "is_super_admin": True,
        "can_manage_payments": True,
        "can_manage_disbursements": True,
        "can_view_reports": True,
        "can_manage_wallet": True,
        "can_manage_transactions": True,
        "can_manage_bot": True,
        "can_approve_topups": True,
        "can_manage_team": True,
        "can_credit_wallet": True,
        "can_debit_wallet": True,
        "can_freeze_wallet": True,
        "can_unfreeze_wallet": True,
    },
    
    # ==== ADMIN ====
    # All permissions except super admin (cannot modify platform-level settings)
    PredefinedRoleEnum.ADMIN: {
        "is_super_admin": False,
        "can_manage_payments": True,
        "can_manage_disbursements": True,
        "can_view_reports": True,
        "can_manage_wallet": True,
        "can_manage_transactions": True,
        "can_manage_bot": True,
        "can_approve_topups": True,
        "can_manage_team": True,
        "can_credit_wallet": True,
        "can_debit_wallet": True,
        "can_freeze_wallet": True,
        "can_unfreeze_wallet": True,
    },
    
    # ==== MANAGER ====
    # Day-to-day operations: payments, disbursements, wallet, reports, team
    PredefinedRoleEnum.MANAGER: {
        "is_super_admin": False,
        "can_manage_payments": True,
        "can_manage_disbursements": True,
        "can_view_reports": True,
        "can_manage_wallet": True,
        "can_manage_transactions": True,
        "can_manage_bot": False,
        "can_approve_topups": False,
        "can_manage_team": True,
        "can_credit_wallet": False,
        "can_debit_wallet": False,
        "can_freeze_wallet": False,
        "can_unfreeze_wallet": False,
    },
    
    # ==== OPERATOR ====
    # Process payments and disbursements, view transaction history
    PredefinedRoleEnum.OPERATOR: {
        "is_super_admin": False,
        "can_manage_payments": True,
        "can_manage_disbursements": True,
        "can_view_reports": False,
        "can_manage_wallet": False,
        "can_manage_transactions": True,
        "can_manage_bot": False,
        "can_approve_topups": False,
        "can_manage_team": False,
        "can_credit_wallet": False,
        "can_debit_wallet": False,
        "can_freeze_wallet": False,
        "can_unfreeze_wallet": False,
    },
    
    # ==== VIEWER ====
    # Read-only access to reports and transactions
    PredefinedRoleEnum.VIEWER: {
        "is_super_admin": False,
        "can_manage_payments": False,
        "can_manage_disbursements": False,
        "can_view_reports": True,
        "can_manage_wallet": False,
        "can_manage_transactions": True,
        "can_manage_bot": False,
        "can_approve_topups": False,
        "can_manage_team": False,
        "can_credit_wallet": False,
        "can_debit_wallet": False,
        "can_freeze_wallet": False,
        "can_unfreeze_wallet": False,
    },
    
    # ==== DEVELOPER ====
    # API keys, webhooks, bot configuration (Developer Portal access)
    PredefinedRoleEnum.DEVELOPER: {
        "is_super_admin": False,
        "can_manage_payments": False,
        "can_manage_disbursements": False,
        "can_view_reports": False,
        "can_manage_wallet": False,
        "can_manage_transactions": False,
        "can_manage_bot": True,
        "can_approve_topups": False,
        "can_manage_team": False,
        "can_credit_wallet": False,
        "can_debit_wallet": False,
        "can_freeze_wallet": False,
        "can_unfreeze_wallet": False,
    },
}


def get_invited_super_admin_permissions() -> RolePermissions:
    """Return the restricted permissions used for invited super admins."""
    permissions = get_role_permissions(PredefinedRoleEnum.OWNER).model_dump()
    permissions.update({key: False for key in WALLET_PERMISSION_KEYS})
    permissions["can_manage_team"] = False
    return RolePermissions(**permissions)


# ============================================================================
# ROLE UTILITIES
# ============================================================================

def get_role_permissions(role: PredefinedRoleEnum) -> RolePermissions:
    """
    Get the permission set for a predefined role.
    
    Args:
        role: A PredefinedRoleEnum value
        
    Returns:
        RolePermissions with all permission flags set according to role definition
        
    Raises:
        ValueError: If role is not in PREDEFINED_ROLES
    """
    if role not in PREDEFINED_ROLES:
        raise ValueError(f"Unknown predefined role: {role}")
    
    return RolePermissions(**PREDEFINED_ROLES[role])


def validate_role_exists(role_name: str) -> bool:
    """Check if a role name is a valid predefined role"""
    try:
        PredefinedRoleEnum(role_name)
        return True
    except ValueError:
        return False


def get_all_roles() -> Dict[str, Dict[str, bool]]:
    """Get all predefined roles with their permission configurations"""
    return {
        role.value: permissions
        for role, permissions in PREDEFINED_ROLES.items()
    }


def get_role_description(role: PredefinedRoleEnum) -> str:
    """Get human-readable description of a role"""
    return ROLE_DESCRIPTIONS.get(role, "Unknown role")


# Role hierarchy for inheritance/permission checking
# Higher index = higher privilege level
ROLE_HIERARCHY = {
    PredefinedRoleEnum.VIEWER: 0,
    PredefinedRoleEnum.DEVELOPER: 1,
    PredefinedRoleEnum.OPERATOR: 2,
    PredefinedRoleEnum.MANAGER: 3,
    PredefinedRoleEnum.ADMIN: 4,
    PredefinedRoleEnum.OWNER: 5,
}

ROLE_ALIASES = {
    "editor": PredefinedRoleEnum.OPERATOR,
    "operator": PredefinedRoleEnum.OPERATOR,
}


def get_role_permissions_by_name(role_name: str | None) -> RolePermissions:
    """Resolve every supported stored role to its canonical permission matrix."""
    normalized = (role_name or "admin").strip().lower()
    if normalized == "super_admin":
        return get_invited_super_admin_permissions()
    role = ROLE_ALIASES.get(normalized)
    if role is None:
        try:
            role = PredefinedRoleEnum(normalized)
        except ValueError:
            role = PredefinedRoleEnum.ADMIN
    return get_role_permissions(role)


def get_role_level(role: PredefinedRoleEnum) -> int:
    """Get the hierarchy level of a role (higher = more privileges)"""
    return ROLE_HIERARCHY.get(role, -1)


def is_role_higher_or_equal(role_a: PredefinedRoleEnum, role_b: PredefinedRoleEnum) -> bool:
    """Check if role_a has equal or higher privilege level than role_b"""
    return get_role_level(role_a) >= get_role_level(role_b)
