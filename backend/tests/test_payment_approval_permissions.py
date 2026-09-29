import pytest
from fastapi import HTTPException

from routers.payment_approvals import _require_payment_approval_access
from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from routers.topup import _can_approve_requests
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


def test_topup_approval_requires_super_admin_and_approval_permission():
    assert _can_approve_requests(
        _user(UserPermissions(is_super_admin=True, can_approve_topups=True))
    )
    assert not _can_approve_requests(
        _user(UserPermissions(is_super_admin=True, can_approve_topups=False))
    )
    assert not _can_approve_requests(
        _user(UserPermissions(can_approve_topups=True))
    )
