import os
import asyncio
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import pytest

os.environ["JWT_SECRET_KEY"] = "devsecret"
os.environ["TELEGRAM_BOT_TOKEN"] = "123"
os.environ["TELEGRAM_BOT_USERNAME"] = "bot"
os.environ["TELEGRAM_ADMIN_IDS"] = "1"
os.environ["DISABLE_BACKGROUND_TASKS"] = "1"

from fastapi.testclient import TestClient
from sqlalchemy import select

from core.database import get_db
from main import app
from models.transactions import Transactions
from services.transactions import TransactionsService
from services.paymentwall_service import PaymentwallService


def test_public_transaction_lookup_returns_transaction():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment",
                    amount=12.5,
                    payment_method="GCASH",
                    external_id=f"checkout-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-seed",
                    description="seeded checkout",
                    customer_name="Demo",
                    customer_email="demo@example.com",
                    payment_url="https://swiftpay.site/checkout",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.get(f"/api/v1/entities/transactions/public/{txn.external_id}")

        assert response.status_code == 200
        payload = response.json()
        assert payload["external_id"] == txn.external_id
        assert payload["status"] == "pending"
        assert payload["payment_status"] == "pending"
        assert payload["amount"] == 12.5
        assert payload["payment_method"] == "GCASH"
        status_response = client.get(f"/api/v1/payments/checkout/{txn.external_id}/status")
        assert status_response.status_code == 200
        assert status_response.json()["payment_method"] == "GCASH"
        assert status_response.json()["payment_received"] is False
        assert status_response.json()["payment_status"] == "pending"


def test_public_transaction_exposes_received_payment_status_before_approval():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=12.5,
                    external_id=f"received-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-received",
                    description="provider-confirmed payment awaiting review",
                    status="pending",
                    currency="PHP",
                )
                txn.paid_at = datetime.now(timezone.utc)
                txn.approval_status = "pending"
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.get(f"/api/v1/entities/transactions/public/{txn.external_id}")

        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "pending"
        assert payload["payment_status"] == "paid"
        assert payload["approval_status"] == "pending"

        checkout_response = client.get(
            f"/api/v1/payments/checkout/{txn.external_id}/status"
        )
        assert checkout_response.status_code == 200
        checkout_payload = checkout_response.json()
        assert checkout_payload["status"] == "pending"
        assert checkout_payload["payment_status"] == "paid"
        assert checkout_payload["payment_received"] is True
        assert checkout_payload["approval_status"] == "pending"
        assert checkout_payload["paid_at"] is not None


def test_checkout_institution_allows_php_above_50000():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=60000.0,
                    external_id=f"checkout-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-seed-high",
                    description="high value checkout",
                    customer_name="Demo",
                    customer_email="demo@example.com",
                    payment_url="/checkout/high",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/institution",
            json={"institution_code": "GCASH"},
        )

        assert response.status_code != 400


