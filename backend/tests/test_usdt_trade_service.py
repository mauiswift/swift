from types import SimpleNamespace

import pytest

from services.usdt_trade_service import UsdtTradeService


class FakeDb:
    def __init__(self, trade, deposit_address=None):
        self.trade = trade
        self.deposit_address = deposit_address or SimpleNamespace(address="TXYZ-USDT-ADDRESS")
        self.commits = 0
        self.rollbacks = 0
        self.scrubbed = []

    async def scalar(self, statement):
        model = getattr(statement, "model", None)
        if model is not None and getattr(model, "__name__", None) == "UsdtDepositAddress":
            return self.deposit_address
        return self.trade

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


class FakeWalletService:
    def __init__(self):
        self.debited = []
        self.reserved = []
        self.consumed = []

    async def get_or_create_wallet(self, *_args, **_kwargs):
        return SimpleNamespace(id=999, available_balance=1000.0, balance=1000.0)

    async def debit_wallet(self, user_id, amount, currency, transaction_type, reference_id, note="", check_liquidity=True):
        self.debited.append({
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "transaction_type": transaction_type,
            "reference_id": reference_id,
            "note": note,
            "check_liquidity": check_liquidity,
        })
        return SimpleNamespace(available_balance=1000.0 - amount, balance=1000.0 - amount)

    async def reserve_wallet(self, user_id, amount, currency, reference_id):
        self.reserved.append({
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "reference_id": reference_id,
        })
        return SimpleNamespace(reference_id=reference_id, status="pending")

    async def consume_wallet_reservation(self, reference_id, transaction_type, note=""):
        self.consumed.append({
            "reference_id": reference_id,
            "transaction_type": transaction_type,
            "note": note,
        })
        return SimpleNamespace(available_balance=500.0, balance=500.0)


class ConfiguredCoins:
    def is_configured(self):
        return True

    async def buy_usdt(self, amount, order_id):
        return {"success": True, "data": {"orderId": order_id, "received_usdt": 10.25}}

    async def sell_usdt(self, amount, order_id):
        return {"success": True, "data": {"orderId": order_id, "received_php": 575.0}}


class UnconfiguredCoins:
    def is_configured(self):
        return False


@pytest.mark.asyncio
async def test_coinsph_is_selected_for_php_usdt_pair():
    service = UsdtTradeService(ConfiguredCoins())

    result = await service.execute(
        from_currency="PHP",
        to_currency="USDT",
        amount=500,
        user_id="user-1",
    )

    assert result["success"] is True
    assert result["provider"] == "coins.ph"
    assert result["amount"] == 10.25
    assert result["order_id"].startswith("swiftpay-user-1-")


@pytest.mark.asyncio
async def test_unconfigured_coinsph_rejects_real_trade():
    service = UsdtTradeService(UnconfiguredCoins())

    result = await service.execute(
        from_currency="PHP",
        to_currency="USDT",
        amount=500,
        user_id="user-1",
    )

    assert result["success"] is False
    assert result["provider"] == "internal"
    assert "configured" in result["error"]


def test_require_real_provider_rejects_unconfigured_coinsph():
    service = UsdtTradeService(UnconfiguredCoins())

    with pytest.raises(RuntimeError, match="configured"):
        service.require_real_provider("PHP", "USDT")


@pytest.mark.asyncio
async def test_buy_with_php_uses_php_amount_for_usdt_order():
    service = UsdtTradeService(ConfiguredCoins())

    result = await service.buy_with_php(php_amount=500, user_id="user-1")

    assert result["success"] is True
    assert result["provider"] == "coins.ph"
    assert result["amount"] == 10.25


@pytest.mark.asyncio
async def test_sell_for_php_uses_usdt_amount_for_php_order():
    service = UsdtTradeService(ConfiguredCoins())

    result = await service.sell_for_php(usdt_amount=10, user_id="user-1")

    assert result["success"] is True
    assert result["provider"] == "coins.ph"
    assert result["amount"] == 575.0


@pytest.mark.asyncio
async def test_approve_admin_usdt_trade_debits_php_after_provider_success(monkeypatch):
    import routers.wallet as wallet_router

    trade = SimpleNamespace(
        id=42,
        user_id="user-1",
        side="buy",
        source_currency="PHP",
        target_currency="USD",
        provider="coins.ph",
        requested_amount=500.0,
        reviewed_by=None,
        reviewed_at=None,
        status="pending_approval",
        provider_order_id=None,
        destination_address=None,
        provider_withdrawal_id=None,
        withdrawal_status=None,
        settled_amount=None,
        failure_reason=None,
        address="TXYZ-USDT-ADDRESS",
    )
    db = FakeDb(trade)
    wallet_service = FakeWalletService()

    async def fake_get_wallet(*args, **kwargs):
        return SimpleNamespace(available_balance=1000.0, balance=1000.0)

    async def fake_get_quote(*args, **kwargs):
        return {"rate": 58.0, "fee_rate": 0.01, "to_amount": 8.5, "conversion_fee_amount": 0.5, "conversion_fee_rate": 0.01}

    async def fake_buy_with_php(*args, **kwargs):
        return {"success": True, "amount": 8.5, "order_id": "order-123"}

    async def fake_withdraw_to_bitgo(*args, **kwargs):
        return {"success": True, "withdrawal_id": "withdrawal-123"}

    class SelectStub:
        def __init__(self, model):
            self.model = model

        def where(self, *args, **kwargs):
            return self

        def with_for_update(self):
            return self

    def fake_select(*args, **kwargs):
        return SelectStub(args[0] if args else None)

    monkeypatch.setattr(wallet_router, "WalletsService", lambda db: wallet_service)
    monkeypatch.setattr(wallet_router, "CurrencyService", lambda db: SimpleNamespace(get_conversion_quote=fake_get_quote))
    monkeypatch.setattr(wallet_router, "UsdtTradeService", lambda: SimpleNamespace(
        buy_with_php=fake_buy_with_php,
        withdraw_to_bitgo=fake_withdraw_to_bitgo,
        provider_name=lambda *args, **kwargs: "coins.ph",
    ))
    monkeypatch.setattr(wallet_router, "_require_super_admin", lambda user: None)
    monkeypatch.setattr(wallet_router, "select", fake_select)

    user = SimpleNamespace(id="admin-1", permissions=SimpleNamespace(is_super_admin=True))
    result = await wallet_router.approve_admin_usdt_trade(42, current_user=user, db=db)

    assert result["success"] is True
    assert wallet_service.reserved == [{
        "user_id": "user-1",
        "amount": 500.0,
        "currency": "PHP",
        "reference_id": "usdt-trade-42",
    }]
    assert wallet_service.consumed == [{
        "reference_id": "usdt-trade-42",
        "transaction_type": "usdt_purchase",
        "note": "Approved USDT purchase settled from PHP wallet",
    }]
    assert trade.status == "withdrawal_submitted"
    assert db.commits == 2
