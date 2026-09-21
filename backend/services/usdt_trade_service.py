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
        pair = (from_currency.upper(), to_currency.upper())
        if pair in {("PHP", "USD"), ("USD", "PHP")} and self.coinsp.is_configured():
            return "coins.ph"
        return "internal"

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
    ) -> Dict[str, Any]:
        """Return the provider amount and order reference for a completed trade."""
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        if not math.isfinite(amount) or amount <= 0:
            return {"success": False, "error": "Trade amount must be a positive finite number"}

        provider = self.provider_name(from_currency, to_currency)
        if provider != "coins.ph":
            return {"success": True, "provider": "internal", "amount": None, "order_id": None}

        order_id = f"swiftpay-{user_id}-{uuid.uuid4().hex[:20]}"
        return await self._execute_coins_trade(
            from_currency=from_currency,
            amount=amount,
            order_id=order_id,
        )
