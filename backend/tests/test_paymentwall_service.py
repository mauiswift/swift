from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from services.paymentwall_service import PaymentwallService
from services.payment_gateway import PaymentGateway
from services.checkout_urls import build_checkout_url


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


def test_krw_qr_generates_session_specific_toss_bank_account_details():
    service = PaymentwallService()

    first = service.create_krw_bank_transfer_qr(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-789",
    )
    second = service.create_krw_bank_transfer_qr(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-790",
    )

    assert first["bank_account"]["bank_name"] == "토스페이"
    assert first["bank_account"]["account_type"] == "virtual_account"
    assert first["bank_account"]["number"] != second["bank_account"]["number"]
    assert first["bank_account"] == service.create_krw_bank_transfer_qr(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-789",
    )["bank_account"]


@pytest.mark.asyncio
async def test_checkout_toss_account_rotates_from_previous_session(monkeypatch):
    from services import payment_gateway

    accounts = [
        {
            "value": "toss-primary",
            "label": "Toss Bank",
            "bank_name": "Toss Bank",
            "account_number": "111-222-333",
            "account_name": "SwiftPay Ventures Inc.",
            "currency": "KRW",
        },
        {
            "value": "toss-secondary",
            "label": "Toss Bank",
            "bank_name": "Toss Bank",
            "account_number": "444-555-666",
            "account_name": "SwiftPay Ventures Inc.",
            "currency": "KRW",
        },
    ]

    class FakeResult:
        def scalar_one_or_none(self):
            return "111-222-333"

    class FakeDb:
        async def execute(self, statement):
            return FakeResult()

    monkeypatch.setattr(payment_gateway, "get_deposit_accounts", AsyncMock(return_value=accounts))
    selected = await payment_gateway._select_manual_transfer_account(FakeDb(), "KRW", 1250)

    assert selected["bank_account_number"] == "444-555-666"


def test_pingback_signature_is_verified(monkeypatch):
    service = configured_service(monkeypatch)
    parameters = {"uid": "merchant-1", "goodsid": "order-123", "type": "0", "ref": "order-123", "sign_version": "2"}
    parameters["sig"] = service.calculate_signature(parameters, "secret-key", 2)

    assert service.validate_pingback(parameters) is True
    parameters["ref"] = "tampered"
    assert service.validate_pingback(parameters) is False


import json

import pytest
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_set_deposit_accounts_accepts_numeric_string_minimum_amount(monkeypatch):
    from services import app_settings

    captured = {}

    async def fake_set_setting(db, key, value):
        captured["key"] = key
        captured["value"] = value

    monkeypatch.setattr(app_settings, "_set_setting", fake_set_setting)

    await app_settings.set_deposit_accounts(
        db=None,
        accounts=[{
            "value": "kbank-high",
            "label": "Korean Premium Account",
            "account_number": "123-456-789",
            "account_name": "SwiftPay Ventures Inc.",
            "currency": "KRW",
            "minimum_amount": "400000",
        }],
    )

    payload = json.loads(captured["value"])
    assert payload[0]["minimum_amount"] == 400000.0


