from types import SimpleNamespace
from unittest.mock import AsyncMock

from services.paymentwall_service import PaymentwallService
from services.payment_gateway import PaymentGateway


def configured_service(monkeypatch):
    service = PaymentwallService()
    service.app_key = "app-key"
    service.secret_key = "secret-key"
    service.widget_code = "w123"
    service.is_configured = True
    return service


def test_widget_url_uses_signed_krw_parameters(monkeypatch):
    service = configured_service(monkeypatch)

    result = service.create_widget_url(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-123",
        description="Wallet top-up",
    )

    assert result["success"] is True
    assert "currencyCode=KRW" in result["payment_url"]
    assert result["data"]["sign"] == service.calculate_signature(result["data"], "secret-key", 3)


def test_widget_rejects_non_krw(monkeypatch):
    service = configured_service(monkeypatch)

    result = service.create_widget_url(
        user_id="merchant-1",
        amount=10,
        currency="PHP",
        reference_id="order-123",
    )

    assert result == {"success": False, "error": "Paymentwall collection is restricted to KRW"}


def test_widget_accepts_krw_amount_above_former_limit(monkeypatch):
    service = configured_service(monkeypatch)

    result = service.create_widget_url(
        user_id="merchant-1",
        amount=1_000_000_000,
        reference_id="order-123",
        description="Wallet top-up",
    )

    assert result["success"] is True
    assert "amount=1000000000.00" in result["payment_url"]


def test_krw_qr_uses_hosted_payload_instead_of_bank_details():
    service = PaymentwallService()

    result = service.create_krw_bank_transfer_qr(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-123",
        bank_name="Private Bank",
        account_holder_name="Private Account Holder",
        qr_payload="https://pay.example.test/api/v1/paymentwall/hosted/order-123",
    )

    assert result["qr_payload"] == "https://pay.example.test/api/v1/paymentwall/hosted/order-123"
    assert "Private Bank" not in result["qr_code_url"]
    assert "Private Account Holder" not in result["qr_code_url"]
    assert "order-123" in result["qr_code_url"]


def test_krw_qr_hides_account_number_and_uses_swiftpay_account_name():
    service = PaymentwallService()

    result = service.create_krw_bank_transfer_qr(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-456",
        bank_name="K Bank",
        account_holder_name="Different Name",
    )

    assert "Account Number:" not in result["qr_payload"]
    assert "SwiftPay Ventures Inc." in result["qr_payload"]
    assert "Different Name" not in result["qr_payload"]


def test_krw_qr_uses_toss_bank_account_details():
    service = PaymentwallService()

    result = service.create_krw_bank_transfer_qr(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-789",
    )

    assert result["bank_account"] == {
        "bank_name": "Toss Bank",
        "number": "1908-1618-8260",
        "name": "SwiftPay Ventures Inc.",
        "account_name": "SwiftPay Ventures Inc.",
        "swift_code": "TVBKVVTTXXX",
        "account_type": "virtual_account",
    }


def test_pingback_signature_is_verified(monkeypatch):
    service = configured_service(monkeypatch)
    parameters = {"uid": "merchant-1", "goodsid": "order-123", "type": "0", "ref": "order-123", "sign_version": "2"}
    parameters["sig"] = service.calculate_signature(parameters, "secret-key", 2)

    assert service.validate_pingback(parameters) is True
    parameters["ref"] = "tampered"
    assert service.validate_pingback(parameters) is False


import pytest
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_paymentwall_route_passes_compatible_gateway_kwargs(monkeypatch):
    async def fake_create_payment(self, db, *, user_id, amount, description, transaction_type, customer_name, customer_email, external_id=None, payment_methods=None, metadata=None, currency=None):
        assert db is not None
        assert user_id == "42"
        assert amount == 2500
        assert currency == "KRW"
        assert external_id == "paymentwall-abc123"
        assert transaction_type == "invoice"
        return {"success": True, "data": {"payment_url": "https://paymentwall.example/checkout"}}

    import routers.paymentwall as paymentwall_router
    monkeypatch.setattr(paymentwall_router.PaymentGateway, "create_payment", fake_create_payment)

    from routers.paymentwall import create_paymentwall_payment

    class FakeUser:
        id = 42

    async def fake_get_db():
        return object()

    fake_request = SimpleNamespace(
        headers={"content-type": "application/json"},
    )

    result = await create_paymentwall_payment(
        {"amount": 2500, "currency": "KRW", "reference_id": "paymentwall-abc123", "description": "KRW payment link"},
        current_user=FakeUser(),
        db=object(),
    )

    assert result["success"] is True
    assert result["data"]["payment_url"] == "https://paymentwall.example/checkout"


