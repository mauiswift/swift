import os
import hmac
import hashlib
import json
import time
from pathlib import Path

os.environ.setdefault("ENVIRONMENT", "test")

# Ensure minimal env vars for app startup (mirrors backend/tests/test_bot.py)
import tempfile
_tmp_db_dir = Path(tempfile.gettempdir())
_os_db_path = _tmp_db_dir / f"test_paybot_{os.getpid()}.db"
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_os_db_path.as_posix()}")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-ci")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "123456:TEST_BOT_TOKEN")
os.environ.setdefault("TELEGRAM_ADMIN_IDS", "123456789")

from fastapi.testclient import TestClient
from main import app

MAGPIE_SECRET = os.environ.get("MAGPIE_WEBHOOK_SECRET", "")


def _signed_body(payload: dict, secret: str):
    body = json.dumps(payload).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return body, sig


def test_magpie_webhook_marks_transaction_paid(tmp_path, monkeypatch):
    """When Magpie sends a payment completed webhook, the transaction should be marked paid."""
    # Arrange: create a pending transaction via TransactionsService.create_transaction
    from core.database import db_manager
    from services.transactions import TransactionsService

    async def _create_pending_txn():
        async with db_manager.async_session_maker() as db:
            svc = TransactionsService(db)
            txn = await svc.create_transaction(
                user_id="test-user",
                transaction_type="invoice",
                amount=100.0,
                external_id="mp-ext-123",
                gateway_id="mp-checkout-123",
                description="test webhook",
                status="pending",
            )
            return txn.id

    # Use TestClient as context to ensure app startup runs and DB session maker is initialized
    from core.database import db_manager
    from services.transactions import TransactionsService
    import asyncio

    with TestClient(app) as client:
        # run coroutine to create txn using a fresh event loop
        loop = asyncio.new_event_loop()
        try:
            txn_id = loop.run_until_complete(_create_pending_txn())
        finally:
            loop.close()

        # Prepare webhook payload matching Magpie's successful payment shape
        payload = {
            "event": "payment.completed",
            "data": {
                "external_id": "mp-ext-123",
                "checkout_id": "mp-checkout-123",
                "status": "COMPLETED",
                "amount": 10000,
            }
        }

        body = json.dumps(payload).encode("utf-8")
        headers = {}
        if MAGPIE_SECRET:
            sig = hmac.new(MAGPIE_SECRET.encode("utf-8"), body, hashlib.sha256).hexdigest()
            headers["X-Magpie-Signature"] = sig

        # Act
        r = client.post("/magpie/webhook", data=body, headers=headers)
        assert r.status_code == 200
        assert r.json().get("success") is True

        # Assert: transaction status becomes 'paid'
        async def _check_txn():
            async with db_manager.async_session_maker() as db:
                svc = TransactionsService(db)
                # find by external id
                txn = await svc.find_by_external_or_gateway_id("mp-ext-123")
                return txn.status if txn else None

        loop = asyncio.new_event_loop()
        try:
            status = loop.run_until_complete(_check_txn())
        finally:
            loop.close()
        assert status == "paid"
