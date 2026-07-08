import asyncio
import json
import pytest
from fastapi.testclient import TestClient

from services.magpie_service import MagpieService
import routers.magpie as magpie_router
import services.transactions as transactions_module
import services


class DummyResp:
    def __init__(self, status_code, text, data):
        self.status_code = status_code
        self._text = text
        self._data = data

    @property
    def text(self):
        return self._text

    def json(self):
        return self._data


class SeqClient:
    """A test double for httpx.AsyncClient that returns sequential responses from a list."""
    def __init__(self, responses):
        self._responses = list(responses)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json=None, headers=None):
        # pop first response
        if not self._responses:
            raise RuntimeError("No more canned responses")
        resp = self._responses.pop(0)
        return resp


@pytest.mark.asyncio
async def test_magpie_service_checkout_and_qr(monkeypatch):
    # Simulate Magpie returning checkout success then QR success
    checkout_data = {"checkout_id": "co_123", "checkout_url": "https://magpie/checkout/co_123", "external_id": "ext123"}
    qr_data = {"qr_id": "qr_123", "qr_content": "https://magpie/qr/qr_123", "external_id": "extqr"}

    responses = [
        DummyResp(200, json.dumps(checkout_data), checkout_data),
        DummyResp(200, json.dumps(qr_data), qr_data),
    ]

    client_instance = SeqClient(responses)
    monkeypatch.setattr("httpx.AsyncClient", lambda *args, **kwargs: client_instance)

    svc = MagpieService()
    svc.api_key = "test"

    checkout = await svc.create_checkout(amount=100.0, description="test", external_id="ext123")
    assert checkout.get("success")
    assert checkout.get("checkout_id") == "co_123"

    qr = await svc.create_qr_payment(amount=111.0, description="qr", external_id="extqr")
    assert qr.get("success")
    assert qr.get("qr_id") == "qr_123"


def test_legacy_checkout_session_route(monkeypatch):
    # Mock MagpieService.create_session to return a session
    async def fake_create_session(self, **kwargs):
        return {"success": True, "session_id": "s_1", "payment_url": "https://magpie/pay/s_1", "external_id": kwargs.get("external_id")}

    import services.magpie_service
    monkeypatch.setattr(services.magpie_service.MagpieService, "create_session", fake_create_session)

    # Mock TransactionsService.create_transaction to avoid DB access
    class DummyTxn:
        def __init__(self):
            self.id = "txn_1"

    async def fake_create_transaction(self, **kwargs):
        return DummyTxn()

    import services.transactions
    monkeypatch.setattr(services.transactions.TransactionsService, "create_transaction", fake_create_transaction)

    payload = {
        "amount": 150.0,
        "currency": "php",
        "external_id": "session-ext-1",
    }

    data_obj = magpie_router.CheckoutSessionRequest(**payload)

    class DummyUser:
        id = "test_user"

    # Call the router function directly to avoid spinning up the full app lifecycle
    loop = asyncio.new_event_loop()
    try:
        res = loop.run_until_complete(
            magpie_router.create_checkout_session(data_obj, current_user=DummyUser(), db=None)
        )
    finally:
        loop.close()

    assert res.get("success") is True
    assert res.get("data") and res.get("data").get("payment_url")
