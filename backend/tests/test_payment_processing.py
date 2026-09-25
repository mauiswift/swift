from datetime import timezone

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from core.database import Base
from models.transactions import Transactions
from services.payment_processing import PaymentProcessor
from services.transactions import TransactionsService, is_payment_received


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

        fetched = await processor.get_payment(payment_id=payment["payment_id"])
        assert fetched["payment_id"] == payment["payment_id"]

        updated = await processor.update_payment_status(
            payment_id=payment["payment_id"],
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
async def test_provider_callback_marks_payment_received_before_approval():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        txn = Transactions(
            user_id="user-received",
            transaction_type="swiftpay_qr",
            amount=3500.0,
            currency="PHP",
            external_id="pay-received-1",
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
