import hashlib
import hmac
import json
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from core.config import settings
from dependencies.webhook_auth import require_telegram_webhook_secret
from routers import auth, bot_quick_actions, messenger, webhooks


def _request(path: str, body: bytes, headers: dict[str, str] | None = None) -> Request:
    request_headers = [("content-type", "application/json")]
    request_headers.extend((key.lower(), value) for key, value in (headers or {}).items())
    encoded_headers = [(key.encode(), value.encode()) for key, value in request_headers]
    sent = False

    async def receive():
        nonlocal sent
        if sent:
            return {"type": "http.request", "body": b"", "more_body": False}
        sent = True
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "https",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "headers": encoded_headers,
            "server": ("test", 443),
            "client": ("test", 1),
        },
        receive,
    )


class _SwiftPayVerifier:
    def verify_signature(self, payload, signature):
        assert isinstance(payload, dict)
        return signature == "valid-test-signature"


def test_telegram_webhook_requires_secret_header(monkeypatch):
    monkeypatch.setattr(settings, "telegram_webhook_secret", "telegram-test-secret")

    with pytest.raises(HTTPException) as missing:
        require_telegram_webhook_secret(_request("/telegram/webhook", b"{}"))
    assert missing.value.status_code == 403

    require_telegram_webhook_secret(
        _request(
            "/telegram/webhook",
            b"{}",
            {"X-Telegram-Bot-Api-Secret-Token": "telegram-test-secret"},
        )
    )


def test_legacy_admin_credentials_have_no_production_defaults(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "admin_user_email", "")
    monkeypatch.setattr(settings, "admin_user_password", "")
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)

    assert auth._legacy_admin_credentials() == ("", "")


def test_legacy_admin_credentials_keep_local_development_defaults(monkeypatch):
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "admin_user_email", "")
    monkeypatch.setattr(settings, "admin_user_password", "")
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)

    assert auth._legacy_admin_credentials() == ("admin@paybot.local", "admin123")


def test_bot_quick_action_route_requires_telegram_webhook_secret():
    route = next(route for route in bot_quick_actions.router.routes if route.path.endswith("/bot-actions"))

    assert any(
        dependency.call is require_telegram_webhook_secret
        for dependency in route.dependant.dependencies
    )


def test_webhook_payment_amount_validation_checks_amount_and_currency():
    transaction = SimpleNamespace(amount=500.0, currency="PHP")
    webhooks._validate_payment_amount(
        {"x_amount": "500.00", "x_currency": "PHP"}, transaction, "SwiftPay"
    )

    with pytest.raises(HTTPException) as amount_error:
        webhooks._validate_payment_amount({"amount": "5.00"}, transaction, "Magpie")
    assert amount_error.value.status_code == 400

    with pytest.raises(HTTPException) as missing_amount_error:
        webhooks._validate_payment_amount({}, transaction, "SwiftPay")
    assert missing_amount_error.value.status_code == 400

    with pytest.raises(HTTPException) as currency_error:
        webhooks._validate_payment_amount({"amount": "500", "currency": "USD"}, transaction, "Magpie")
    assert currency_error.value.status_code == 400


def test_stale_non_success_webhook_does_not_downgrade_received_transaction():
    transaction = SimpleNamespace(
        status="paid",
        paid_at=datetime.now(timezone.utc),
        approval_status="approved",
        updated_at=None,
        xendit_id=None,
    )

    assert webhooks._set_non_success_status(transaction, "failed", "provider-id") is False
    assert transaction.status == "paid"
    assert transaction.xendit_id is None


@pytest.mark.asyncio
async def test_swiftpay_webhook_rejects_unsigned_payload(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)

    with pytest.raises(HTTPException) as error:
        await webhooks.swiftpay_webhook(_request("/webhooks/swiftpay", b"{}"), object())

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_swiftpay_webhook_accepts_verified_payload(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)

    class FakeTransactionsService:
        def __init__(self, db):
            self.db = db

        async def find_by_external_or_gateway_id(self, identifier):
            assert identifier == "signed-reference"
            return None

    class FakeDatabase:
        async def scalar(self, query):
            assert query is not None
            return None

    monkeypatch.setattr(webhooks, "TransactionsService", FakeTransactionsService)
    payload = {
        "x_reference_no": "signed-reference",
        "x_payment_status": "PENDING",
        "signature": "valid-test-signature",
    }
    response = await webhooks.swiftpay_webhook(
        _request("/webhooks/swiftpay", json.dumps(payload).encode()),
        FakeDatabase(),
    )

    assert response["success"] is True


