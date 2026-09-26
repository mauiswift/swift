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
    assert captured_path == "/"
    assert captured_payload["payment_method_types"] == [
        "alipay", "wechat", "card", "bpi", "gcash",         "maya", "unionpay",
    ]
    # Magpie accepts PHP for this account; CNY is converted for the provider
    # while the internal transaction remains denominated in CNY.
    assert captured_payload["currency"] == "php"


@pytest.mark.asyncio
async def test_create_session_normalizes_unionpay_aliases(monkeypatch):
    service = MagpieService()
    captured_payload = {}

    async def fake_post(path, payload):
        captured_payload.update(payload)
        return {"success": True, "data": {"url": "https://pay.magpie.im/session/test"}}

    monkeypatch.setattr(service, "_post", fake_post)

    result = await service.create_session(
        amount_cents=1000,
        currency="PHP",
        product_name="UnionPay test",
        success_url="https://swiftpay.site/success",
        cancel_url="https://swiftpay.site/cancel",
        payment_method_types=["union_pay", "wechat-pay", "unionpay"],
    )

    assert result["success"] is True
    assert captured_payload["payment_method_types"] == ["unionpay", "wechat"]
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
    assert captured_payload["currency"] == "php"


@pytest.mark.asyncio
async def test_create_session_supports_krw_with_magpie_settlement_conversion(monkeypatch):
    service = MagpieService()
    called = {"count": 0}
    captured = {}

    async def fake_convert_live(amount, from_currency, to_currency):
        assert (from_currency, to_currency) == ("KRW", "PHP")
        return amount * 0.043

    async def fake_post(path, payload):
        called["count"] += 1
        captured["path"] = path
        captured["payload"] = payload
        return {"success": True, "data": {"checkout_url": "https://pay.magpie.im/session/krw"}}

    monkeypatch.setattr(magpie_services.CurrencyConverter, "convert_live", fake_convert_live)
    monkeypatch.setattr(service, "_post", fake_post)

    result = await service.create_session(
        amount_cents=100_000,
        currency="KRW",
        product_name="Test payment",
        success_url="https://swiftpay.site/success",
        cancel_url="https://swiftpay.site/cancel",
        payment_method_types=["alipay"],
    )

    assert result["success"] is True
    assert captured["path"] == "/"
    assert captured["payload"]["payment_method_types"] == ["alipay"]
    assert captured["payload"]["currency"] == "php"
    assert captured["payload"]["line_items"][0]["amount"] == 4300
    assert result["provider_amount"] == 43.0
    assert result["provider_currency"] == "PHP"
    assert called["count"] == 1
