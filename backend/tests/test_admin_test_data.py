import pytest
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from models.admin_users import AdminUser
from models.audit_logs import AuditLog
from models.disbursements import Disbursements
from models.manual_deposit_receipts import ManualDepositReceipt
from models.refunds import Refunds
from models.transactions import Transactions
from models.wallet_transactions import Wallet_transactions
from models.wallets import Wallets
from routers.admin_test_data import (
    ClearTestDataRequest,
    clear_test_data,
    preview_test_data,
)
from schemas.auth import UserPermissions, UserResponse


def _user(*, is_super_admin: bool) -> UserResponse:
    return UserResponse(
        id="super-admin-telegram-id" if is_super_admin else "merchant-telegram-id",
        email="super@example.test" if is_super_admin else "merchant@example.test",
        permissions=UserPermissions(is_super_admin=is_super_admin),
    )


@pytest.mark.asyncio
async def test_preview_and_clear_only_affect_non_super_admin_test_mode_merchants():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    tables = [
        AdminUser.__table__,
        Transactions.__table__,
        Disbursements.__table__,
        Wallet_transactions.__table__,
        Refunds.__table__,
        ManualDepositReceipt.__table__,
        Wallets.__table__,
        AuditLog.__table__,
    ]
    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: AdminUser.metadata.create_all(
                sync_connection,
                tables=tables,
            )
        )

    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            session.add_all(
                [
                    AdminUser(
                        telegram_id="test-merchant",
                        email="test-merchant@example.test",
                        test_mode=True,
                        is_super_admin=False,
                    ),
                    AdminUser(
                        telegram_id="live-merchant",
                        email="live-merchant@example.test",
                        test_mode=False,
                        is_super_admin=False,
                    ),
                    AdminUser(
                        telegram_id="test-super-admin",
                        email="test-super-admin@example.test",
                        test_mode=True,
                        is_super_admin=True,
                    ),
                ]
            )
            await session.flush()
            session.add_all(
                [
                    Transactions(
                        user_id=user_id,
                        transaction_type="payment_link",
                        amount=100,
                        currency="PHP",
                        status="pending",
                    )
                    for user_id in ("test-merchant", "live-merchant", "test-super-admin")
                ]
            )
            test_merchant = await session.scalar(
                select(AdminUser).where(AdminUser.telegram_id == "test-merchant")
            )
            assert test_merchant is not None
            session.add(
                Transactions(
                    user_id=str(test_merchant.id),
                    transaction_type="payment_link",
                    amount=125,
                    currency="PHP",
                    status="pending",
                )
            )
            session.add_all(
                [
                    Disbursements(
                        user_id=user_id,
                        amount=50,
                        currency="PHP",
                        status="pending",
                    )
                    for user_id in ("test-merchant", "live-merchant", "test-super-admin")
                ]
            )
            session.add(
                Disbursements(
                    user_id=str(test_merchant.id),
                    amount=75,
                    currency="PHP",
                    status="pending",
                )
            )
            session.add_all(
                [
                    Wallet_transactions(
                        user_id=user_id,
                        wallet_id=1,
                        transaction_type="credit",
                        amount=50,
                        status="completed",
                    )
                    for user_id in ("test-merchant", "live-merchant")
                ]
            )
            session.add_all(
                [
                    Refunds(
                        user_id=user_id,
                        amount=20,
                        status="completed",
                    )
                    for user_id in ("test-merchant", "live-merchant")
                ]
            )
            session.add_all(
                [
                    ManualDepositReceipt(
                        user_id=user_id,
                        file_path=f"/tmp/{user_id}-receipt.png",
                        amount=30,
                        status="pending",
                    )
                    for user_id in ("test-merchant", "live-merchant")
                ]
            )
            session.add_all(
                [
                    Wallets(
                        user_id=user_id,
                        currency="PHP",
                        balance=500,
                        available_balance=500,
                        pending_balance=0,
                    )
                    for user_id in ("test-merchant", "live-merchant")
                ]
            )
            await session.commit()

            preview = await preview_test_data(_user(is_super_admin=True), session)
            assert preview == {
                "eligible_test_merchants": 1,
                "payment_transactions": 2,
                "disbursements": 2,
                "wallet_transactions": 1,
                "refunds": 1,
                "deposit_receipts": 1,
            }

            result = await clear_test_data(
                ClearTestDataRequest(confirmation="CLEAR TEST RECORDS"),
                _user(is_super_admin=True),
                session,
            )
            assert result == {
                "success": True,
                "payment_transactions": 2,
                "disbursements": 2,
                "wallet_transactions": 1,
                "refunds": 1,
                "deposit_receipts": 1,
            }

            remaining = {
                "payment_transactions": await session.scalar(select(func.count()).select_from(Transactions)),
                "disbursements": await session.scalar(select(func.count()).select_from(Disbursements)),
                "wallet_transactions": await session.scalar(select(func.count()).select_from(Wallet_transactions)),
                "refunds": await session.scalar(select(func.count()).select_from(Refunds)),
                "deposit_receipts": await session.scalar(select(func.count()).select_from(ManualDepositReceipt)),
            }
            assert remaining == {
                "payment_transactions": 2,
                "disbursements": 2,
                "wallet_transactions": 1,
                "refunds": 1,
                "deposit_receipts": 1,
            }
            test_wallet_balance = await session.scalar(
                select(Wallets.balance).where(Wallets.user_id == "test-merchant")
            )
            assert test_wallet_balance == 500
            audit_count = await session.scalar(select(func.count()).select_from(AuditLog))
            assert audit_count == 1

    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_preview_and_clear_require_super_admin():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: AdminUser.metadata.create_all(
                sync_connection,
                tables=[
                    AdminUser.__table__,
                    Transactions.__table__,
                    Disbursements.__table__,
                    Wallet_transactions.__table__,
                    Refunds.__table__,
                    ManualDepositReceipt.__table__,
                ],
            )
        )

    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            with pytest.raises(HTTPException) as preview_error:
                await preview_test_data(_user(is_super_admin=False), session)
            assert preview_error.value.status_code == 403

            with pytest.raises(HTTPException) as clear_error:
                await clear_test_data(
                    ClearTestDataRequest(confirmation="CLEAR TEST RECORDS"),
                    _user(is_super_admin=False),
                    session,
                )
            assert clear_error.value.status_code == 403
    finally:
        await engine.dispose()