@pytest.mark.asyncio
async def test_swiftpay_webhook_uses_only_signed_fields(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)
    transaction = SimpleNamespace(id=1, amount=100, currency="PHP", xendit_id=None)
    lookups = []
    paid_transactions = []

    class FakeTransactionsService:
        def __init__(self, db):
            self.db = db

        async def find_by_external_or_gateway_id(self, identifier):
            lookups.append(identifier)
            return transaction if identifier == "signed-reference" else None

        async def mark_as_paid(self, txn, gateway_label):
            paid_transactions.append((txn, gateway_label))

    class FakeDatabase:
        async def scalar(self, query):
            assert query is not None
            return None

    recorded_webhooks = []

    async def record_webhook(db, **kwargs):
        recorded_webhooks.append((db, kwargs))
        return None

    monkeypatch.setattr(webhooks, "TransactionsService", FakeTransactionsService)
    monkeypatch.setattr(webhooks, "record_verified_payment_webhook", record_webhook)
    payload = {
        "x_reference_no": "signed-reference",
        "x_payment_status": "EXECUTED",
        "x_amount": "100.00",
        "x_currency": "PHP",
        "reference_no": "attacker-reference",
        "status": "FAILED",
        "amount": "900.00",
        "signature": "valid-test-signature",
    }

    response = await webhooks.swiftpay_webhook(
        _request("/webhooks/swiftpay", json.dumps(payload).encode()),
        FakeDatabase(),
    )

    assert response["success"] is True
    assert lookups == ["signed-reference"]
    assert paid_transactions == [(transaction, "SwiftPay")]
    assert len(recorded_webhooks) == 1


@pytest.mark.asyncio
async def test_swiftpay_webhook_rejects_unsigned_reference_alias(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)
    payload = {
        "x_payment_status": "EXECUTED",
        "reference_no": "unsigned-reference",
        "status": "EXECUTED",
        "amount": "100.00",
        "signature": "valid-test-signature",
    }

    with pytest.raises(HTTPException) as error:
        await webhooks.swiftpay_webhook(
            _request("/webhooks/swiftpay", json.dumps(payload).encode()),
            object(),
        )

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_swiftpay_webhook_rejects_unsigned_status_alias(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)
    payload = {
        "x_reference_no": "signed-reference",
        "status": "EXECUTED",
        "amount": "100.00",
        "signature": "valid-test-signature",
    }

    with pytest.raises(HTTPException, match="Missing signed payment status") as error:
        await webhooks.swiftpay_webhook(
            _request("/webhooks/swiftpay", json.dumps(payload).encode()),
            object(),
        )

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_swiftpay_webhook_rejects_unsigned_amount_alias(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)
    transaction = SimpleNamespace(id=1, amount=100, currency="PHP", xendit_id=None)

    class FakeTransactionsService:
        def __init__(self, db):
            self.db = db

        async def find_by_external_or_gateway_id(self, identifier):
            assert identifier == "signed-reference"
            return transaction

    monkeypatch.setattr(webhooks, "TransactionsService", FakeTransactionsService)
    payload = {
        "x_reference_no": "signed-reference",
        "x_payment_status": "EXECUTED",
        "amount": "100.00",
        "signature": "valid-test-signature",
    }

    with pytest.raises(HTTPException, match="Missing SwiftPay payment amount") as error:
        await webhooks.swiftpay_webhook(
            _request("/webhooks/swiftpay", json.dumps(payload).encode()),
            object(),
        )

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_magpie_webhook_verifies_raw_body_hmac(monkeypatch):
    secret = "magpie-test-secret"
    monkeypatch.setattr(settings, "magpie_webhook_secret", secret)
    body = b"{}"

    with pytest.raises(HTTPException) as error:
        await webhooks.magpie_webhook(_request("/webhooks/magpie", body), object())
    assert error.value.status_code == 403

    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    response = await webhooks.magpie_webhook(
        _request("/webhooks/magpie", body, {"X-Magpie-Signature": signature}),
        object(),
    )
    assert response["success"] is True


@pytest.mark.asyncio
async def test_messenger_webhook_rejects_missing_signature(monkeypatch):
    monkeypatch.setattr(settings, "messenger_app_secret", "messenger-test-secret")

    with pytest.raises(HTTPException) as error:
        await messenger.receive_webhook(_request("/messenger/webhook", b'{"object":"page"}'), object())

    assert error.value.status_code == 403