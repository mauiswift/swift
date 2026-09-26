import pytest
from fastapi import HTTPException

from routers.payment_approvals import _require_payment_approval_access
from schemas.auth import UserPermissions, UserResponse


def _user(permissions: UserPermissions) -> UserResponse:
    return UserResponse(id="123", email="approver@example.com", permissions=permissions)


def test_payment_approval_permission_is_sufficient():
    _require_payment_approval_access(
        _user(UserPermissions(can_approve_topups=True))
    )


def test_super_admin_payment_approval_access_is_preserved():
    _require_payment_approval_access(
        _user(UserPermissions(is_super_admin=True))
    )


def test_payment_approval_is_rejected_without_permission():
    with pytest.raises(HTTPException) as error:
        _require_payment_approval_access(_user(UserPermissions()))

    assert error.value.status_code == 403
