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
        payment_method_types=["alipay", "wechat", "wechatpay", "card"],
    )

    assert result["success"] is True
    assert captured_path == "/api/v2/sessions"
    assert captured_payload["payment_method_types"] == ["alipay", "wechat_pay"]
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
    assert captured_payload["payment_method_types"] == ["alipay", "wechat_pay"]
