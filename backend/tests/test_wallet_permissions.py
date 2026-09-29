from schemas.auth import UserPermissions
from fastapi import HTTPException
import pytest
from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from routers.admin_wallets import _require_system_wallet_admin, _require_wallet_permission
from routers.wallet import _can_approve_crypto_topups, _require_wallet_adjustment_permission
from schemas.auth import UserPermissions, UserResponse


def test_credit_and_debit_permissions_are_independent():
    permissions = UserPermissions(can_credit_wallet=True, can_debit_wallet=False)

    assert permissions.can_credit_wallet is True
    assert permissions.can_debit_wallet is False


def test_only_designated_system_user_can_credit_and_debit_wallets():
    credit_admin = UserResponse(
        id=SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        email="credit@example.test",
        permissions=UserPermissions(is_super_admin=True, can_credit_wallet=True),
    )
    debit_admin = UserResponse(
        id=SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        email="debit@example.test",
        permissions=UserPermissions(is_super_admin=True, can_debit_wallet=True),
    )
    _require_wallet_adjustment_permission(credit_admin, 10)
    _require_wallet_adjustment_permission(debit_admin, -10)

    with pytest.raises(HTTPException) as credit_error:
        _require_wallet_adjustment_permission(
            UserResponse(
                id="other-admin",
                email="other@example.test",
                permissions=UserPermissions(is_super_admin=True, can_debit_wallet=True, can_credit_wallet=True),
            ),
            10,
        )
    assert credit_error.value.status_code == 403

    with pytest.raises(HTTPException) as debit_error:
        _require_wallet_adjustment_permission(
            UserResponse(
                id="other-admin",
                email="other@example.test",
                permissions=UserPermissions(is_super_admin=True, can_debit_wallet=True, can_credit_wallet=True),
            ),
            -10,
        )
    assert debit_error.value.status_code == 403


def test_wallet_freeze_requires_super_admin_scope_and_action_permission():
    super_admin = UserResponse(
        id=SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        email="wallet@example.test",
        permissions=UserPermissions(is_super_admin=True, can_freeze_wallet=True),
    )
    merchant_admin = UserResponse(
        id="merchant-admin",
        email="merchant@example.test",
        permissions=UserPermissions(is_super_admin=False, can_freeze_wallet=True),
    )
    _require_wallet_permission(super_admin, "can_freeze_wallet")

    other_super_admin = UserResponse(
        id="other-admin",
        email="other@example.test",
        permissions=UserPermissions(is_super_admin=True, can_freeze_wallet=True),
    )
    with pytest.raises(HTTPException) as restricted_error:
        _require_wallet_permission(other_super_admin, "can_freeze_wallet")
    assert restricted_error.value.status_code == 403

    with pytest.raises(HTTPException) as error:
        _require_wallet_permission(merchant_admin, "can_freeze_wallet")
    assert error.value.status_code == 403


def test_wallet_admin_identity_check():
    _require_system_wallet_admin(UserResponse(
        id=SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        email="wallet-admin@example.test",
    ))
    with pytest.raises(HTTPException) as error:
        _require_system_wallet_admin(UserResponse(id="owner-1", email="owner@example.test"))
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
