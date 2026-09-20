import os
import asyncio
import uuid

os.environ["JWT_SECRET_KEY"] = "devsecret"
os.environ["TELEGRAM_BOT_TOKEN"] = "123"
os.environ["TELEGRAM_BOT_USERNAME"] = "bot"
os.environ["TELEGRAM_ADMIN_IDS"] = "1"
os.environ["DISABLE_BACKGROUND_TASKS"] = "1"

from fastapi.testclient import TestClient
from sqlalchemy import select

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


def test_checkout_institution_rejects_swiftpay_for_php_above_50000():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=60000.0,
                    external_id=f"checkout-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-seed-high",
                    description="high value checkout",
                    customer_name="Demo",
                    customer_email="demo@example.com",
                    payment_url="/checkout/high",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/institution",
            json={"institution_code": "GCASH"},
        )

        assert response.status_code == 400
        assert "Only PHP 1 to PHP 50,000 can use SwiftPay institution checkout" in response.json()["detail"]


def test_fixed_payment_link_creates_reusable_payment_attempt():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=125.0,
                    external_id=f"reusable-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-reusable",
                    description="Reusable checkout",
                    payment_url="/checkout/reusable",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/institution",
            json={"institution_code": "GCASH"},
        )

        # The external provider is unavailable in the test environment, but the
        # endpoint must have created a separate attempt before provider handling.
        assert response.status_code != 404

        async def count_attempts():
            async for session in get_db():
                result = await session.execute(
                    select(Transactions).where(
                        Transactions.external_id.like(f"{txn.external_id}-PAY-%")
                    )
                )
                return len(result.scalars().all())

        assert asyncio.run(count_attempts()) == 1


def test_legacy_gcash_redirect_uses_internal_swiftpay_gcash_page():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="swiftpay_qr",
                    amount=125.0,
                    external_id=f"gcash-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-gcash",
                    description="GCash checkout",
                    payment_url="gcash://com.mynt.gcash/app/006300000700",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.get(
            f"/api/v1/payments/checkout/{txn.external_id}/gcash",
            follow_redirects=False,
        )

        assert response.status_code == 307
        assert response.headers["location"].startswith(f"/checkout/{txn.external_id}/gcash?payment_method=qrph")
