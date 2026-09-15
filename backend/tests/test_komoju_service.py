from unittest.mock import AsyncMock

import pytest

from services.komoju_service import KomojuService


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
        amount=50000,
        currency="KRW",
        return_url="https://swiftpay.test/komoju/return",
        external_id="swiftpay-test-1",
        description="KRW test payment",
        payment_types=["credit_card", "kakaopay"],
    )

    assert result["success"] is True
    assert result["payment_id"] == "pay_test_123"
    request = FakeAsyncClient.post.await_args
    assert request.args[0] == "https://komoju.test/api/v1/payments"
    assert request.kwargs["auth"] == ("sk_test_komoju", "")
    assert request.kwargs["data"] == {
        "amount": 50000,
        "currency": "KRW",
        "return_url": "https://swiftpay.test/komoju/return",
        "external_charge_id": "swiftpay-test-1",
        "description": "KRW test payment",
        "payment_types": ["kakaopay"],
    }