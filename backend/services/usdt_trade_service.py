"""Provider selection for wallet USDT trades."""

import uuid
import math
from typing import Any, Dict

from services.coinsp_service import CoinsPhService


class UsdtTradeService:
    """Execute USDT trades through Coins.ph when configured."""

    def __init__(self, coinsp: CoinsPhService | None = None) -> None:
        self.coinsp = coinsp or CoinsPhService()

    def provider_name(self, from_currency: str, to_currency: str) -> str:
        pair = tuple(
            "USD" if currency.upper() == "USDT" else currency.upper()
            for currency in (from_currency, to_currency)
        )
        if pair in {("PHP", "USD"), ("USD", "PHP")} and self.coinsp.is_configured():
            return "coins.ph"
        return "internal"

    def require_real_provider(self, from_currency: str, to_currency: str) -> str:
        """Return the provider for a supported USDT pair or reject a fake fallback."""
        provider = self.provider_name(from_currency, to_currency)
        if provider != "coins.ph":
            raise RuntimeError("Real USDT trading is unavailable until Coins.ph is configured")
        return provider

    async def buy_with_php(
        self,
        *,
        php_amount: float,
        user_id: str,
        client_order_id: str | None = None,
    ) -> Dict[str, Any]:
        """Buy USDT with PHP and return the provider execution result."""
        return await self.execute(
            from_currency="PHP",
            to_currency="USDT",
            amount=php_amount,
            user_id=user_id,
            client_order_id=client_order_id,
        )

    async def sell_for_php(
        self,
        *,
        usdt_amount: float,
        user_id: str,
        client_order_id: str | None = None,
    ) -> Dict[str, Any]:
        """Sell USDT for PHP and return the provider execution result."""
        return await self.execute(
            from_currency="USDT",
            to_currency="PHP",
            amount=usdt_amount,
            user_id=user_id,
            client_order_id=client_order_id,
        )

    async def withdraw_to_bitgo(
        self,
        *,
        usdt_amount: float,
        address: str,
        withdraw_order_id: str,
    ) -> Dict[str, Any]:
        return await self.coinsp.withdraw_usdt(
            amount=usdt_amount,
            address=address,
            withdraw_order_id=withdraw_order_id,
        )

    async def _execute_coins_trade(
        self,
        *,
        from_currency: str,
        amount: float,
        order_id: str,
    ) -> Dict[str, Any]:
        if from_currency == "PHP":
            result = await self.coinsp.buy_usdt(amount, order_id)
            amount_key = "received_usdt"
        else:
            result = await self.coinsp.sell_usdt(amount, order_id)
            amount_key = "received_php"
        if not result.get("success"):
            return result

        data = result.get("data") or {}
        try:
            provider_amount = float(data.get(amount_key) or 0)
        except (TypeError, ValueError):
            provider_amount = 0.0
        if provider_amount <= 0:
            return {"success": False, "error": "Coins.ph returned an empty trade amount"}
        return {
            "success": True,
            "provider": "coins.ph",
            "amount": provider_amount,
            "order_id": data.get("orderId") or order_id,
            "data": data,
        }

    async def execute(
        self,
        *,
        from_currency: str,
        to_currency: str,
        amount: float,
        user_id: str,
        client_order_id: str | None = None,
    ) -> Dict[str, Any]:
        """Return the provider amount and order reference for a completed trade."""
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        if not math.isfinite(amount) or amount <= 0:
            return {"success": False, "error": "Trade amount must be a positive finite number"}

        provider = self.provider_name(from_currency, to_currency)
        if provider != "coins.ph":
            return {
                "success": False,
                "provider": provider,
                "amount": None,
                "order_id": None,
                "error": "Real USDT trading is unavailable until Coins.ph is configured",
            }

        order_id = client_order_id or f"swiftpay-{user_id}-{uuid.uuid4().hex[:20]}"
        return await self._execute_coins_trade(
            from_currency=from_currency,
            amount=amount,
            order_id=order_id,
        )