@pytest.mark.asyncio
async def test_krw_payment_link_uses_komoju_checkout(monkeypatch):
    gateway = PaymentGateway(db=None)
    gateway.komoju = SimpleNamespace(
        is_configured=True,
        create_payment=AsyncMock(return_value={
            "success": True,
            "payment_id": "komoju-krw-1",
            "payment_url": "https://komoju.example/krw-1",
            "raw": {"id": "komoju-krw-1"},
        }),
    )

    captured = {}

    async def fake_create_transaction(self, **kwargs):
        captured.update(kwargs)
        return SimpleNamespace(id=987, external_id=kwargs["external_id"])

    monkeypatch.setattr("services.payment_gateway.TransactionsService.create_transaction", fake_create_transaction)

    result = await gateway.create_payment(
        db=None,
        user_id="user-1",
        amount=50_000,
        description="KRW bank transfer invoice",
        transaction_type="payment_link",
        external_id="krw-card-ref",
        currency="KRW",
    )

    assert result["success"] is True
    assert result["data"]["gateway"] == "komoju"
    assert result["data"]["payment_url"] == "https://komoju.example/krw-1"
    assert result["data"]["checkout_url"] == "https://komoju.example/krw-1"
    assert captured["transaction_type"] == "invoice"
    gateway.komoju.create_payment.assert_awaited_once()
    provider_request = gateway.komoju.create_payment.await_args.kwargs
    assert provider_request["amount"] == 1937.98
    assert provider_request["currency"] == "PHP"
    assert provider_request["source_currency"] == "KRW"
    assert provider_request["source_amount"] == 50_000


@pytest.mark.asyncio
async def test_krw_payment_link_allows_amount_below_previous_minimum(monkeypatch):
    gateway = PaymentGateway(db=None)
    monkeypatch.setattr(
        "services.payment_gateway.TransactionsService.create_transaction",
        AsyncMock(return_value=SimpleNamespace(id=1, external_id="krw-ref")),
    )

    result = await gateway.create_payment(
        db=None,
        user_id="user-1",
        amount=49_999,
        transaction_type="payment_link",
        currency="KRW",
    )

    assert result["success"] is True
    assert result["data"]["gateway"] == "manual_external_verification"


@pytest.mark.asyncio
async def test_krw_payment_does_not_fall_back_to_other_gateways(monkeypatch):
    gateway = PaymentGateway(db=None)
    gateway.swift = SimpleNamespace(is_configured=lambda: False)
    gateway.magpie = SimpleNamespace(api_key="magpie-test-key")

    result = await gateway.create_payment(
        db=None,
        user_id="user-1",
        amount=2500,
        description="KRW card invoice",
        external_id="krw-card-ref-no-fallback",
        currency="KRW",
    )

    assert result == {"success": False, "error": "PhotonPay KRW checkout is not configured"}


@pytest.mark.asyncio
async def test_magpie_payment_link_persists_requested_currency_and_owner(monkeypatch):
    gateway = PaymentGateway(db=None)
    gateway.swift = SimpleNamespace(is_configured=lambda: False)
    gateway.magpie = SimpleNamespace(
        api_key="magpie-test-key",
        create_checkout=AsyncMock(return_value={
            "success": True,
            "external_id": "magpie-cny-1",
            "checkout_id": "checkout-cny-1",
            "checkout_url": "https://pay.example.test/cny-1",
        }),
    )
    captured = {}

    async def fake_create_transaction(self, **kwargs):
        captured.update(kwargs)
        return SimpleNamespace(id=1, external_id=kwargs["external_id"])

    monkeypatch.setattr("services.payment_gateway.TransactionsService.create_transaction", fake_create_transaction)
    monkeypatch.setattr(
        "services.payment_gateway.get_enabled_collection_currencies",
        AsyncMock(return_value=["PHP", "CNY", "KRW", "USDT"]),
    )
    monkeypatch.setattr(
        "services.payment_gateway.get_wallet_currency_limits",
        AsyncMock(return_value={"minimum_deposit": 0, "max_incoming": 0}),
    )

    result = await gateway.create_payment(
        db=object(),
        user_id="merchant-cny",
        amount=100,
        description="CNY payment link",
        transaction_type="payment_link",
        external_id="public-cny-1",
        currency="CNY",
    )

    assert result["success"] is True
    assert captured["user_id"] == "merchant-cny"
    assert captured["currency"] == "CNY"


@pytest.mark.asyncio
async def test_create_transaction_accepts_qr_code_url():
    from services.transactions import TransactionsService

    class FakeDB:
        def __init__(self):
            self.added = []

        def add(self, obj):
            self.added.append(obj)

        async def commit(self):
            return None

        async def refresh(self, obj):
            return None

    async def fake_find_existing_transaction(*args, **kwargs):
        return None

    service = TransactionsService(FakeDB())
    service._find_existing_transaction = fake_find_existing_transaction

    txn = await service.create_transaction(
        user_id="42",
        transaction_type="payment_link",
        amount=2500,
        currency="KRW",
        external_id="ref-qr",
        gateway_id="ref-qr",
        payment_url="https://example.test/hosted/ref-qr",
        qr_code_url="https://example.test/qr.png",
    )

    assert txn.qr_code_url == "https://example.test/qr.png"
    assert txn.payment_url == "https://example.test/hosted/ref-qr"