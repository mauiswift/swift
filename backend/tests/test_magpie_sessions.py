import os
import importlib

import pytest

os.environ["MAGPIE_SECRET_KEY"] = "test-magpie-key"

import services.magpie_services as magpie_services

magpie_services = importlib.reload(magpie_services)
MagpieService = magpie_services.MagpieService


@pytest.mark.asyncio
async def test_create_session_normalizes_alipay_and_wechat_methods(monkeypatch):
    service = MagpieService()
    captured_payload = {}
    captured_path = ""

    async def fake_post(path, payload):
        nonlocal captured_path
        captured_path = path
        captured_payload.update(payload)
        return {"success": True, "data": {"checkout_url": "https://pay.magpie.im/session/test"}}

    monkeypatch.setattr(service, "_post", fake_post)

    result = await service.create_session(
        amount_cents=1000,
        currency="CNY",
        product_name="Test payment",
        success_url="https://swiftpay.site/success",
        cancel_url="https://swiftpay.site/cancel",
        payment_method_types=["alipay", "wechat", "wechatpay", "card", "bpi", "gcash", "maya", "unionpay"],
        customer_name="Test Customer",
        customer_email="customer@example.com",
    )

    assert result["success"] is True
    assert captured_path == "/api/v2/sessions"
    assert captured_payload["payment_method_types"] == [
        "alipay", "wechat", "card", "bpi", "gcash", "paymaya", "unionpay",
    ]
    # Magpie accepts PHP for this account; CNY is converted for the provider
    # while the internal transaction remains denominated in CNY.
    assert captured_payload["amount"] == pytest.approx(729.93, rel=1e-3)
    assert captured_payload["currency"] == "php"
    assert captured_payload["mode"] == "payment"
    assert captured_payload["customer_name"] == "Test Customer"
    assert captured_payload["customer_email"] == "customer@example.com"
    assert captured_payload["line_items"][0]["name"] == "Test payment"
    assert captured_payload["line_items"][0]["quantity"] == 1
    assert captured_payload["line_items"][0]["amount"] == 72993
    assert result["data"]["checkout_url"] == "https://pay.magpie.im/session/test"


@pytest.mark.asyncio
async def test_create_session_defaults_to_magpie_wallet_methods(monkeypatch):
    service = MagpieService()
    captured_payload = {}

    async def fake_post(path, payload):
        captured_payload.update(payload)
        return {"success": True, "data": {"url": "https://pay.magpie.im/session/test"}}

    monkeypatch.setattr(service, "_post", fake_post)

    result = await service.create_session(
        amount_cents=1000,
        currency="CNY",
        product_name="Test payment",
        success_url="https://swiftpay.site/success",
        cancel_url="https://swiftpay.site/cancel",
        payment_method_types=[],
    )

    assert result["success"] is True
    assert captured_payload["payment_method_types"] == ["alipay", "wechat", "unionpay"]
    # ensure CNY is converted to Magpie's supported PHP currency
    assert captured_payload["amount"] == pytest.approx(729.93, rel=1e-3)
    assert captured_payload["currency"] == "php"


@pytest.mark.asyncio
async def test_create_session_rejects_unsupported_currency_before_request(monkeypatch):
    service = MagpieService()
    called = {"count": 0}

    async def fake_post(path, payload):
        called["count"] += 1
        return {"success": True, "data": {}}

    monkeypatch.setattr(service, "_post", fake_post)

    result = await service.create_session(
        amount_cents=1000,
        currency="KRW",
        product_name="Test payment",
        success_url="https://swiftpay.site/success",
        cancel_url="https://swiftpay.site/cancel",
        payment_method_types=["card"],
    )

    assert result == {
        "success": False,
        "error": "Magpie checkout sessions only support PHP. Use a PHP flow or a KRW gateway like Paymentwall.",
    }
    assert called["count"] == 0
