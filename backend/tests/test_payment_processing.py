from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from core.database import Base
from models.transactions import Transactions
from services.payment_processing import PaymentProcessor
from services.transactions import (
    TransactionsService,
    get_payment_status,
    is_payment_received,
)


def test_payment_status_is_separate_from_admin_approval_state():
    awaiting_payment = Transactions(status="pending", paid_at=None)
    provider_confirmed = Transactions(
        status="pending",
        paid_at=datetime.now(timezone.utc),
    )
    provider_succeeded = Transactions(status="succeeded", paid_at=None)

    assert get_payment_status(awaiting_payment) == "pending"
    assert get_payment_status(provider_confirmed) == "paid"
    assert get_payment_status(provider_succeeded) == "succeeded"


@pytest.mark.asyncio
async def test_create_and_mark_payment_flow():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        processor = PaymentProcessor(session)
        payment = await processor.create_payment(
            user_id="user-1",
            amount=125.5,
            description="Starter payment",
            currency="PHP",
            metadata={"source": "test"},
        )

        assert payment["status"] == "pending"
        assert payment["payment_id"]
        assert payment["amount"] == 125.5

        fetched = await processor.get_payment(
            payment_id=payment["payment_id"],
            user_id="user-1",
        )
        assert fetched["payment_id"] == payment["payment_id"]

        with pytest.raises(LookupError):
            await processor.get_payment(payment_id=payment["payment_id"], user_id="user-2")

        with pytest.raises(LookupError):
            await processor.update_payment_status(
                payment_id=payment["payment_id"],
                user_id="user-2",
                status="cancelled",
                provider_reference="attacker-reference",
            )

        updated = await processor.update_payment_status(
            payment_id=payment["payment_id"],
            user_id="user-1",
            status="paid",
            provider_reference="prov-123",
        )
        assert updated["status"] == "pending"
        assert updated["provider_reference"] == "prov-123"
        fetched = await session.get(Transactions, payment["transaction_id"])
        assert fetched is not None
        assert fetched.paid_at is not None
        assert is_payment_received(fetched) is True

    await engine.dispose()


@pytest.mark.asyncio
async def test_mark_as_paid_sets_paid_at_timestamp():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-2",
            transaction_type="payment",
            amount=99.0,
            currency="PHP",
            external_id="pay-123",
            status="pending",
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        ok = await TransactionsService(session).mark_as_paid(txn, gateway_label="manual")

        assert ok is True
        assert txn.status == "paid"
        assert txn.paid_at is not None
        assert txn.paid_at.tzinfo is not None
        assert txn.paid_at.utcoffset() == timezone.utc.utcoffset(txn.paid_at)

    await engine.dispose()


