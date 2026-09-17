from unittest.mock import AsyncMock
from types import SimpleNamespace
import base64

import pytest

from services.komoju_service import KomojuService
from services.payment_gateway import _is_test_mode_enabled


class FakeResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "id": "pay_test_123",
            "currency": "KRW",
            "payment_url": "https://komoju.com/pay/pay_test_123",
        }


class FakeAsyncClient:
    response = FakeResponse()
    post = AsyncMock(return_value=response)

    def __init__(self, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None


@pytest.mark.asyncio
async def test_komoju_direct_payment_sends_krw_contract(monkeypatch):
    monkeypatch.setattr("services.komoju_service.settings.komoju_secret_key", "sk_test_komoju")
    monkeypatch.setattr("services.komoju_service.settings.komoju_base_url", "https://komoju.test/api/v1")
    monkeypatch.setattr("httpx.AsyncClient", FakeAsyncClient)

    service = KomojuService()
    result = await service.create_payment(
        amount=1937.98,
        currency="PHP",
        return_url="https://swiftpay.test/komoju/return",
        external_id="swiftpay-test-1",
        description="KRW test payment",
        payment_types=["credit_card", "kakaopay"],
        source_currency="KRW",
        source_amount=50000,
    )

    assert result["success"] is True
    assert result["payment_id"] == "pay_test_123"
    request = FakeAsyncClient.post.await_args
    assert request.args[0] == "https://komoju.test/api/v1/payments"
    expected_credentials = base64.b64encode(b"sk_test_komoju:").decode("ascii")
    assert request.kwargs["headers"] == {"Authorization": f"Basic {expected_credentials}"}
    assert request.kwargs["data"] == [
        ("amount", 1938),
        ("currency", "PHP"),
        ("return_url", "https://swiftpay.test/komoju/return"),
        ("external_charge_id", "swiftpay-test-1"),
        ("description", "KRW test payment"),
        ("payment_types[]", "kakaopay"),
    ]


@pytest.mark.asyncio
@pytest.mark.parametrize("test_mode, expected", [(False, False), (True, True)])
async def test_komoju_requires_the_krw_test_toggle(test_mode, expected):
    admin = SimpleNamespace(telegram_id="merchant-1", test_mode=test_mode)
    result = SimpleNamespace(scalar_one_or_none=lambda: admin)
    db = SimpleNamespace(execute=AsyncMock(return_value=result))

    assert await _is_test_mode_enabled(db, "merchant-1") is expected