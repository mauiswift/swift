from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException

from routers.payment_approvals import (
    _is_krw_payment,
    _require_krw_payment_owner,
    _require_payment_approval_access,
)
from schemas.auth import UserPermissions, UserResponse
from services.admin_notification_handlers import _payment_recipient_ids
from services.admin_notification_service import AdminNotificationService


def _user(user_id: str, *, can_approve_topups: bool = False) -> UserResponse:
    return UserResponse(
        id=user_id,
        email=f"{user_id}@example.com",
        permissions=UserPermissions(can_approve_topups=can_approve_topups),
    )


def test_bot_owner_can_access_payment_approvals_without_extra_permission(monkeypatch):
    from routers import payment_approvals

    monkeypatch.setattr(payment_approvals.settings, "telegram_bot_owner_id", "owner-1")

    _require_payment_approval_access(_user("owner-1"))


def test_only_bot_owner_can_approve_krw(monkeypatch):
    from routers import payment_approvals

    monkeypatch.setattr(payment_approvals.settings, "telegram_bot_owner_id", "owner-1")
    _require_krw_payment_owner(_user("owner-1"))

    with pytest.raises(HTTPException) as exc:
        _require_krw_payment_owner(_user("admin-2", can_approve_topups=True))

    assert exc.value.status_code == 403


def test_krw_detection_uses_original_currency_when_set():
    from types import SimpleNamespace

    assert _is_krw_payment(SimpleNamespace(currency="PHP", original_currency="KRW"))
    assert _is_krw_payment(SimpleNamespace(currency="KRW", original_currency=None))
    assert _is_krw_payment(SimpleNamespace(currency="KRW", original_currency="PHP"))
    assert not _is_krw_payment(SimpleNamespace(currency="PHP", original_currency="USD"))


def test_only_bot_owner_is_selected_for_krw_approval_notifications(monkeypatch):
    from services import admin_notification_handlers

    monkeypatch.setattr(admin_notification_handlers.settings, "telegram_bot_owner_id", "owner-1")

    assert _payment_recipient_ids("KRW") == ["owner-1"]
    assert _payment_recipient_ids("PHP", "KRW") == ["owner-1"]
    assert _payment_recipient_ids("PHP") is None

    monkeypatch.setattr(admin_notification_handlers.settings, "telegram_bot_owner_id", "")
    assert _payment_recipient_ids("KRW") == []


@pytest.mark.asyncio
async def test_targeted_approval_notification_only_sends_to_bot_owner(monkeypatch):
    db = Mock()
    db.add = Mock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    telegram = Mock()
    telegram.send_message = AsyncMock()
    monkeypatch.setattr("services.telegram_service.TelegramService", lambda: telegram)

    notifications = await AdminNotificationService.notify_super_admins(
        db,
        notification_type="payment_received",
        title="KRW payment received",
        message="Payment requires approval",
        resource_type="payment",
        resource_id="42",
        recipient_ids=["owner-1"],
    )

    assert len(notifications) == 1
    assert notifications[0].admin_id == "owner-1"
    telegram.send_message.assert_awaited_once()
    assert telegram.send_message.await_args.kwargs["chat_id"] == "owner-1"
