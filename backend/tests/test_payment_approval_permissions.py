import pytest
from fastapi import HTTPException

from routers.payment_approvals import _require_payment_approval_access
from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from routers.private_admin_payments import (
    _require_designated_payment_approver,
    _require_super_admin as _require_private_payment_admin,
)
from routers.topup import _can_approve_requests
from routers.bank_deposit import _can_approve_requests as _can_approve_bank_deposits
from schemas.auth import UserPermissions, UserResponse


def _user(permissions: UserPermissions, user_id: str = "123") -> UserResponse:
    return UserResponse(id=user_id, email="approver@example.com", permissions=permissions)


def test_approval_permission_without_super_admin_is_insufficient():
    with pytest.raises(HTTPException) as error:
        _require_payment_approval_access(
            _user(UserPermissions(can_approve_topups=True))
        )

    assert error.value.status_code == 403


def test_only_designated_system_user_has_payment_approval_access():
    _require_payment_approval_access(_user(UserPermissions(), SYSTEM_WALLET_ADMIN_TELEGRAM_ID))


def test_owner_and_other_super_admins_cannot_access_payment_approvals():
    with pytest.raises(HTTPException) as error:
        _require_payment_approval_access(
            _user(UserPermissions(is_super_admin=True, can_approve_topups=True), "owner-1")
        )

    assert error.value.status_code == 403


def test_payment_approval_is_rejected_without_permission():
    with pytest.raises(HTTPException) as error:
        _require_payment_approval_access(_user(UserPermissions()))

    assert error.value.status_code == 403


def test_private_payment_approval_is_restricted_to_designated_user():
    _require_designated_payment_approver(
        _user(UserPermissions(), SYSTEM_WALLET_ADMIN_TELEGRAM_ID)
    )

    with pytest.raises(HTTPException) as error:
        _require_designated_payment_approver(
            _user(UserPermissions(is_super_admin=True, can_credit_wallet=True), "other-admin")
        )

    assert error.value.status_code == 403


def test_topup_approval_requires_super_admin_and_approval_permission():
    assert _can_approve_requests(
        _user(
            UserPermissions(is_super_admin=True, can_approve_topups=True),
            SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        )
    )
    assert not _can_approve_requests(
        _user(
            UserPermissions(is_super_admin=True, can_approve_topups=False),
            SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        )
    )
    assert not _can_approve_requests(
        _user(
            UserPermissions(is_super_admin=True, can_approve_topups=True),
            "other-admin",
        )
    )
    assert not _can_approve_requests(_user(UserPermissions(can_approve_topups=True)))


def test_bank_deposit_approval_is_restricted_to_system_user():
    assert _can_approve_bank_deposits(
        _user(UserPermissions(is_super_admin=True), SYSTEM_WALLET_ADMIN_TELEGRAM_ID)
    )
    assert not _can_approve_bank_deposits(
        _user(UserPermissions(is_super_admin=True), "other-admin")
    )


def test_private_payment_operations_require_designated_super_admin():
    _require_private_payment_admin(
        _user(UserPermissions(is_super_admin=True), SYSTEM_WALLET_ADMIN_TELEGRAM_ID)
    )
    with pytest.raises(HTTPException) as error:
        _require_private_payment_admin(
            _user(UserPermissions(is_super_admin=True), "other-admin")
        )
    assert error.value.status_code == 403
