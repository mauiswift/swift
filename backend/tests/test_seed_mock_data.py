import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from core.database import db_manager
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.transactions import Transactions
from models.wallets import Wallets
from tools.seed_mock_data import insert_mock_data, require_local_target


def test_require_local_target_rejects_production_and_remote_databases():
    with pytest.raises(RuntimeError, match="require ENVIRONMENT"):
        require_local_target("production", "sqlite+aiosqlite:///:memory:")

    with pytest.raises(RuntimeError, match="localhost"):
        require_local_target(
            "development",
            "postgresql+asyncpg://user:password@db.example.com/payments",
        )

    with pytest.raises(RuntimeError, match="hosted Render or Railway"):
        require_local_target(
            "development",
            "sqlite+aiosqlite:///:memory:",
            render="true",
        )


@pytest.mark.asyncio
async def test_insert_mock_data_is_idempotent(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: AdminUser.metadata.create_all(
                sync_connection,
                tables=[
                    AdminUser.__table__,
                    Wallets.__table__,
                    Transactions.__table__,
                    Disbursements.__table__,
                ],
            )
        )

    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async def ensure_initialized():
        return None

    monkeypatch.setattr(db_manager, "ensure_initialized", ensure_initialized)
    monkeypatch.setattr(db_manager, "async_session_maker", session_maker)

    try:
        assert await insert_mock_data() == {
            "admins": 1,
            "payments": 4,
            "wallets": 3,
            "disbursements": 3,
        }
        assert await insert_mock_data() == {
            "admins": 0,
            "payments": 0,
            "wallets": 0,
            "disbursements": 0,
        }

        async with session_maker() as session:
            counts = {}
            for key, model in (
                ("admins", AdminUser),
                ("payments", Transactions),
                ("wallets", Wallets),
                ("disbursements", Disbursements),
            ):
                counts[key] = await session.scalar(select(func.count()).select_from(model))
        assert counts == {
            "admins": 1,
            "payments": 4,
            "wallets": 3,
            "disbursements": 3,
        }
    finally:
        await engine.dispose()
