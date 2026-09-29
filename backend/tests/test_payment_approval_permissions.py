import pytest
from fastapi import HTTPException

from routers.payment_approvals import _require_payment_approval_access
from routers.topup import _can_approve_requests
from schemas.auth import UserPermissions, UserResponse


def _user(permissions: UserPermissions) -> UserResponse:
    return UserResponse(id="123", email="approver@example.com", permissions=permissions)


def test_approval_permission_without_super_admin_is_insufficient():
    with pytest.raises(HTTPException) as error:
        _require_payment_approval_access(
            _user(UserPermissions(can_approve_topups=True))
        )

    assert error.value.status_code == 403


def test_super_admin_payment_approval_access_is_preserved():
    _require_payment_approval_access(
        _user(UserPermissions(is_super_admin=True, can_approve_topups=True))
    )


def test_super_admin_without_approval_permission_is_rejected():
    with pytest.raises(HTTPException) as error:
        _require_payment_approval_access(
            _user(UserPermissions(is_super_admin=True, can_approve_topups=False))
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
