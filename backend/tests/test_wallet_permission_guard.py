import pytest
from fastapi import HTTPException

from routers.admin_wallets import _require_wallet_permission
from schemas.auth import UserPermissions, UserResponse


def _user(**permission_values):
    return UserResponse(
        id="admin-1",
        email="admin@example.com",
        permissions=UserPermissions(is_super_admin=True, **permission_values),
    )


def test_super_admin_wallet_permission_can_be_revoked():
    with pytest.raises(HTTPException) as error:
        _require_wallet_permission(_user(can_freeze_wallet=False), "can_freeze_wallet")

    assert error.value.status_code == 403


def test_super_admin_with_wallet_permission_is_allowed():
    _require_wallet_permission(_user(can_freeze_wallet=True), "can_freeze_wallet")
