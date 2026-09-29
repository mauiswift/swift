import pytest
from fastapi import HTTPException

from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from routers.admin_dashboard import _can_review_financial_queues
from routers.mini_app import _require_system_wallet_admin
from routers.wallet import _can_approve_crypto_topups, _is_super_admin
from schemas.auth import UserPermissions, UserResponse


def make_user(user_id: str, *, is_super_admin: bool = True) -> UserResponse:
    return UserResponse(
        id=user_id,
        email="admin@example.com",
        permissions=UserPermissions(
            is_super_admin=is_super_admin,
            can_approve_topups=True,
        ),
    )


def test_only_designated_system_user_can_review_wallet_and_payment_queues():
    designated = make_user(SYSTEM_WALLET_ADMIN_TELEGRAM_ID)
    another_admin = make_user("other-admin")

    assert _is_super_admin(designated)
    assert _can_approve_crypto_topups(designated)
    assert _can_review_financial_queues(designated)
    assert not _is_super_admin(another_admin)
    assert not _can_approve_crypto_topups(another_admin)
    assert not _can_review_financial_queues(another_admin)


def test_mini_app_financial_operations_reject_other_admins():
    _require_system_wallet_admin(make_user(SYSTEM_WALLET_ADMIN_TELEGRAM_ID), "forbidden")
    with pytest.raises(HTTPException) as error:
        _require_system_wallet_admin(make_user("other-admin"), "forbidden")
    assert error.value.status_code == 403


def test_mini_app_financial_operations_require_super_admin_for_designated_id():
    with pytest.raises(HTTPException) as error:
        _require_system_wallet_admin(
            make_user(SYSTEM_WALLET_ADMIN_TELEGRAM_ID, is_super_admin=False),
            "forbidden",
        )
    assert error.value.status_code == 403
