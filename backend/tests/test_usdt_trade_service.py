import pytest

from services.usdt_trade_service import UsdtTradeService


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
async def test_unconfigured_coinsph_uses_internal_fallback():
    service = UsdtTradeService(UnconfiguredCoins())

    result = await service.execute(
        from_currency="PHP",
        to_currency="USDT",
        amount=500,
        user_id="user-1",
    )

    assert result == {
        "success": True,
        "provider": "internal",
        "amount": None,
        "order_id": None,
    }
