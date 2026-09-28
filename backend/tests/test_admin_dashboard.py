import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from models.bank_deposit_requests import BankDepositRequest
from models.disbursements import Disbursements
from models.kyb_registrations import KybRegistration
from models.kyc_verifications import KycVerification
from models.topup_requests import TopupRequest
from routers.admin_dashboard import get_admin_dashboard_overview
from schemas.auth import UserPermissions, UserResponse


def _user(*, is_super_admin: bool) -> UserResponse:
    return UserResponse(
        id="system-admin" if is_super_admin else "merchant-admin",
        email="admin@example.test",
        permissions=UserPermissions(is_super_admin=is_super_admin),
    )


@pytest.mark.asyncio
async def test_overview_returns_only_pending_queue_counts():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    tables = [
        KybRegistration.__table__,
        KycVerification.__table__,
        BankDepositRequest.__table__,
        TopupRequest.__table__,
        Disbursements.__table__,
    ]
    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: KybRegistration.metadata.create_all(
                sync_connection,
                tables=tables,
            )
        )

    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            session.add_all([
                KybRegistration(chat_id="kyb-1", status="pending_review"),
                KybRegistration(chat_id="kyb-2", status="pending_review"),
                KybRegistration(chat_id="kyb-3", status="in_progress"),
                KycVerification(chat_id="kyc-1", status="pending_review"),
                KycVerification(chat_id="kyc-2", status="approved"),
                BankDepositRequest(
                    chat_id="deposit-1", channel="GCASH", account_number="1",
                    amount_php=100, status="pending",
                ),
                BankDepositRequest(
                    chat_id="deposit-2", channel="GCASH", account_number="2",
                    amount_php=100, status="approved",
                ),
                TopupRequest(chat_id="topup-1", amount_usdt=10, status="pending"),
                TopupRequest(chat_id="topup-2", amount_usdt=20, status="pending"),
                TopupRequest(chat_id="topup-3", amount_usdt=30, status="rejected"),
                Disbursements(user_id="merchant-1", amount=10, status="pending"),
                Disbursements(user_id="merchant-1", amount=10, status="processing"),
                Disbursements(user_id="merchant-1", amount=10, status="transferring"),
                Disbursements(user_id="merchant-1", amount=10, status="completed"),
            ])
            await session.flush()

            response = await get_admin_dashboard_overview(_user(is_super_admin=True), session)

            assert response.pending_queues.model_dump() == {
                "kyb": 2,
                "kyc": 1,
                "bank_deposits": 1,
                "topups": 2,
                "withdrawals": 3,
            }
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_overview_rejects_non_super_admins():
    with pytest.raises(HTTPException) as error:
        await get_admin_dashboard_overview(_user(is_super_admin=False), None)

    assert error.value.status_code == 403