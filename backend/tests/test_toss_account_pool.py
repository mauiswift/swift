from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from models.toss_account_pool import TossAccountPool
from models.transactions import Transactions
from services.toss_account_pool import assign_toss_account_to_transaction


@pytest.mark.asyncio
async def test_checkout_sessions_randomly_choose_active_accounts_without_immediate_repeats(monkeypatch):
    import services.toss_account_pool as toss_account_pool

    selection_options = []

    def select_last(options):
        selection_options.append([candidate["number"] for candidate in options])
        return options[-1]

    monkeypatch.setattr(toss_account_pool.random, "choice", select_last)
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(TossAccountPool.__table__.create)
        await connection.run_sync(Transactions.__table__.create)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        accounts = [
            TossAccountPool(
                bank_name="Toss Bank",
                account_number="TOSS-100",
                account_holder_name="Pool Account 1",
                is_active=True,
            ),
            TossAccountPool(
                bank_name="Toss Bank",
                account_number="TOSS-200",
                account_holder_name="Pool Account 2",
                is_active=True,
            ),
            TossAccountPool(
                bank_name="Toss Bank",
                account_number="TOSS-300",
                account_holder_name="Inactive Account",
                is_active=False,
            ),
        ]
        session.add_all(accounts)
        await session.commit()

        first = Transactions(
            user_id="merchant-1",
            transaction_type="payment_link",
            amount=1000,
            currency="KRW",
            external_id="KRW-SESSION-1",
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        session.add(first)
        await session.flush()
        first_assignment = await assign_toss_account_to_transaction(session, first)

        second = Transactions(
            user_id="merchant-1",
            transaction_type="payment_link",
            amount=1000,
            currency="KRW",
            external_id="KRW-SESSION-2",
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        session.add(second)
        await session.flush()
        second_assignment = await assign_toss_account_to_transaction(session, second)

        assert first_assignment is not None
        assert second_assignment is not None
        assert first_assignment["number"] == "TOSS-200"
        assert second_assignment["number"] == "TOSS-100"
        assert {first_assignment["number"], second_assignment["number"]}.isdisjoint({"TOSS-300"})
        assert selection_options == [
            ["TOSS-100", "TOSS-200"],
            ["TOSS-100"],
        ]

        # A checkout refresh keeps the account already assigned to that session.
        repeated_assignment = await assign_toss_account_to_transaction(session, first)
        assert repeated_assignment == first_assignment

    await engine.dispose()
