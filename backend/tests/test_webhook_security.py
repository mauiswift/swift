import hashlib
import hmac

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from core.config import settings
from dependencies.webhook_auth import require_telegram_webhook_secret
from routers import messenger, webhooks


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


@pytest.mark.asyncio
async def test_swiftpay_webhook_rejects_unsigned_payload(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)

    with pytest.raises(HTTPException) as error:
        await webhooks.swiftpay_webhook(_request("/webhooks/swiftpay", b"{}"), object())

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_swiftpay_webhook_accepts_verified_payload(monkeypatch):
    monkeypatch.setattr(webhooks, "SwiftPayService", _SwiftPayVerifier)
    response = await webhooks.swiftpay_webhook(
        _request("/webhooks/swiftpay", b'{"signature":"valid-test-signature"}'),
        object(),
    )

    assert response["success"] is True


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