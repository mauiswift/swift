from datetime import datetime, timedelta, timezone

from models.kyb_registrations import KybRegistration
from routers.kyb import _registration_organization
from routers.team_invitations import _is_invitation_expired, _normalize_invitation_email
from models.admin_users import AdminUser
from services.wallets import WalletsService
from routers.team_invitations import _application_permissions


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


def test_invited_super_admin_cannot_manage_wallet_or_toss_controls():
    permissions = _application_permissions("super_admin")

    assert permissions["is_super_admin"] is True
    assert permissions["can_manage_payments"] is True
    assert permissions["can_manage_wallet"] is False
    assert permissions["can_credit_wallet"] is False
    assert permissions["can_debit_wallet"] is False
    assert permissions["can_freeze_wallet"] is False
    assert permissions["can_unfreeze_wallet"] is False
    assert permissions["can_manage_team"] is False