@pytest.mark.asyncio
async def test_krw_manual_deposit_account_is_one_stable_toss_account_per_user(monkeypatch):
    from services import app_settings

    accounts = [
        {
            "value": "toss-primary",
            "label": "Toss Bank",
            "bank_name": "Toss Bank",
            "account_number": "111-222-333",
            "account_name": "SwiftPay Ventures Inc.",
            "currency": "KRW",
        },
        {
            "value": "toss-secondary",
            "label": "Toss Bank",
            "bank_name": "Toss Bank",
            "account_number": "444-555-666",
            "account_name": "SwiftPay Ventures Inc.",
            "currency": "KRW",
        },
        {
            "value": "other-bank",
            "label": "Other Bank",
            "bank_name": "Other Bank",
            "account_number": "777-888-999",
            "account_name": "SwiftPay Ventures Inc.",
            "currency": "KRW",
        },
    ]
    monkeypatch.setattr(app_settings, "get_deposit_accounts", AsyncMock(return_value=accounts))

    first = await app_settings.get_user_manual_deposit_account(None, "user-1", "KRW")
    second = await app_settings.get_user_manual_deposit_account(None, "user-1", "KRW")

    assert first == second
    assert first["bank_name"] == "Toss Bank"
    assert first["account_number"] != "777-888-999"


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
async def test_krw_payment_link_does_not_require_600_usdt_benefit(monkeypatch):
    gateway = PaymentGateway(db=None)
    gateway.swift = SimpleNamespace(is_configured=lambda: False)
    gateway.magpie = SimpleNamespace(api_key="")
    monkeypatch.setattr(
        "services.payment_gateway.get_wallet_currency_limits",
        AsyncMock(return_value={"minimum_deposit": 0, "max_incoming": 0}),
    )

    result = await gateway.create_payment(
        db=None,
        user_id="user-without-600-usdt",
        amount=10_000,
        description="KRW payment link",
        transaction_type="payment_link",
        currency="KRW",
    )

    assert result["success"] is True
    assert result["data"]["approval_required"] is True


@pytest.mark.asyncio
async def test_php_payment_link_uses_self_hosted_checkout_and_defers_provider_order(monkeypatch):
    gateway = PaymentGateway(db=None)
    db = SimpleNamespace()
    gateway.swift = SimpleNamespace(
        is_configured=Mock(return_value=True),
        create_order=AsyncMock(),
    )
    gateway.magpie = SimpleNamespace(
        api_key="magpie-test-key",
        create_checkout=AsyncMock(),
    )
    transaction = SimpleNamespace(id=456, external_id="php-link-456")
    created = {}

    async def fake_create_transaction(self, **kwargs):
        created.update(kwargs)
        return transaction

    monkeypatch.setattr(
        "services.payment_gateway.get_wallet_currency_limits",
        AsyncMock(return_value={"minimum_deposit": 0, "max_incoming": 0}),
    )
    monkeypatch.setattr(
        "services.payment_gateway.get_enabled_collection_currencies",
        AsyncMock(return_value=["PHP", "KRW", "CNY", "USDT"]),
    )
    monkeypatch.setattr(
        "services.payment_gateway.TransactionsService.create_transaction",
        fake_create_transaction,
    )

    result = await gateway.create_payment(
        db=db,
        user_id="merchant-1",
        amount=150,
        transaction_type="payment_link",
        external_id="php-link-456",
        currency="PHP",
        metadata={"self_hosted_checkout": True},
    )

    assert result["success"] is True
    assert result["data"]["checkout_url"] == build_checkout_url("php-link-456", "PHP")
    assert result["data"]["gateway"] == "swiftpay_self_hosted"
    assert created["status"] == "pending"
    assert created["external_id"] == "php-link-456"
    gateway.swift.create_order.assert_not_awaited()
    gateway.magpie.create_checkout.assert_not_awaited()


@pytest.mark.asyncio
async def test_manual_payment_link_publishes_super_admin_approval_event(monkeypatch):
    from services.transactions import publish_payment_link_created
    import services.transactions as transactions_module

    transaction = SimpleNamespace(
        id=7,
        external_id="manual-invoice-7",
        user_id="user-1",
        amount=2500,
        currency="PHP",
        description="Manual bank transfer",
    )
    events = []
    monkeypatch.setattr(transactions_module.payment_event_bus, "publish", lambda payload: events.append(payload))

    publish_payment_link_created(transaction)
    assert events == [{
        "event_type": "payment_link_created",
        "payment_id": "7",
        "external_id": "manual-invoice-7",
        "user_id": "user-1",
        "user_name": "user-1",
        "amount": 2500,
        "currency": "PHP",
        "description": "Manual bank transfer",
    }]


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