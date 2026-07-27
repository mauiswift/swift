import os
import json
import pytest
import httpx
from pathlib import Path
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "test"
import tempfile
_tmp_db_dir = Path(tempfile.gettempdir())
_os_db_path = _tmp_db_dir / f"test_paybot_{os.getpid()}.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_os_db_path.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-ci"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456:TEST_BOT_TOKEN"
os.environ["TELEGRAM_ADMIN_IDS"] = "123456789"
os.environ["SWIFTPAY_ACCESS_KEY"] = "ABC123"
os.environ["SWIFTPAY_SECRET_KEY"] = "SECRET"
os.environ["SWIFTPAY_MODE"] = "sandbox"

from importlib import reload
import core.config as core_config
reload(core_config)
from main import app
from services.swiftpay_service import SwiftPayService


class DummyResponse:
    def __init__(self, status_code=200, json_data=None, text=None):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text if text is not None else json.dumps(self._json_data)

    def json(self):
        return self._json_data


class DummyClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json=None, headers=None):
        return DummyResponse(status_code=200, json_data={"customerRedirectUrl": "https://pay.swiftpay.ph/redirect", "paymentId": "pay-123"})

    async def get(self, url, headers=None):
        return DummyResponse(status_code=200, json_data=[{"code": "GCASH", "name": "GCash"}])


@pytest.mark.asyncio
async def test_sign_and_verify_payload():
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()

    payload = {
        "x_access_key": svc.access_key,
        "x_reference_no": "ref-123",
        "x_amount": "100.00",
        "x_currency": "PHP",
        "details": {"customerName": "John Doe"},
        "generate_customer_redirect_url": True,
    }
    signature = svc._sign_payload(payload)
    assert svc.verify_signature(payload, signature)


@pytest.mark.asyncio
async def test_create_order_calls_swiftpay(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()
    monkeypatch.setattr(httpx, "AsyncClient", DummyClient)

    result = await svc.create_order(
        amount=123.45,
        reference_no="ref-456",
        details={"customerName": "Jane"},
    )
    assert result["success"] is True
    assert result["data"]["customerRedirectUrl"] == "https://pay.swiftpay.ph/redirect"


@pytest.mark.asyncio
async def test_create_order_retries_on_duplicate_reference(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()

    attempt_counter = {"count": 0}

    class DuplicateReferenceClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json=None, headers=None):
            attempt_counter["count"] += 1
            if attempt_counter["count"] == 1:
                return DummyResponse(status_code=400, json_data={"errorCode": "DUPLICATED_REFERENCE_NO", "errorMessage": "Non-unique reference no"})
            return DummyResponse(status_code=200, json_data={"customerRedirectUrl": "https://pay.swiftpay.ph/redirect", "paymentId": "pay-123"})

    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: DuplicateReferenceClient(*args, **kwargs))

    result = await svc.create_order(
        amount=123.45,
        reference_no="ref-456",
        details={"customerName": "Jane"},
    )
    assert result["success"] is True
    assert result["reference_no"] != "ref-456"


@pytest.mark.asyncio
async def test_create_order_payload_structure(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, json_data={"customerRedirectUrl": "http://ok", "paymentId": "123"})

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    await svc.create_order(
        amount=100.0,
        reference_no="test-ref",
        details=[{"customerName": "John"}],
    )

    # x_currency should NOT be in the payload for create_order
    assert "x_currency" not in captured_payload
    # details should be a list
    assert isinstance(captured_payload["details"], list)
    assert captured_payload["details"][0]["customerName"] == "John"
    # x_ fields should be present
    assert "x_access_key" in captured_payload
    assert "x_amount" in captured_payload
    assert captured_payload["x_amount"] == "100.00"


@pytest.mark.asyncio
async def test_send_disbursement_payload(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, text="") # Empty body means scheduled

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    res = await svc.send_disbursement(
        reference_no="DISB-123",
        amount=500.0,
        bank_code="GCASH",
        account_number="09123456789",
        first_name="Juan",
        last_name="Cruz",
        city="Manila",
        postal_code="1000",
    )

    assert res["success"] is True
    assert captured_payload["merchantReferenceNo"] == "DISB-123"
    assert captured_payload["recipientInformation"]["firstName"] == "Juan"
    assert captured_payload["recipientInformation"]["address"]["city"] == "Manila"
    assert captured_payload["creditInformation"]["amount"] == "500.00"


@pytest.mark.asyncio
async def test_get_institutions_calls_swiftpay(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()
    monkeypatch.setattr(httpx, "AsyncClient", DummyClient)

    result = await svc.get_institutions()
    assert result["success"] is True
    assert isinstance(result["data"], list)


def test_swiftpay_webhook_accepts_form_encoded_payload():
    svc = SwiftPayService()
    payload = {
        "x_access_key": svc.access_key,
        "x_reference_no": "ref-form-123",
        "x_payment_status": "EXPIRED",
        "x_payment_id": "pay-form-123",
    }
    signature = svc._sign_payload(payload)
    payload["signature"] = signature

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/swiftpay/webhook",
            data=payload,
            headers={"content-type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "no matching transaction"
