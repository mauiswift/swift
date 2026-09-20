"""Coins.ph Pro spot trading client for the platform settlement account."""

import hashlib
import hmac
import logging
import time
from typing import Any, Dict
from urllib.parse import urlencode

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class CoinsPhService:
    def __init__(self) -> None:
        self.api_key = (settings.coinsp_api_key or "").strip()
        self.api_secret = (settings.coinsp_api_secret or "").strip()
        self.base_url = (settings.coinsp_api_base_url or "https://api.pro.coins.ph").strip().rstrip("/")
        self.symbol = (settings.coinsp_usdt_php_symbol or "USDTPHP").strip().upper()
        self.timeout = 30.0

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_secret)

    @staticmethod
    def _sign(params: list[tuple[str, Any]], secret: str) -> str:
        query = urlencode(params)
        return hmac.new(secret.encode(), query.encode(), hashlib.sha256).hexdigest()

    @staticmethod
    def _data(payload: Any) -> Dict[str, Any]:
        return payload if isinstance(payload, dict) else {}

    async def place_market_order(self, *, side: str, amount: float, client_order_id: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"success": False, "error": "Coins.ph trading is not configured"}
        if amount <= 0:
            return {"success": False, "error": "Order amount must be positive"}
        side = side.upper()
        if side not in {"BUY", "SELL"}:
            return {"success": False, "error": "Unsupported Coins.ph order side"}

        params: list[tuple[str, Any]] = [
            ("symbol", self.symbol),
            ("side", side),
            ("type", "MARKET"),
            ("newClientOrderId", client_order_id),
            ("newOrderRespType", "FULL"),
            ("recvWindow", 5000),
            ("timestamp", int(time.time() * 1000)),
        ]
        if side == "BUY":
            params.append(("quoteOrderQty", f"{amount:.2f}"))
        else:
            params.append(("quantity", f"{amount:.8f}"))
        params.append(("signature", self._sign(params, self.api_secret)))

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/openapi/v1/order",
                    headers={
                        "Accept": "application/json",
                        "X-COINS-APIKEY": self.api_key,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    data=params,
                )
            payload = response.json() if response.text else {}
            if response.status_code >= 400:
                logger.warning("Coins.ph order failed status=%s", response.status_code)
                return {"success": False, "error": self._data(payload).get("msg", "Coins.ph order failed")}
            data = self._data(payload)
            status = str(data.get("status") or "").upper()
            if status != "FILLED":
                return {"success": False, "error": f"Coins.ph order was not filled: {status or 'unknown status'}"}
            return {"success": True, "data": data}
        except Exception:
            logger.exception("Coins.ph order request failed")
            return {"success": False, "error": "Unable to reach Coins.ph trading service"}

    async def buy_usdt(self, php_amount: float, client_order_id: str) -> Dict[str, Any]:
        result = await self.place_market_order(side="BUY", amount=php_amount, client_order_id=client_order_id)
        if not result.get("success"):
            return result
        data = result["data"]
        return {"success": True, "data": {**data, "received_usdt": float(data.get("executedQty") or 0)}}

    async def sell_usdt(self, usdt_amount: float, client_order_id: str) -> Dict[str, Any]:
        result = await self.place_market_order(side="SELL", amount=usdt_amount, client_order_id=client_order_id)
        if not result.get("success"):
            return result
        data = result["data"]
        return {"success": True, "data": {**data, "received_php": float(data.get("cummulativeQuoteQty") or data.get("executedQuoteQty") or 0)}}