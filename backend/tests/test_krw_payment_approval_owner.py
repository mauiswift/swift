from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException

from routers.payment_approvals import (
    _enforce_krw_payment_approver,
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


def test_only_designated_system_user_can_access_payment_approvals():
    _require_payment_approval_access(_user(KRW_PAYMENT_APPROVAL_TELEGRAM_ID))

    for user_id in ("owner-1", "other-admin"):
        with pytest.raises(HTTPException) as exc:
            _require_payment_approval_access(_user(user_id, can_approve_topups=True))
        assert exc.value.status_code == 403


def test_only_designated_system_user_can_approve_krw():
    _require_krw_payment_owner(_user(KRW_PAYMENT_APPROVAL_TELEGRAM_ID))

    with pytest.raises(HTTPException) as exc:
        _require_krw_payment_owner(_user("owner-1", can_approve_topups=True))

    assert exc.value.status_code == 403


def test_transaction_approval_policy_only_forces_designated_krw_approver():
    krw_payment = SimpleNamespace(currency="KRW", original_currency=None)
    php_payment = SimpleNamespace(currency="PHP", original_currency=None)

    assert _enforce_krw_payment_approver(
        krw_payment,
        _user(KRW_PAYMENT_APPROVAL_TELEGRAM_ID),
    ) is True
    assert _enforce_krw_payment_approver(php_payment, _user("merchant-1")) is False

    with pytest.raises(HTTPException) as exc:
        _enforce_krw_payment_approver(krw_payment, _user("other-admin"))

    assert exc.value.status_code == 403


def test_krw_detection_uses_original_currency_when_set():
    from types import SimpleNamespace

    assert _is_krw_payment(SimpleNamespace(currency="PHP", original_currency="KRW"))
    assert _is_krw_payment(SimpleNamespace(currency="KRW", original_currency=None))
    assert _is_krw_payment(SimpleNamespace(currency="KRW", original_currency="PHP"))
    assert not _is_krw_payment(SimpleNamespace(currency="PHP", original_currency="USD"))


@pytest.mark.asyncio
async def test_force_approval_credits_krw_payment_from_any_status():
    from services.transactions import TransactionsService

    db = Mock()
    db.commit = AsyncMock()
    service = TransactionsService(db)
    wallet = SimpleNamespace(id=1, balance=1250.0, organization_id="merchant-1")
    service.credit_wallet_from_transaction = AsyncMock(return_value=(wallet, True))
    service._publish_wallet_credit = AsyncMock()
    txn = SimpleNamespace(
        id=42,
        transaction_type="payment_link",
        external_id="krw-any-status-42",
        amount=1250.0,
        currency="KRW",
        status="cancelled",
        approval_status="rejected",
        paid_at=None,
        user_id="merchant-1",
    )

    approved = await service.approve_payment_link(
        txn,
        approved_by=KRW_PAYMENT_APPROVAL_TELEGRAM_ID,
        note="Approved by designated KRW reviewer",
        force_approval=True,
    )

    assert approved is True
    assert not await service.approve_payment_link(
        txn,
        approved_by=KRW_PAYMENT_APPROVAL_TELEGRAM_ID,
        force_approval=True,
    )
    assert txn.status == "paid"
    assert txn.approval_status == "approved"
    assert txn.approved_by == KRW_PAYMENT_APPROVAL_TELEGRAM_ID
    service._publish_wallet_credit.assert_awaited_once_with(txn, wallet, 1250.0)
    service.credit_wallet_from_transaction.assert_awaited_once_with(
        txn,
        gateway_label="admin-manual",
        wallet_note="Approved by designated KRW reviewer",
    )
    db.commit.assert_awaited_once()


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
async def test_krw_approval_notification_overrides_other_recipient_ids(monkeypatch):
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
        resource_id="43",
        metadata={"currency": "KRW"},
        recipient_ids=["other-admin", "another-admin"],
    )

    assert [notification.admin_id for notification in notifications] == [
        KRW_PAYMENT_APPROVAL_TELEGRAM_ID
    ]
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
