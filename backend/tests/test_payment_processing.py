import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from core.database import Base
from models.transactions import Transactions
from services.payment_processing import PaymentProcessor


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
        assert updated["status"] == "paid"
        assert updated["provider_reference"] == "prov-123"

    await engine.dispose()