def test_swiftpay_multicurrency_checkout_converts_krw_and_creates_order(monkeypatch):
    from routers import payments as payments_router

    captured = {}
    order_calls = []

    class FakeSwiftPayService:
        callback_url = "https://swiftpay.ph/api/v1/swiftpay/callback"

        def is_configured(self):
            return True

        async def create_order(self, **kwargs):
            order_calls.append(kwargs)
            captured.update(kwargs)
            return {
                "success": True,
                "reference_no": kwargs["reference_no"],
                "data": {
                    "customerRedirectUrl": "https://swiftpay.ph/pay/order-1",
                    "paymentId": "provider-order-1",
                },
            }

    monkeypatch.setattr(payments_router, "SwiftPayService", FakeSwiftPayService)
    monkeypatch.setattr(
        payments_router.CurrencyConverter,
        "convert_live",
        AsyncMock(return_value=12.5),
    )

    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                txn = await TransactionsService(session).create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=100000,
                    external_id=f"krw-checkout-{uuid.uuid4().hex[:8]}",
                    description="KRW checkout",
                    customer_name="Demo",
                    customer_email="demo@example.com",
                    payment_url="/checkout/krw",
                    status="pending",
                    currency="KRW",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/swiftpay-currency",
            json={"currency": "USD"},
        )

        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["redirect_url"] == "https://swiftpay.ph/pay/order-1"
        assert payload["quoted_amount"] == 100000
        assert payload["quoted_currency"] == "KRW"
        assert payload["charged_amount"] == 12.5
        assert payload["charged_currency"] == "USD"
        assert captured["amount"] == 12.5
        assert captured["currency"] == "USD"
        assert captured["details"]["sourceAmount"] == 100000
        assert captured["details"]["sourceCurrency"] == "KRW"
        other_currency_response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/swiftpay-currency",
            json={"currency": "EUR"},
        )
        assert other_currency_response.status_code == 409, other_currency_response.text
        assert len(order_calls) == 1

        repeated_response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/swiftpay-currency",
            json={"currency": "USD"},
        )
        assert repeated_response.status_code == 200, repeated_response.text
        assert repeated_response.json()["redirect_url"] == payload["redirect_url"]
        assert len(order_calls) == 1

        status_response = client.get(f"/api/v1/payments/checkout/{txn.external_id}/status")
        assert status_response.status_code == 200, status_response.text
        assert status_response.json()["status"] == "pending"
        assert status_response.json()["amount"] == 100000
        assert status_response.json()["currency"] == "KRW"
        assert status_response.json()["processing_amount"] == 12.5
        assert status_response.json()["processing_currency"] == "USD"

        async def mark_multicurrency_transaction_paid():
            async for session in get_db():
                result = await session.execute(
                    select(Transactions).where(
                        Transactions.external_id == payload["external_id"]
                    )
                )
                payment_txn = result.scalars().first()
                assert payment_txn is not None
                payment_txn.status = "paid"
                await session.commit()

        asyncio.run(mark_multicurrency_transaction_paid())
        status_response = client.get(f"/api/v1/payments/checkout/{txn.external_id}/status")
        assert status_response.status_code == 200, status_response.text
        assert status_response.json()["status"] == "paid"
        other_currency_after_paid_response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/swiftpay-currency",
            json={"currency": "EUR"},
        )
        assert other_currency_after_paid_response.status_code == 409, other_currency_after_paid_response.text
        assert len(order_calls) == 1


def test_swiftpay_multicurrency_checkout_converts_cny_and_creates_order(monkeypatch):
    from routers import payments as payments_router

    captured = {}

    class FakeSwiftPayService:
        callback_url = "https://swiftpay.site/api/v1/webhooks/swiftpay"

        def is_configured(self):
            return True

        async def create_order(self, **kwargs):
            captured.update(kwargs)
            return {
                "success": True,
                "reference_no": kwargs["reference_no"],
                "data": {"customerRedirectUrl": "https://swiftpay.site/pay/cny-order"},
            }

    monkeypatch.setattr(payments_router, "SwiftPayService", FakeSwiftPayService)
    monkeypatch.setattr(
        payments_router.CurrencyConverter,
        "convert_live",
        AsyncMock(return_value=140.0),
    )

    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                txn = await TransactionsService(session).create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=1000,
                    external_id=f"cny-checkout-{uuid.uuid4().hex[:8]}",
                    description="CNY checkout",
                    payment_url="/checkout/cny",
                    status="pending",
                    currency="CNY",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        quote_response = client.get(
            f"/api/v1/payments/checkout/{txn.external_id}/swiftpay-currency/quote?currency=EUR"
        )
        assert quote_response.status_code == 200, quote_response.text
        quote = quote_response.json()
        assert quote["quoted_amount"] == 1000
        assert quote["quoted_currency"] == "CNY"
        assert quote["charged_currency"] == "EUR"

        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/swiftpay-currency",
            json={"currency": "USD"},
        )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["quoted_amount"] == 1000
        assert payload["quoted_currency"] == "CNY"
        assert payload["charged_amount"] == 140
        assert payload["charged_currency"] == "USD"
        assert captured["currency"] == "USD"
        assert captured["details"]["sourceAmount"] == 1000
        assert captured["details"]["sourceCurrency"] == "CNY"


