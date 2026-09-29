import pytest
from fastapi import HTTPException

from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from routers.admin_wallets import _require_wallet_permission
from schemas.auth import UserPermissions, UserResponse


def _user(user_id="admin-1", **permission_values):
    return UserResponse(
        id=user_id,
        email="admin@example.com",
        permissions=UserPermissions(is_super_admin=True, **permission_values),
    )


def test_super_admin_wallet_permission_can_be_revoked():
    with pytest.raises(HTTPException) as error:
        _require_wallet_permission(_user(can_freeze_wallet=False), "can_freeze_wallet")

    assert error.value.status_code == 403


def test_super_admin_with_wallet_permission_is_allowed():
    _require_wallet_permission(
        _user(user_id=SYSTEM_WALLET_ADMIN_TELEGRAM_ID, can_freeze_wallet=True),
        "can_freeze_wallet",
    )


def test_other_super_admin_cannot_control_wallet():
    with pytest.raises(HTTPException) as error:
        _require_wallet_permission(_user(can_freeze_wallet=True), "can_freeze_wallet")

    assert error.value.status_code == 403
