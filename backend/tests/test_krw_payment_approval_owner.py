from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException

from routers.payment_approvals import (
    _is_krw_payment,
    _require_krw_payment_owner,
    _require_payment_approval_access,
)
from core.config import KRW_PAYMENT_APPROVAL_TELEGRAM_ID
from schemas.auth import UserPermissions, UserResponse
from services.admin_notification_handlers import _payment_recipient_ids
from services.admin_notification_service import AdminNotificationService
from routers.telegram_admin_callbacks import process_approval_callback


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
    _require_payment_approval_access(_user(KRW_PAYMENT_APPROVAL_TELEGRAM_ID))


def test_only_bot_owner_can_approve_krw(monkeypatch):
    from routers import payment_approvals

    monkeypatch.setattr(payment_approvals.settings, "telegram_bot_owner_id", "owner-1")
    _require_krw_payment_owner(_user(KRW_PAYMENT_APPROVAL_TELEGRAM_ID))

    with pytest.raises(HTTPException) as exc:
        _require_krw_payment_owner(_user("owner-1", can_approve_topups=True))

    assert exc.value.status_code == 403


def test_krw_detection_uses_original_currency_when_set():
    from types import SimpleNamespace

    assert _is_krw_payment(SimpleNamespace(currency="PHP", original_currency="KRW"))
    assert _is_krw_payment(SimpleNamespace(currency="KRW", original_currency=None))
    assert _is_krw_payment(SimpleNamespace(currency="KRW", original_currency="PHP"))
    assert not _is_krw_payment(SimpleNamespace(currency="PHP", original_currency="USD"))


def test_only_designated_user_is_selected_for_krw_approval_notifications():
    assert _payment_recipient_ids("KRW") == [KRW_PAYMENT_APPROVAL_TELEGRAM_ID]
    assert _payment_recipient_ids("PHP", "KRW") == [KRW_PAYMENT_APPROVAL_TELEGRAM_ID]
    assert _payment_recipient_ids("PHP") is None

    assert _payment_recipient_ids("KRW") == [KRW_PAYMENT_APPROVAL_TELEGRAM_ID]


@pytest.mark.asyncio
async def test_targeted_approval_notification_only_sends_to_designated_telegram_id(monkeypatch):
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
        recipient_ids=[KRW_PAYMENT_APPROVAL_TELEGRAM_ID],
    )

    assert len(notifications) == 1
    assert notifications[0].admin_id == KRW_PAYMENT_APPROVAL_TELEGRAM_ID
    telegram.send_message.assert_awaited_once()
    assert telegram.send_message.await_args.kwargs["chat_id"] == KRW_PAYMENT_APPROVAL_TELEGRAM_ID


@pytest.mark.asyncio
async def test_designated_telegram_user_can_approve_krw_callback_without_broadcast(monkeypatch):
    from routers import telegram_admin_callbacks

    telegram = Mock()
    telegram.send_message = AsyncMock()
    telegram.edit_message_text = AsyncMock()
    telegram.answer_callback_query = AsyncMock()
    monkeypatch.setattr(telegram_admin_callbacks, "TelegramService", lambda: telegram)

    transaction = Mock(
        id=42,
        currency="KRW",
        original_currency=None,
        external_id="krw-payment-42",
    )
    db = Mock()
    db.scalar = AsyncMock(return_value=None)
    db.get = AsyncMock(return_value=transaction)
    approval_service = Mock()
    approval_service.approve_payment_link = AsyncMock(return_value=True)
    monkeypatch.setattr(
        telegram_admin_callbacks,
        "TransactionsService",
        lambda _db: approval_service,
    )

    result = await process_approval_callback(
        {
            "id": "callback-1",
            "data": "approve_payment:42",
            "from": {"id": int(KRW_PAYMENT_APPROVAL_TELEGRAM_ID)},
            "message": {"message_id": 9, "chat": {"id": int(KRW_PAYMENT_APPROVAL_TELEGRAM_ID)}},
        },
        db,
    )

    assert result == {"ok": True}
    approval_service.approve_payment_link.assert_awaited_once()
    telegram.send_message.assert_awaited_once()
    assert telegram.send_message.await_args.kwargs["chat_id"] == int(
        KRW_PAYMENT_APPROVAL_TELEGRAM_ID
    )


@pytest.mark.asyncio
async def test_other_super_admin_cannot_approve_krw_callback(monkeypatch):
    from routers import telegram_admin_callbacks

    telegram = Mock()
    telegram.send_message = AsyncMock()
    telegram.edit_message_text = AsyncMock()
    telegram.answer_callback_query = AsyncMock()
    monkeypatch.setattr(telegram_admin_callbacks, "TelegramService", lambda: telegram)
    monkeypatch.setattr(telegram_admin_callbacks.settings, "telegram_bot_owner_id", "different-owner")

    transaction = Mock(
        id=42,
        currency="KRW",
        original_currency=None,
        external_id="krw-payment-42",
    )
    db = Mock()
    db.scalar = AsyncMock(
        return_value=SimpleNamespace(id=7, is_super_admin=True, name="Other admin")
    )
    db.get = AsyncMock(return_value=transaction)
    approval_service = Mock()
    approval_service.approve_payment_link = AsyncMock(return_value=True)
    monkeypatch.setattr(
        telegram_admin_callbacks,
        "TransactionsService",
        lambda _db: approval_service,
    )

    result = await process_approval_callback(
        {
            "id": "callback-2",
            "data": "approve_payment:42",
            "from": {"id": 111},
            "message": {"message_id": 9, "chat": {"id": 111}},
        },
        db,
    )

    assert result == {"ok": False}
    approval_service.approve_payment_link.assert_not_awaited()
    telegram.send_message.assert_not_awaited()
    telegram.edit_message_text.assert_not_awaited()
    telegram.answer_callback_query.assert_awaited_once()
