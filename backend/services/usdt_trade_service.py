"""Provider selection for wallet USDT trades."""

import uuid
from typing import Any, Dict

from services.coinsp_service import CoinsPhService


class UsdtTradeService:
    """Execute USDT trades through Coins.ph when configured."""

    def __init__(self, coinsp: CoinsPhService | None = None) -> None:
        self.coinsp = coinsp or CoinsPhService()

    def provider_name(self, from_currency: str, to_currency: str) -> str:
        pair = {from_currency.upper(), to_currency.upper()}
        if pair == {"PHP", "USD"} and self.coinsp.is_configured():
            return "coins.ph"
        return "internal"

    async def execute(
        self,
        *,
        from_currency: str,
        to_currency: str,
        amount: float,
        user_id: str,
    ) -> Dict[str, Any]:
        """Return the provider amount and order reference for a completed trade."""
        provider = self.provider_name(from_currency, to_currency)
        if provider != "coins.ph":
            return {"success": True, "provider": "internal", "amount": None, "order_id": None}

        order_id = f"swiftpay-{user_id}-{uuid.uuid4().hex[:20]}"
        if to_currency.upper() == "USD":
            result = await self.coinsp.buy_usdt(amount, order_id)
            amount_key = "received_usdt"
        else:
            result = await self.coinsp.sell_usdt(amount, order_id)
            amount_key = "received_php"
        if not result.get("success"):
            return result

        data = result.get("data") or {}
        provider_amount = float(data.get(amount_key) or 0)
        if provider_amount <= 0:
            return {"success": False, "error": "Coins.ph returned an empty trade amount"}
        return {
            "success": True,
            "provider": "coins.ph",
            "amount": provider_amount,
            "order_id": data.get("orderId") or order_id,
            "data": data,
        }
