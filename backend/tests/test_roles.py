"""
Tests for Role and Permission System

Comprehensive test suite for:
- Predefined role definitions
- Role assignment to admin users
- Permission validation
- Role hierarchy
- Permission checking
"""

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from core.roles import (
    PredefinedRoleEnum,
    RolePermissions,
    get_role_permissions,
    validate_role_exists,
    get_all_roles,
    get_role_description,
    get_role_level,
    is_role_higher_or_equal,
    PREDEFINED_ROLES,
)
from models.base import Base
from models.admin_users import AdminUser
from services.roles_service import RolesService


# Test database setup
@pytest_asyncio.fixture
async def async_db():
    """Create an in-memory SQLite database for testing"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session


# ============================================================================
# ROLE DEFINITION TESTS
# ============================================================================

class TestRoleDefinitions:
    """Test role definitions and configuration"""

    def test_all_predefined_roles_exist(self):
        """Verify all predefined roles are defined"""
        assert len(PREDEFINED_ROLES) == 6
        assert PredefinedRoleEnum.OWNER in PREDEFINED_ROLES
        assert PredefinedRoleEnum.ADMIN in PREDEFINED_ROLES
        assert PredefinedRoleEnum.MANAGER in PREDEFINED_ROLES
        assert PredefinedRoleEnum.OPERATOR in PREDEFINED_ROLES
        assert PredefinedRoleEnum.VIEWER in PREDEFINED_ROLES
        assert PredefinedRoleEnum.DEVELOPER in PREDEFINED_ROLES

    def test_role_permissions_have_correct_structure(self):
        """Verify each role has all 9 permission flags"""
        expected_permissions = {
            "is_super_admin",
            "can_manage_payments",
            "can_manage_disbursements",
            "can_view_reports",
            "can_manage_wallet",
            "can_manage_transactions",
            "can_manage_bot",
            "can_approve_topups",
            "can_manage_team",
        }
        
        for role, permissions in PREDEFINED_ROLES.items():
            assert set(permissions.keys()) == expected_permissions, \
                f"Role {role.value} missing expected permissions"

    def test_owner_has_all_permissions(self):
        """Owner role should have all permissions enabled"""
        owner_perms = PREDEFINED_ROLES[PredefinedRoleEnum.OWNER]
        assert all(owner_perms.values()), \
            f"Owner role should have all permissions enabled"

    def test_admin_lacks_super_admin_only(self):
        """Admin role should have all permissions except is_super_admin"""
        admin_perms = PREDEFINED_ROLES[PredefinedRoleEnum.ADMIN]
        assert not admin_perms["is_super_admin"], \
            "Admin should not be super admin"
        assert all(v for k, v in admin_perms.items() if k != "is_super_admin"), \
            "Admin should have all other permissions"

    def test_operator_has_limited_permissions(self):
        """Operator should only have payment/disbursement permissions"""
        op_perms = PREDEFINED_ROLES[PredefinedRoleEnum.OPERATOR]
        assert op_perms["can_manage_payments"]
        assert op_perms["can_manage_disbursements"]
        assert op_perms["can_manage_transactions"]
        
        # Should NOT have these
        assert not op_perms["is_super_admin"]
        assert not op_perms["can_view_reports"]
        assert not op_perms["can_manage_wallet"]
        assert not op_perms["can_manage_bot"]
        assert not op_perms["can_approve_topups"]
        assert not op_perms["can_manage_team"]

    def test_viewer_is_read_only(self):
        """Viewer should only have report and transaction viewing"""
        viewer_perms = PREDEFINED_ROLES[PredefinedRoleEnum.VIEWER]
        assert viewer_perms["can_view_reports"]
        assert viewer_perms["can_manage_transactions"]  # includes reading
        
        # Should NOT have management permissions
        assert not viewer_perms["is_super_admin"]
        assert not viewer_perms["can_manage_payments"]
        assert not viewer_perms["can_manage_disbursements"]
        assert not viewer_perms["can_manage_wallet"]
        assert not viewer_perms["can_manage_bot"]
        assert not viewer_perms["can_approve_topups"]
        assert not viewer_perms["can_manage_team"]

    def test_developer_has_only_bot_permission(self):
        """Developer should only have bot/API management permission"""
        dev_perms = PREDEFINED_ROLES[PredefinedRoleEnum.DEVELOPER]
        assert dev_perms["can_manage_bot"]
        
        # All other permissions should be False
        assert not dev_perms["is_super_admin"]
        assert not dev_perms["can_manage_payments"]
        assert not dev_perms["can_manage_disbursements"]
        assert not dev_perms["can_view_reports"]
        assert not dev_perms["can_manage_wallet"]
        assert not dev_perms["can_manage_transactions"]
        assert not dev_perms["can_approve_topups"]
        assert not dev_perms["can_manage_team"]

    def test_role_permissions_include_team_management(self):
        """Custom and predefined role schemas should include team management access."""
        assert "can_manage_team" in PREDEFINED_ROLES[PredefinedRoleEnum.OWNER]
        assert "can_manage_team" in PREDEFINED_ROLES[PredefinedRoleEnum.MANAGER]
        assert PREDEFINED_ROLES[PredefinedRoleEnum.MANAGER]["can_manage_team"] is True


# ============================================================================
# ROLE UTILITY FUNCTION TESTS
# ============================================================================

class TestRoleUtilities:
    """Test role utility functions"""

    def test_get_role_permissions(self):
        """Test getting permissions for a role"""
        owner_perms = get_role_permissions(PredefinedRoleEnum.OWNER)
        assert isinstance(owner_perms, RolePermissions)
        assert owner_perms.is_super_admin is True

    def test_get_role_permissions_invalid_role(self):
        """Test that invalid role raises error"""
        with pytest.raises(ValueError):
            get_role_permissions("invalid_role")  # type: ignore

    def test_validate_role_exists(self):
        """Test role existence validation"""
        assert validate_role_exists("owner") is True
        assert validate_role_exists("admin") is True
        assert validate_role_exists("manager") is True
        assert validate_role_exists("operator") is True
        assert validate_role_exists("viewer") is True
        assert validate_role_exists("developer") is True
        assert validate_role_exists("invalid") is False

    def test_get_all_roles(self):
        """Test getting all roles"""
        all_roles = get_all_roles()
        assert len(all_roles) == 6
        assert "owner" in all_roles
        assert "admin" in all_roles
        assert "manager" in all_roles

    def test_get_role_description(self):
        """Test role descriptions are available"""
        desc = get_role_description(PredefinedRoleEnum.OWNER)
        assert isinstance(desc, str)
        assert len(desc) > 0
        assert "owner" in desc.lower() or "full" in desc.lower()

    def test_all_roles_have_descriptions(self):
        """Test all roles have descriptions"""
        for role in PredefinedRoleEnum:
            desc = get_role_description(role)
            assert desc is not None
            assert len(desc) > 0


# ============================================================================
# ROLE HIERARCHY TESTS
# ============================================================================

class TestRoleHierarchy:
    """Test role hierarchy and level system"""

    def test_role_hierarchy_levels(self):
        """Test that roles have correct hierarchy levels"""
        viewer_level = get_role_level(PredefinedRoleEnum.VIEWER)
        operator_level = get_role_level(PredefinedRoleEnum.OPERATOR)
        manager_level = get_role_level(PredefinedRoleEnum.MANAGER)
        admin_level = get_role_level(PredefinedRoleEnum.ADMIN)
        owner_level = get_role_level(PredefinedRoleEnum.OWNER)
        
        # Verify ordering
        assert viewer_level < operator_level < manager_level < admin_level < owner_level

    def test_is_role_higher_or_equal(self):
        """Test role comparison function"""
        assert is_role_higher_or_equal(
            PredefinedRoleEnum.OWNER, PredefinedRoleEnum.ADMIN
        )
        assert is_role_higher_or_equal(
            PredefinedRoleEnum.ADMIN, PredefinedRoleEnum.ADMIN
        )
        assert not is_role_higher_or_equal(
            PredefinedRoleEnum.VIEWER, PredefinedRoleEnum.OPERATOR
        )


# ============================================================================
# ROLE SERVICE TESTS
# ============================================================================

class TestRolesService:
    """Test RolesService for role assignment and permission checking"""

    @pytest.mark.asyncio
    async def test_assign_predefined_role(self, async_db):
        """Test assigning a predefined role to an admin"""
        # Create a test admin
        admin = AdminUser(
            id=1,
            telegram_id="tg_admin_1",
            email="admin@test.com",
            is_super_admin=False,
        )
        async_db.add(admin)
        await async_db.commit()
        
        # Assign owner role
        service = RolesService(async_db)
        updated_admin = await service.assign_predefined_role(
            "1",
            PredefinedRoleEnum.OWNER
        )
        
        assert updated_admin is not None
        assert updated_admin.is_super_admin is True
        assert updated_admin.can_manage_payments is True
        assert updated_admin.can_manage_bot is True
        assert updated_admin.role == "owner"

    @pytest.mark.asyncio
    async def test_assign_operator_role(self, async_db):
        """Test assigning operator role"""
        admin = AdminUser(
            id=2,
            telegram_id="tg_admin_2",
            email="operator@test.com",
            is_super_admin=False,
        )
        async_db.add(admin)
        await async_db.commit()
        
        service = RolesService(async_db)
        updated_admin = await service.assign_predefined_role(
            "2",
            PredefinedRoleEnum.OPERATOR
        )
        
        assert updated_admin.can_manage_payments is True
        assert updated_admin.can_manage_disbursements is True
        assert updated_admin.can_manage_transactions is True
        assert updated_admin.can_view_reports is False
        assert updated_admin.can_manage_bot is False

    @pytest.mark.asyncio
    async def test_assign_role_nonexistent_admin(self, async_db):
        """Test assigning role to non-existent admin returns None"""
        service = RolesService(async_db)
        result = await service.assign_predefined_role(
            "nonexistent",
            PredefinedRoleEnum.ADMIN
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_get_admin_role(self, async_db):
        """Test detecting role from admin permissions"""
        admin = AdminUser(
            id=3,
            telegram_id="tg_admin_3",
            email="viewer@test.com",
            is_super_admin=False,
            can_view_reports=True,
            can_manage_transactions=True,
        )
        async_db.add(admin)
        await async_db.commit()
        
        service = RolesService(async_db)
        role = await service.get_admin_role("3")
        
        assert role == PredefinedRoleEnum.VIEWER

    @pytest.mark.asyncio
    async def test_validate_single_permission(self, async_db):
        """Test validating a single permission"""
        admin = AdminUser(
            id=4,
            telegram_id="tg_admin_4",
            email="dev@test.com",
            is_super_admin=False,
            can_manage_bot=True,
        )
        async_db.add(admin)
        await async_db.commit()
        
        service = RolesService(async_db)
        
        assert await service.validate_permission("4", "can_manage_bot") is True
        assert await service.validate_permission("4", "can_manage_payments") is False

    @pytest.mark.asyncio
    async def test_has_any_permission(self, async_db):
        """Test checking for ANY of multiple permissions"""
        admin = AdminUser(
            id=5,
            telegram_id="tg_admin_5",
            email="manager@test.com",
            can_manage_payments=True,
        )
        async_db.add(admin)
        await async_db.commit()
        
        service = RolesService(async_db)
        
        # Should have at least one
        assert await service.has_any_permission(
            "5",
            ["can_manage_payments", "can_manage_bot"]
        ) is True
        
        # Should have none
        assert await service.has_any_permission(
            "5",
            ["can_manage_bot", "can_approve_topups"]
        ) is False

    @pytest.mark.asyncio
    async def test_has_all_permissions(self, async_db):
        """Test checking for ALL of multiple permissions"""
        admin = AdminUser(
            id=6,
            telegram_id="tg_admin_6",
            email="manager2@test.com",
            can_manage_payments=True,
            can_manage_disbursements=True,
            can_view_reports=True,
        )
        async_db.add(admin)
        await async_db.commit()
        
        service = RolesService(async_db)
        
        # Should have all
        assert await service.has_all_permissions(
            "6",
            ["can_manage_payments", "can_manage_disbursements", "can_view_reports"]
        ) is True
        
        # Should not have all
        assert await service.has_all_permissions(
            "6",
            ["can_manage_payments", "can_manage_bot"]
        ) is False

    @pytest.mark.asyncio
    async def test_list_admin_permissions(self, async_db):
        """Test listing all permissions for an admin"""
        admin = AdminUser(
            id=7,
            telegram_id="tg_admin_7",
            email="admin7@test.com",
            is_super_admin=True,
        )
        async_db.add(admin)
        await async_db.commit()
        
        service = RolesService(async_db)
        perms = await service.list_admin_permissions("7")
        
        assert isinstance(perms, dict)
        assert "is_super_admin" in perms
        assert perms["is_super_admin"] is True


# ============================================================================
# PERMISSION MATRIX TESTS
# ============================================================================

class TestPermissionMatrix:
    """Test permission combinations across all roles"""

    def test_permission_count_by_role(self):
        """Verify each role has appropriate number of enabled permissions"""
        permission_counts = {}
        
        for role, perms in PREDEFINED_ROLES.items():
            count = sum(1 for v in perms.values() if v is True)
            permission_counts[role.value] = count
        
        # Verify expected counts (based on definitions)
        assert permission_counts["owner"] == 9  # All permissions
        assert permission_counts["admin"] == 8  # All except super_admin
        assert permission_counts["manager"] == 6  # Payments, disbursements, reports, wallet, transactions, team
        assert permission_counts["operator"] == 3  # Limited
        assert permission_counts["viewer"] == 2  # Read-only
        assert permission_counts["developer"] == 1  # Only bot management

    def test_roles_are_unique(self):
        """Verify each role has a unique permission configuration"""
        configs = [
            tuple(sorted(perms.items()))
            for perms in PREDEFINED_ROLES.values()
        ]
        
        assert len(configs) == len(set(configs)), \
            "Duplicate role permission configurations found"

    def test_permission_inheritance_not_present(self):
        """Verify roles do not have unintended permission inheritance"""
        # Viewer should not have payment management just because they have report access
        viewer = PREDEFINED_ROLES[PredefinedRoleEnum.VIEWER]
        assert not viewer["can_manage_payments"]
        
        # Operator should not have wallet management
        operator = PREDEFINED_ROLES[PredefinedRoleEnum.OPERATOR]
        assert not operator["can_manage_wallet"]
