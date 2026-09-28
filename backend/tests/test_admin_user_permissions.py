import pytest
from fastapi import HTTPException
from starlette.requests import Request

from dependencies import auth as auth_dependencies
from models.admin_users import AdminUser
from models.custom_roles import CustomRole
from routers import auth as auth_router
from routers import roles as roles_router
from routers.admin_users import SUPER_ADMIN_PERMISSION_FIELDS, _apply_super_admin_permissions
from routers.team_invitations import _can_manage_team
from schemas.auth import UserPermissions, UserResponse
from services import auth as auth_service


def test_promoting_to_super_admin_grants_all_admin_permissions():
    values = {
        "is_super_admin": True,
        **{field: False for field in SUPER_ADMIN_PERMISSION_FIELDS},
    }

    result = _apply_super_admin_permissions(values)

    assert result["role"] == "super_admin"
    assert all(result[field] is True for field in SUPER_ADMIN_PERMISSION_FIELDS)


def test_regular_admin_permissions_remain_explicit():
    values = {
        "is_super_admin": False,
        "can_manage_payments": True,
        "can_manage_team": False,
    }

    result = _apply_super_admin_permissions(values)

    assert result == values


def test_organization_owner_login_permissions_do_not_grant_platform_super_admin(monkeypatch):
    monkeypatch.setattr(auth_service, "_get_platform_organization", lambda: ("platform", "Platform"))
    admin = AdminUser(
        telegram_id="merchant-owner",
        role="owner",
        organization_id="merchant",
        is_super_admin=True,
        can_manage_team=True,
        can_manage_wallet=True,
        can_credit_wallet=True,
    )

    permissions = auth_router._admin_permissions(admin)

    assert permissions.is_super_admin is False
    assert permissions.can_manage_team is True
    assert permissions.can_manage_wallet is True
    assert permissions.can_credit_wallet is True


def test_platform_owner_permissions_remain_super_admin(monkeypatch):
    monkeypatch.setattr(auth_service, "_get_platform_organization", lambda: ("platform", "Platform"))
    admin = AdminUser(
        telegram_id="platform-owner",
        role="owner",
        organization_id="platform",
        is_super_admin=True,
        can_manage_team=True,
    )

    assert auth_router._admin_permissions(admin).is_super_admin is True


def test_custom_role_assignment_persists_role_and_all_permission_fields(monkeypatch):
    monkeypatch.setattr(roles_router, "_get_platform_organization", lambda: ("platform", "Platform"))
    role = CustomRole(
        name="Finance",
        is_super_admin=False,
        can_manage_payments=True,
        can_manage_wallet=True,
        can_credit_wallet=True,
        can_debit_wallet=True,
    )
    admin = AdminUser(telegram_id="staff", organization_id="merchant")

    roles_router._apply_role_permissions(admin, role)

    assert admin.role == "Finance"
    assert admin.team_permissions["can_manage_payments"] is True
    assert admin.can_manage_payments is True
    assert admin.can_manage_wallet is True
    assert admin.can_credit_wallet is True
    assert admin.can_debit_wallet is True
    assert admin.can_freeze_wallet is False
    assert auth_router._admin_permissions(admin).can_credit_wallet is True


def test_role_management_requires_super_admin_team_permission():
    restricted_super_admin = UserResponse(
        id="invited-admin",
        email="admin@example.com",
        permissions=UserPermissions(is_super_admin=True, can_manage_team=False),
    )
    with pytest.raises(HTTPException) as exc_info:
        roles_router._require_super_admin(restricted_super_admin)
    assert exc_info.value.status_code == 403

    platform_admin = UserResponse(
        id="platform-admin",
        email="admin@example.com",
        permissions=UserPermissions(is_super_admin=True, can_manage_team=True),
    )
    roles_router._require_super_admin(platform_admin)


def test_invited_super_admin_without_team_permission_cannot_manage_team():
    admin = AdminUser(
        telegram_id="invited-admin",
        is_super_admin=True,
        can_manage_team=False,
    )
    current_user = UserResponse(
        id="invited-admin",
        email="admin@example.com",
        permissions=UserPermissions(is_super_admin=True, can_manage_team=False),
    )

    assert _can_manage_team(admin, current_user) is False


@pytest.mark.asyncio
async def test_deactivated_admin_tokens_are_rejected(monkeypatch):
    monkeypatch.setattr(
        auth_dependencies,
        "decode_access_token",
        lambda _token: {"sub": "inactive-admin", "role": "admin"},
    )

    class InactiveAdminDatabase:
        async def scalar(self, _statement):
            return AdminUser(telegram_id="inactive-admin", is_active=False)

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    with pytest.raises(HTTPException) as exc_info:
        await auth_dependencies.get_current_user(
            request=request,
            token="test-token",
            db=InactiveAdminDatabase(),
        )
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_admin_token_permissions_follow_current_database_role(monkeypatch):
    monkeypatch.setattr(
        auth_dependencies,
        "decode_access_token",
        lambda _token: {
            "sub": "merchant-owner",
            "role": "admin",
            "permissions": UserPermissions(is_super_admin=True).model_dump(),
        },
    )
    monkeypatch.setattr(auth_service, "_get_platform_organization", lambda: ("platform", "Platform"))

    class ActiveAdminDatabase:
        async def scalar(self, _statement):
            return AdminUser(
                telegram_id="merchant-owner",
                role="owner",
                organization_id="merchant",
                is_active=True,
                is_super_admin=False,
                can_manage_team=True,
            )

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    current_user = await auth_dependencies.get_current_user(
        request=request,
        token="test-token",
        db=ActiveAdminDatabase(),
    )

    assert current_user.permissions is not None
    assert current_user.permissions.is_super_admin is False
    assert current_user.permissions.can_manage_team is True
