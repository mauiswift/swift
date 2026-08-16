import os
import asyncio
import uuid

os.environ["JWT_SECRET_KEY"] = "devsecret"
os.environ["TELEGRAM_BOT_TOKEN"] = "123"
os.environ["TELEGRAM_BOT_USERNAME"] = "bot"
os.environ["TELEGRAM_ADMIN_IDS"] = "1"
os.environ["DISABLE_BACKGROUND_TASKS"] = "1"

from fastapi.testclient import TestClient

from core.database import get_db
from main import app
from services.transactions import TransactionsService


def test_public_transaction_lookup_returns_transaction():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment",
                    amount=12.5,
                    external_id=f"checkout-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-seed",
                    description="seeded checkout",
                    customer_name="Demo",
                    customer_email="demo@example.com",
                    payment_url="https://swiftpay.site/checkout",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.get(f"/api/v1/entities/transactions/public/{txn.external_id}")

        assert response.status_code == 200
        payload = response.json()
        assert payload["external_id"] == txn.external_id
        assert payload["status"] == "pending"
        assert payload["amount"] == 12.5