@pytest.mark.asyncio
async def test_provider_callback_marks_payment_received_before_approval(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    published_events = []
    monkeypatch.setattr(
        "services.transactions.payment_event_bus.publish",
        lambda event: published_events.append(event.copy()),
    )

    async with async_session() as session:
        txn = Transactions(
            user_id="user-received",
            transaction_type="swiftpay_qr",
            amount=3500.0,
            currency="PHP",
            external_id="pay-received-1",
            xendit_id="gateway-receipt-1",
            status="pending",
            customer_name="Test Customer",
            customer_email="customer@example.com",
            sender_name="Payer Name",
            sender_bank="Test Bank",
            order_no="ORDER-123",
            description="Test order payment",
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        ok = await TransactionsService(session).mark_as_paid(txn, gateway_label="SwiftPay")

        assert ok is True
        assert txn.status == "pending"
        assert txn.approval_status == "pending"
        assert txn.paid_at is not None
        assert is_payment_received(txn) is True
        assert [event["event_type"] for event in published_events] == ["payment_received"]
        receipt_event = published_events[0]
        assert receipt_event["gateway_reference"] == "gateway-receipt-1"
        assert receipt_event["customer_name"] == "Test Customer"
        assert receipt_event["customer_email"] == "customer@example.com"
        assert receipt_event["sender_name"] == "Payer Name"
        assert receipt_event["sender_bank"] == "Test Bank"
        assert receipt_event["order_no"] == "ORDER-123"
        assert receipt_event["paid_at"] == txn.paid_at.isoformat()

        # Repeated provider callbacks must not send duplicate receipt alerts.
        await TransactionsService(session).mark_as_paid(txn, gateway_label="SwiftPay")
        assert [event["event_type"] for event in published_events] == ["payment_received"]

    await engine.dispose()


def test_admin_bot_notifications_subscribe_to_receipts_not_payment_creation(monkeypatch):
    from services.admin_notification_handlers import register_notification_handlers
    from services.event_bus import EventBus

    monkeypatch.setattr(EventBus, "_subscribers", {})
    register_notification_handlers()

    assert "payment_received" in EventBus._subscribers
    assert "payment_created" in EventBus._subscribers
    assert "payment_link_created" in EventBus._subscribers


def test_payment_received_alert_formats_available_payment_details():
    from services.admin_notification_handlers import _format_payment_received_message

    message = _format_payment_received_message({
        "payment_id": "42",
        "external_id": "PAY-42",
        "gateway_reference": "GW-42",
        "gateway": "SwiftPay",
        "user_id": "merchant-7",
        "customer_name": "Test Customer",
        "customer_email": "customer@example.com",
        "sender_name": "Payer Name",
        "sender_bank": "Test Bank",
        "amount": 3500.0,
        "currency": "PHP",
        "original_amount": 100.0,
        "original_currency": "USD",
        "transaction_type": "swiftpay_qr",
        "order_no": "ORDER-123",
        "description": "Test order payment",
        "status": "pending",
        "approval_status": "pending",
        "paid_at": "2026-09-26T00:00:00+00:00",
        "bank_name": "Receiving Bank",
        "bank_account_name": "SwiftPay Inc.",
        "bank_account_number": "123456789",
        "bank_account_reference": "BANK-REF-9",
    })

    for detail in (
        "Payment record: 42",
        "Payment reference: PAY-42",
        "Gateway reference: GW-42",
        "Gateway: SwiftPay",
        "Merchant ID: merchant-7",
        "Customer: Test Customer",
        "Customer email: customer@example.com",
        "Payer name: Payer Name",
        "Payer bank: Test Bank",
        "Amount: 3,500.00 PHP",
        "Original amount: 100.00 USD",
        "Payment type: swiftpay_qr",
        "Order number: ORDER-123",
        "Description: Test order payment",
        "Approval status: pending",
        "Received at (UTC): 2026-09-26T00:00:00+00:00",
        "Receiving bank: Receiving Bank",
        "Receiving account name: SwiftPay Inc.",
        "Receiving account number: 123456789",
        "Bank reference: BANK-REF-9",
    ):
        assert detail in message


@pytest.mark.asyncio
async def test_payment_creation_notification_does_not_send_telegram(monkeypatch):
    from models.admin_users import AdminUser
    from services.admin_notification_service import AdminNotificationService

    admin = AdminUser(telegram_id="123456", is_super_admin=True, is_active=True)
    result = MagicMock()
    result.scalars.return_value.all.return_value = [admin]
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    telegram = MagicMock()
    telegram.send_message = AsyncMock()
    monkeypatch.setattr(
        "services.telegram_service.TelegramService",
        lambda: telegram,
    )

    await AdminNotificationService.notify_super_admins(
        db,
        notification_type="payment_created",
        title="New Payment Request",
        message="Payment has not been received.",
        resource_type="payment",
        resource_id="123",
        send_telegram=False,
    )

    telegram.send_message.assert_not_awaited()


@pytest.mark.asyncio
async def test_provider_callback_outside_php_range_stays_pending_for_admin_approval():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-3",
            transaction_type="swiftpay_qr",
            amount=75000.0,
            currency="PHP",
            external_id="pay-high-1",
            status="pending",
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        ok = await TransactionsService(session).mark_as_paid(txn, gateway_label="SwiftPay")

        assert ok is True
        assert txn.status == "pending"
        assert txn.approval_status == "pending"
        assert txn.paid_at is not None
        assert is_payment_received(txn) is True

    await engine.dispose()


@pytest.mark.asyncio
async def test_provider_callback_within_php_range_stays_pending_for_admin_approval():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-4",
            transaction_type="swiftpay_qr",
            amount=1500.0,
            currency="PHP",
            external_id="pay-low-1",
            status="pending",
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        ok = await TransactionsService(session).mark_as_paid(txn, gateway_label="SwiftPay")

        assert ok is True
        assert txn.status == "pending"
        assert txn.approval_status == "pending"
        assert txn.paid_at is not None
        assert is_payment_received(txn) is True

    await engine.dispose()


@pytest.mark.asyncio
async def test_provider_callback_records_receipt_when_transaction_was_already_completed():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-previously-completed",
            transaction_type="payment",
            amount=1500.0,
            currency="PHP",
            external_id="pay-previously-completed",
            status="completed",
            approval_status="pending",
            paid_at=None,
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        ok = await TransactionsService(session).mark_as_paid(txn, gateway_label="SwiftPay")

        assert ok is True
        assert txn.status == "pending"
        assert txn.approval_status == "pending"
        assert txn.paid_at is not None
        assert is_payment_received(txn) is True

    await engine.dispose()


@pytest.mark.asyncio
async def test_non_swiftpay_provider_callback_stays_pending_for_admin_approval():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-5",
            transaction_type="payment",
            amount=75000.0,
            currency="PHP",
            external_id="pay-magpie-1",
            status="pending",
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        ok = await TransactionsService(session).mark_as_paid(txn, gateway_label="Magpie")

        assert ok is True
        assert txn.status == "pending"
        assert txn.approval_status == "pending"
        assert txn.paid_at is not None
        assert is_payment_received(txn) is True

    await engine.dispose()


@pytest.mark.asyncio
async def test_admin_approval_service_marks_customer_payment_approved_once():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-6",
            transaction_type="payment",
            amount=250.0,
            currency="PHP",
            external_id="pay-admin-1",
            status="pending",
            approval_status="pending",
            paid_at=datetime.now(timezone.utc),
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        service = TransactionsService(session)
        assert await service.approve_payment_link(txn, approved_by="admin-1", note="Verified")
        assert txn.status == "paid"
        assert txn.approval_status == "approved"
        assert txn.approved_by == "admin-1"
        assert txn.approved_at is not None

        assert not await service.approve_payment_link(txn, approved_by="admin-2")

    await engine.dispose()


@pytest.mark.asyncio
async def test_admin_approval_accepts_provider_success_statuses():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-success",
            transaction_type="payment",
            amount=250.0,
            currency="PHP",
            external_id="pay-success-1",
            status="succeeded",
            approval_status="pending",
            paid_at=datetime.now(timezone.utc),
            created_at=None,
            updated_at=None,
        )
        session.add(txn)
        await session.commit()
        await session.refresh(txn)

        service = TransactionsService(session)
        assert await service.approve_payment_link(txn, approved_by="admin-1", note="Verified")
        assert txn.status == "paid"
        assert txn.approval_status == "approved"
        assert txn.approved_by == "admin-1"

    await engine.dispose()


@pytest.mark.asyncio
async def test_customer_payment_cannot_be_approved_before_provider_receipt():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        txn = Transactions(
            user_id="user-unpaid",
            transaction_type="payment",
            amount=100.0,
            currency="PHP",
            external_id="pay-unpaid-1",
            status="pending",
            approval_status="pending",
        )
        session.add(txn)
        await session.commit()

        approved = await TransactionsService(session).approve_payment_link(
            txn,
            approved_by="super-admin-1",
        )

        assert approved is False
        assert txn.status == "pending"
        assert txn.approval_status == "pending"

    await engine.dispose()
