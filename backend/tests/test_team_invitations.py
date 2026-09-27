from datetime import datetime, timedelta, timezone

from models.kyb_registrations import KybRegistration
from routers.kyb import _registration_organization
from routers.team_invitations import _is_invitation_expired, _normalize_invitation_email
from models.admin_users import AdminUser
from services.wallets import WalletsService
from services.auth import _get_platform_organization, normalize_organization_owner_scope
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


def test_invited_owner_uses_organization_wallet():
    invited_owner = AdminUser(
        telegram_id="invite-generated-id",
        role="owner",
        organization_id="acme-business",
        is_super_admin=False,
    )

    assert not WalletsService._is_direct_owner(invited_owner)


def test_direct_owner_keeps_personal_wallet():
    direct_owner = AdminUser(
        telegram_id="merchant-telegram-id",
        role="owner",
        organization_id="acme-business",
        is_super_admin=False,
    )

    assert WalletsService._is_direct_owner(direct_owner)


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
    })

    assert permissions["is_super_admin"] is True
    assert permissions["can_manage_payments"] is True
    assert permissions["can_manage_wallet"] is False
    assert permissions["can_credit_wallet"] is False
    assert permissions["can_debit_wallet"] is False
    assert permissions["can_freeze_wallet"] is False
    assert permissions["can_unfreeze_wallet"] is False
    assert permissions["can_manage_team"] is False


def test_validate_role_name_accepts_canonical_roles_case_insensitively():
    assert _validate_role_name("Manager") == "manager"
    assert _validate_role_name("OPERATOR") == "operator"
    assert _validate_role_name("owner") == "owner"
