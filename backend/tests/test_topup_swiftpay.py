from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from routers import topup


@pytest.mark.asyncio
async def test_swiftpay_topup_persists_wallet_transaction_before_returning_checkout(monkeypatch):
    transaction = SimpleNamespace(id=42, status="pending", xendit_id=None, payment_url="", updated_at=None)
    transaction_service = MagicMock()
    transaction_service.create_transaction = AsyncMock(return_value=transaction)
    monkeypatch.setattr(topup, "TransactionsService", lambda _db: transaction_service)
    monkeypatch.setattr(
        topup,
        "get_deposit_rules",
        AsyncMock(return_value={"topup_currencies": ["PHP"]}),
    )

    class SwiftPayStub:
        async def create_order(self, **kwargs):
            assert kwargs["reference_no"].startswith("topup-merchant-1-")
            return {
                "success": True,
                "data": {
                    "customerRedirectUrl": "https://checkout.example.test/order",
                    "paymentId": "provider-payment-42",
                },
            }

    monkeypatch.setattr(topup, "SwiftPayService", SwiftPayStub)
    db = MagicMock()
    db.commit = AsyncMock()
    current_user = SimpleNamespace(id="merchant-1", name="Merchant")

    result = await topup.initialize_swiftpay_topup(
        topup.SwiftPayTopupRequest(amount=500, currency="PHP"),
        current_user,
        db,
    )

    create_kwargs = transaction_service.create_transaction.await_args.kwargs
    assert create_kwargs["transaction_type"] == "wallet_topup"
    assert create_kwargs["amount"] == 500
    assert create_kwargs["currency"] == "PHP"
    assert create_kwargs["external_id"] == result["reference_no"]
    assert result["transaction_id"] == 42
    assert result["redirect_url"] == "https://checkout.example.test/order"
    assert transaction.xendit_id == "provider-payment-42"
    assert transaction.payment_url == result["redirect_url"]
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_swiftpay_topup_marks_local_transaction_failed_when_provider_rejects(monkeypatch):
    transaction = SimpleNamespace(id=43, status="pending", updated_at=None)
    transaction_service = MagicMock()
    transaction_service.create_transaction = AsyncMock(return_value=transaction)
    monkeypatch.setattr(topup, "TransactionsService", lambda _db: transaction_service)
    monkeypatch.setattr(
        topup,
        "get_deposit_rules",
        AsyncMock(return_value={"topup_currencies": ["PHP"]}),
    )

    class SwiftPayStub:
        async def create_order(self, **kwargs):
            return {"success": False, "error": "provider unavailable"}

    monkeypatch.setattr(topup, "SwiftPayService", SwiftPayStub)
    db = MagicMock()
    db.commit = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await topup.initialize_swiftpay_topup(
            topup.SwiftPayTopupRequest(amount=500, currency="PHP"),
            SimpleNamespace(id="merchant-1", name="Merchant"),
            db,
        )

    assert error.value.status_code == 400
    assert transaction.status == "failed"
    db.commit.assert_awaited_once()


def test_php_topup_request_amount_is_the_approval_quote():
    request = SimpleNamespace(requested_amount=500.0, amount_usdt=8.0)

    assert topup._php_topup_credit_amount(request, 70.0) == 500.0


def test_legacy_php_topup_uses_existing_conversion_when_no_quote_exists():
    request = SimpleNamespace(requested_amount=None, amount_usdt=8.0)

    assert topup._php_topup_credit_amount(request, 70.0) == 560.0