def test_fixed_payment_link_creates_reusable_payment_attempt():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=125.0,
                    external_id=f"reusable-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-reusable",
                    description="Reusable checkout",
                    payment_url="/checkout/reusable",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/institution",
            json={"institution_code": "GCASH"},
        )

        # The external provider is unavailable in the test environment, but the
        # endpoint must have created a separate attempt before provider handling.
        assert response.status_code != 404

        async def count_attempts():
            async for session in get_db():
                result = await session.execute(
                    select(Transactions).where(
                        Transactions.external_id.like(f"{txn.external_id}-PAY-%")
                    )
                )
                return len(result.scalars().all())

        assert asyncio.run(count_attempts()) == 1


def test_krw_checkout_does_not_expose_security_bank():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=125000.0,
                    external_id=f"krw-checkout-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-krw-security-bank",
                    description="KRW checkout",
                    payment_url="/checkout/krw",
                    status="pending",
                    currency="KRW",
                    bank_name="Security Bank Corporation",
                    bank_account_number="0000068888173",
                    bank_account_name="SwiftPay Ventures Inc.",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.get(f"/api/v1/payments/checkout/{txn.external_id}")

        assert response.status_code == 200
        payload = response.json()
        assert payload["bank_name"] == "토스페이"
        assert payload["bank_account_number"]
        assert "security" not in payload["bank_name"].casefold()

        refreshed = client.get(f"/api/v1/payments/checkout/{payload['external_id']}")
        assert refreshed.status_code == 200
        assert refreshed.json()["bank_account_number"] == payload["bank_account_number"]



def test_krw_checkout_account_changes_between_payment_sessions():
    first = PaymentwallService.generate_krw_virtual_account(
        user_id="same-user",
        reference_id="session-101",
    )
    second = PaymentwallService.generate_krw_virtual_account(
        user_id="same-user",
        reference_id="session-102",
    )

    assert first["number"] != second["number"]


RAW_EMVCO_PAYLOAD = (
    "00020101021226570013ph.ppmi.p2m0111QRPHTESTM00209SWIFTPAY52045999"
    "5303608540810.005802PH5910Demo Store6007Quezon C62070503***6304ABCD"
)


