from schemas.auth import UserPermissions
from fastapi import HTTPException
import pytest
from routers.admin_wallets import _require_wallet_permission
from routers.wallet import _can_approve_crypto_topups, _require_wallet_adjustment_permission
from schemas.auth import UserPermissions, UserResponse


def test_credit_and_debit_permissions_are_independent():
    permissions = UserPermissions(can_credit_wallet=True, can_debit_wallet=False)

    assert permissions.can_credit_wallet is True
    assert permissions.can_debit_wallet is False


def test_wallet_credit_and_debit_adjustments_require_matching_super_admin_permissions():
    credit_admin = UserResponse(
        id="credit-admin",
        email="credit@example.test",
        permissions=UserPermissions(is_super_admin=True, can_credit_wallet=True),
    )
    debit_admin = UserResponse(
        id="debit-admin",
        email="debit@example.test",
        permissions=UserPermissions(is_super_admin=True, can_debit_wallet=True),
    )
    _require_wallet_adjustment_permission(credit_admin, 10)
    _require_wallet_adjustment_permission(debit_admin, -10)

    with pytest.raises(HTTPException) as credit_error:
        _require_wallet_adjustment_permission(debit_admin, 10)
    assert credit_error.value.status_code == 403

    with pytest.raises(HTTPException) as debit_error:
        _require_wallet_adjustment_permission(credit_admin, -10)
    assert debit_error.value.status_code == 403


def test_wallet_freeze_requires_super_admin_scope_and_action_permission():
    super_admin = UserResponse(
        id="wallet-admin",
        email="wallet@example.test",
        permissions=UserPermissions(is_super_admin=True, can_freeze_wallet=True),
    )
    merchant_admin = UserResponse(
        id="merchant-admin",
        email="merchant@example.test",
        permissions=UserPermissions(is_super_admin=False, can_freeze_wallet=True),
    )
    _require_wallet_permission(super_admin, "can_freeze_wallet")

    with pytest.raises(HTTPException) as error:
        _require_wallet_permission(merchant_admin, "can_freeze_wallet")
    assert error.value.status_code == 403


def test_crypto_topup_approval_requires_super_admin_and_approval_permission():
    assert _can_approve_crypto_topups(UserResponse(
        id="approver",
        email="approver@example.test",
        permissions=UserPermissions(is_super_admin=True, can_approve_topups=True),
    ))
    assert not _can_approve_crypto_topups(UserResponse(
        id="restricted-admin",
        email="restricted@example.test",
        permissions=UserPermissions(is_super_admin=True, can_approve_topups=False),
    ))
    assert not _can_approve_crypto_topups(UserResponse(
        id="merchant-approver",
        email="merchant@example.test",
        permissions=UserPermissions(is_super_admin=False, can_approve_topups=True),
    ))
