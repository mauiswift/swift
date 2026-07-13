import os
import json
import pytest
import httpx
from pathlib import Path

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
async def test_get_institutions_calls_swiftpay(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()
    monkeypatch.setattr(httpx, "AsyncClient", DummyClient)

    result = await svc.get_institutions()
    assert result["success"] is True
    assert isinstance(result["data"], list)
