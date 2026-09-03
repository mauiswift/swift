from types import SimpleNamespace

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


def test_widget_rejects_krw_amount_above_limit(monkeypatch):
    service = configured_service(monkeypatch)

    result = service.create_widget_url(
        user_id="merchant-1",
        amount=10_000_001,
        reference_id="order-123",
        description="Wallet top-up",
    )

    assert result == {"success": False, "error": "KRW amount cannot exceed 10,000,000"}


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
        assert transaction_type == "payment_link"
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
async def test_krw_payment_gateway_does_not_fallback_when_swiftpay_fails(monkeypatch):
    gateway = PaymentGateway(db=None)
    async def fake_swift_create_order(**kwargs):
        return {"success": False, "error": "SwiftPay unavailable"}

    gateway.swift = SimpleNamespace(
        is_configured=lambda: True,
        generate_qrph=lambda **kwargs: fake_swift_create_order(**kwargs),
    )
    gateway.paymentwall = SimpleNamespace(
        is_configured=True,
        create_widget_url=lambda **kwargs: {
            "success": True,
            "payment_url": "https://paymentwall.example/checkout",
            "data": {"currencyCode": "KRW", "sign": "abc"},
        },
    )

    async def fake_create_transaction(self, **kwargs):
        return SimpleNamespace(id=321, external_id=kwargs.get("external_id", "ref-123"))

    monkeypatch.setattr(
        "services.payment_gateway.TransactionsService.create_transaction",
        fake_create_transaction,
    )

    result = await gateway.create_payment(
        db=None,
        user_id="user-1",
        amount=2500,
        description="KRW payment link",
        transaction_type="payment_link",
        external_id="ref-123",
        currency="KRW",
    )

    assert result["success"] is False
    assert result["error"] == "SwiftPay unavailable"


@pytest.mark.asyncio
async def test_krw_payment_gateway_marks_swiftpay_qr_even_with_provider_id(monkeypatch):
    gateway = PaymentGateway(db=None)
    gateway.swift = SimpleNamespace(
        is_configured=lambda: True,
        generate_qrph=lambda **kwargs: _swiftpay_qr_result(),
    )

    captured = {}

    async def fake_create_transaction(self, **kwargs):
        captured.update(kwargs)
        return SimpleNamespace(id=654, external_id=kwargs["external_id"])

    monkeypatch.setattr("services.payment_gateway.TransactionsService.create_transaction", fake_create_transaction)

    result = await gateway.create_payment(
        db=None,
        user_id="user-1",
        amount=2500,
        transaction_type="payment_link",
        external_id="ref-swiftpay",
        currency="KRW",
    )

    assert result["data"]["gateway"] == "swiftpay"
    assert captured["gateway_id"] == "swiftpay:payment-123"


def _swiftpay_qr_result():
    return {"success": True, "data": {"paymentId": "payment-123", "qrContent": "EMV-QR"}}


@pytest.mark.asyncio
async def test_krw_payment_route_falls_back_to_self_hosted_virtual_account(monkeypatch):
    async def fake_create_payment(self, db, **kwargs):
        raise RuntimeError("gateway down")

    import routers.paymentwall as paymentwall_router
    monkeypatch.setattr(paymentwall_router.PaymentGateway, "create_payment", fake_create_payment)

    async def fake_create_transaction(self, **kwargs):
        return SimpleNamespace(
            id=456,
            external_id=kwargs.get("external_id", "ref-456"),
            user_id=kwargs.get("user_id", "42"),
        )

    monkeypatch.setattr(paymentwall_router.TransactionsService, "create_transaction", fake_create_transaction)

    class FakeUser:
        id = 42

    result = await paymentwall_router.create_paymentwall_payment(
        {"amount": 2500, "currency": "KRW", "reference_id": "ref-456", "description": "KRW payment link"},
        current_user=FakeUser(),
        db=object(),
    )

    assert result["success"] is True
    assert result["data"]["gateway"] == "paymentwall"
    assert "/api/v1/paymentwall/hosted/" in result["data"]["payment_url"]
    assert result["data"]["bank_account"]["bank_name"]


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