@pytest.mark.parametrize(
    ("currency", "amount"),
    [
        ("PHP", 500.0),
        ("KRW", 50000.0),
        ("CNY", 200.0),
    ],
)
def test_qrph_institution_select_preserves_raw_emvco_payload_in_any_currency(monkeypatch, currency, amount):
    """The QR Ph checkout flow must hand the browser the untouched EMVCo
    string for every supported checkout currency, since that's the only
    value the frontend (and TOSS) can scan as a real payment."""
    from routers import payments as payments_router

    captured_qrph_calls = []

    class FakeSwiftPayService:
        def is_configured(self):
            return True

        async def generate_qrph(self, **kwargs):
            captured_qrph_calls.append(kwargs)
            return {
                "success": True,
                "reference_no": kwargs["reference_no"],
                "data": {
                    "qrCode": RAW_EMVCO_PAYLOAD,
                    "paymentId": "qrph-pay-1",
                    "paymentStatus": "PENDING",
                },
                "amount": 100.0,
                "currency": "PHP",
                "original_amount": kwargs["amount"],
                "original_currency": kwargs["currency"],
                "php_amount": 100.0,
            }

    monkeypatch.setattr(payments_router, "SwiftPayService", FakeSwiftPayService)

    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                txn = await TransactionsService(session).create_transaction(
                    user_id="demo-user",
                    transaction_type="payment_link",
                    amount=amount,
                    original_amount=amount,
                    original_currency=currency,
                    external_id=f"qrph-{currency.lower()}-{uuid.uuid4().hex[:8]}",
                    description=f"{currency} QR Ph checkout",
                    customer_name="Demo",
                    customer_email="demo@example.com",
                    payment_url=f"/checkout/qrph-{currency.lower()}",
                    status="pending",
                    currency=currency,
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.post(
            f"/api/v1/payments/checkout/{txn.external_id}/institution",
            json={"institution_code": "QRPH"},
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["success"] is True
        assert body["payment_id"] == "qrph-pay-1"
        assert body["payment_status"] == "PENDING"

        # The raw EMVCo string must survive untouched: no base64/PNG
        # re-encoding, no truncation, no currency-specific mutation.
        assert body["qr_code"] == RAW_EMVCO_PAYLOAD
        assert body["raw_qr_payload"] == RAW_EMVCO_PAYLOAD
        # qr_payload is only populated for already-hosted image URLs; a raw
        # EMVCo string is not one, so the frontend must fall back to
        # client-side rendering (QRCodeSVG) rather than an <img> tag.
        assert body["qr_payload"] is None

        assert body["currency"] == currency
        assert body["settlement_currency"] == "PHP"

        # Exactly one bootstrap call, always converting to PHP at the
        # provider boundary regardless of the checkout's own currency.
        assert len(captured_qrph_calls) == 1
        assert captured_qrph_calls[0]["currency"] == currency
        assert captured_qrph_calls[0]["qr_type"] == "P2M"

        toss_deep_link = body["toss_deep_link"]
        assert toss_deep_link is not None
        parsed = urlparse(toss_deep_link)
        assert f"{parsed.scheme}://{parsed.netloc}{parsed.path}" == "supertoss://toss/pay"
        params = parse_qs(parsed.query)
        # The embedded QR payload is what TOSS actually scans; it must be
        # the untouched raw EMVCo string, not a reformatted/re-encoded copy.
        assert params["qr"] == [RAW_EMVCO_PAYLOAD]
        assert set(params) == {"qr"}

        # What the frontend's GET /checkout/{identifier} actually serves
        # (and what PaymentQrCode renders client-side) must match too. A
        # fresh payment-link checkout spins up its own reusable attempt
        # with a new external_id, so follow the one the endpoint returned.
        checkout_response = client.get(f"/api/v1/payments/checkout/{body['external_id']}")
        assert checkout_response.status_code == 200, checkout_response.text
        assert checkout_response.json()["qr_code_url"] == RAW_EMVCO_PAYLOAD

        async def load_payment_attempt():
            async for session in get_db():
                return await session.get(Transactions, int(body["transaction_id"]))

        payment_attempt = asyncio.run(load_payment_attempt())
        assert payment_attempt.xendit_id == "qrph-pay-1"


def test_legacy_gcash_redirect_uses_internal_swiftpay_gcash_page():
    with TestClient(app) as client:
        async def seed_transaction():
            async for session in get_db():
                svc = TransactionsService(session)
                txn = await svc.create_transaction(
                    user_id="demo-user",
                    transaction_type="swiftpay_qr",
                    amount=125.0,
                    external_id=f"gcash-{uuid.uuid4().hex[:8]}",
                    gateway_id="gw-gcash",
                    description="GCash checkout",
                    payment_url="gcash://com.mynt.gcash/app/006300000700",
                    status="pending",
                    currency="PHP",
                )
                await session.commit()
                return txn

        txn = asyncio.run(seed_transaction())
        response = client.get(
            f"/api/v1/payments/checkout/{txn.external_id}/gcash",
            follow_redirects=False,
        )

        assert response.status_code == 307
        assert response.headers["location"].startswith(f"/checkout/{txn.external_id}/gcash?payment_method=qrph")
