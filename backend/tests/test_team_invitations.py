from datetime import datetime, timedelta, timezone
import pytest

from models.kyb_registrations import KybRegistration
from routers.kyb import _registration_organization
from routers.team_invitations import _is_invitation_expired, _normalize_invitation_email
from models.admin_users import AdminUser
from services.auth import (
    _get_platform_organization,
    normalize_organization_owner_scope,
    normalize_organization_role_state,
)
from routers.admin_users import _apply_role_permissions
from routers.team_invitations import _application_permissions, _validate_role_name


def test_normalize_invitation_email_is_case_insensitive():
    assert _normalize_invitation_email("  User@Example.COM ") == "user@example.com"


def test_invitation_expiry_handles_naive_and_aware_datetimes():
    now = datetime.now(timezone.utc)

    assert _is_invitation_expired(now - timedelta(seconds=1), now)
    assert not _is_invitation_expired(now + timedelta(seconds=1), now)
    assert _is_invitation_expired(
        (now - timedelta(seconds=1)).replace(tzinfo=None),
        now,
    )


def test_downline_registration_gets_own_merchant_scope():
    upline = KybRegistration(
        id=1,
        chat_id="upline-user",
        email="upline@example.com",
        full_name="Upline Merchant",
        bank_name="Upline Merchant",
    )
    downline = KybRegistration(
        id=2,
        chat_id="downline-user",
        email="downline@example.com",
        full_name="Downline Merchant",
        bank_name="Downline Merchant",
        referral_upline_id="upline-user",
    )

    upline_org, _ = _registration_organization(upline)
    downline_org, downline_name = _registration_organization(downline)

    assert downline_org != upline_org
    assert downline_name == "Downline Merchant"


def test_organization_owner_is_shared_regardless_of_registration_path():
    invited_owner = AdminUser(
        telegram_id="invite-generated-id",
        role="owner",
        organization_id="acme-business",
        is_super_admin=False,
    )
    direct_owner = AdminUser(
        telegram_id="merchant-telegram-id",
        role="owner",
        organization_id="acme-business",
        is_super_admin=False,
    )

    assert invited_owner.organization_id == direct_owner.organization_id


def test_organization_owner_role_is_not_platform_super_admin():
    permissions = _application_permissions("owner")
    admin = AdminUser(telegram_id="merchant-owner", organization_id="acme")

    _apply_role_permissions(admin, "owner")

    assert permissions["is_super_admin"] is False
    assert permissions["can_manage_team"] is True
    assert admin.is_super_admin is False
    assert admin.can_manage_wallet is True


def test_legacy_invited_organization_owner_is_scoped_on_login():
    invited_owner = AdminUser(
        telegram_id="invite-owner",
        role="owner",
        organization_id="acme",
        is_super_admin=True,
        team_permissions={"is_super_admin": True},
    )

    assert normalize_organization_owner_scope(invited_owner)
    assert invited_owner.is_super_admin is False
    assert invited_owner.team_permissions["is_super_admin"] is False


def test_platform_owner_remains_super_admin():
    platform_org_id, _ = _get_platform_organization()
    platform_owner = AdminUser(
        telegram_id="platform-owner",
        role="owner",
        organization_id=platform_org_id,
        is_super_admin=True,
    )

    assert not normalize_organization_owner_scope(platform_owner)
    assert platform_owner.is_super_admin is True


def test_invited_super_admin_cannot_manage_wallet_or_toss_controls():
    permissions = _application_permissions("super_admin", {
        "can_manage_wallet": True,
        "can_manage_team": True,
    }, is_platform_organization=True)

    assert permissions["is_super_admin"] is True
    assert permissions["can_manage_payments"] is True
    assert permissions["can_manage_team"] is False
    assert permissions["can_manage_wallet"] is False
    assert permissions["can_credit_wallet"] is False
    assert permissions["can_debit_wallet"] is False
    assert permissions["can_freeze_wallet"] is False
    assert permissions["can_unfreeze_wallet"] is False


def test_merchant_invitation_cannot_request_platform_only_permissions():
    permissions = _application_permissions("admin", {
        "is_super_admin": True,
        "can_approve_topups": True,
        "can_credit_wallet": True,
        "can_debit_wallet": True,
        "can_freeze_wallet": True,
        "can_unfreeze_wallet": True,
        "can_manage_payments": True,
    })

    assert permissions["is_super_admin"] is False
    assert permissions["can_manage_payments"] is True
    for key in (
        "can_approve_topups",
        "can_credit_wallet",
        "can_debit_wallet",
        "can_freeze_wallet",
        "can_unfreeze_wallet",
    ):
        assert permissions[key] is False


def test_super_admin_invitation_cannot_target_merchant_organization():
    from fastapi import HTTPException

    from routers.team_invitations import SendInvitationRequest, _resolve_super_admin_org_scope

    request = SendInvitationRequest(
        email="super@example.com",
        role="super_admin",
        organization_id="merchant-org",
    )
    with pytest.raises(HTTPException) as error:
        import asyncio
        asyncio.run(_resolve_super_admin_org_scope(None, request, "super_admin"))

    assert error.value.status_code == 400


def test_validate_role_name_accepts_canonical_roles_case_insensitively():
    assert _validate_role_name("Manager") == "manager"
    assert _validate_role_name("OPERATOR") == "operator"
    assert _validate_role_name("owner") == "owner"


def test_org_roles_are_normalized_to_org_scope():
    invited_owner = AdminUser(
        telegram_id="invite-owner",
        role="OWNER",
        organization_id="acme-org",
        is_super_admin=True,
        team_permissions={"is_super_admin": True, "can_manage_team": True},
    )

    changed = normalize_organization_role_state(invited_owner)

    assert changed is True
    assert invited_owner.role == "owner"
    assert invited_owner.is_super_admin is False
    assert invited_owner.team_permissions["is_super_admin"] is False
    assert invited_owner.team_permissions["can_manage_team"] is True
