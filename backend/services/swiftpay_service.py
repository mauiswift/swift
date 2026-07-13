import hashlib
import hmac
import json
import logging
from typing import Any, Dict, Optional

import httpx
from core.config import settings
import asyncio
import socket
from httpx import ConnectError

logger = logging.getLogger(__name__)

DEFAULT_SWIFTPAY_BASE_URLS = {
    "sandbox": "https://api.pay.sandbox.live.swiftpay.ph",
    "production": "https://api.pay.live.swiftpay.ph",
}


class SwiftPayService:
    """Client for SwiftPay's REST API integration."""

    def __init__(self):
        self.access_key = (settings.swiftpay_access_key or "").strip()
        self.secret_key = (settings.swiftpay_secret_key or "").strip()
        self.mode = (settings.swiftpay_mode or "sandbox").strip().lower()
        base_url = (settings.swiftpay_base_url or "").strip().rstrip("/")
        self.base_url = base_url or DEFAULT_SWIFTPAY_BASE_URLS.get(self.mode, DEFAULT_SWIFTPAY_BASE_URLS["production"])
        self.callback_url = (settings.swiftpay_callback_url or "").strip()
        self.timeout = 30.0
        # Quick DNS sanity check for the configured base host to catch bad hostnames early
        try:
            host = self.base_url.split("//")[-1].split("/")[0]
            socket.getaddrinfo(host, None)
        except Exception:
            logger.warning("SwiftPay host %s did not resolve during init; network/DNS may be restricted", getattr(self, 'base_url', None))

    def is_configured(self) -> bool:
        return bool(self.access_key and self.secret_key)

    @staticmethod
    def _format_amount(amount: float) -> str:
        return f"{amount:.2f}"

    @staticmethod
    def _stringify_value(value: Any) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if value is None:
            return ""
        if isinstance(value, (dict, list)):
            return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        return str(value)

    def _sign_payload(self, payload: Dict[str, Any]) -> str:
        signing_keys = sorted(k for k in payload if k.startswith("x_") and payload[k] not in (None, ""))
        message = "".join(
            f"{key}{self._stringify_value(payload[key])}" if key != "x_amount" else f"{key}{self._format_amount(float(payload[key]))}"
            for key in signing_keys
        )
        logger.debug("SwiftPay signing message=%s", message)
        return hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    async def create_order(
        self,
        *,
        amount: float,
        reference_no: str,
        details: Optional[Dict[str, Any]] = None,
        currency: str = "PHP",
        generate_customer_redirect_url: bool = True,
        institution_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        payload: Dict[str, Any] = {
            "x_access_key": self.access_key,
            "x_reference_no": reference_no,
            "x_amount": self._format_amount(amount),
            "x_currency": currency,
            "details": details or {},
            "generate_customer_redirect_url": generate_customer_redirect_url,
        }
        if institution_code:
            payload["institution_code"] = institution_code

        payload["signature"] = self._sign_payload(payload)

        url = f"{self.base_url}/api/orders"
        logger.info("SwiftPay create_order %s payload=%s", url, payload)
        # Robust request with retries and clearer network error messages
        max_retries = 3
        backoff = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload)
                text = resp.text or ""
                if resp.status_code >= 400:
                    logger.warning("SwiftPay create_order failed %s %s", resp.status_code, text)
                    return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}
                data = resp.json() if text else {}
                return {"success": True, "data": data}
            except ConnectError as exc:
                logger.warning("SwiftPay connect error on attempt %s/%s: %s", attempt, max_retries, exc)
                if attempt == max_retries:
                    return {"success": False, "error": "Network error: unable to reach SwiftPay host (DNS or network error). Please check network/DNS or set `swiftpay_base_url` to a reachable host."}
            except Exception as exc:
                logger.exception("SwiftPay create_order exception on attempt %s/%s", attempt, max_retries)
                if attempt == max_retries:
                    return {"success": False, "error": str(exc)}
            await asyncio.sleep(backoff)
            backoff *= 2

    def verify_signature(self, payload: Dict[str, Any], signature: str) -> bool:
        if not self.is_configured():
            return False

        signing_payload = {k: payload[k] for k in payload if k.startswith("x_") and payload[k] not in (None, "")}
        signing_keys = sorted(signing_payload.keys())
        message = "".join(
            f"{key}{self._stringify_value(signing_payload[key])}" if key != "x_amount" else f"{key}{self._format_amount(float(signing_payload[key]))}"
            for key in signing_keys
        )
        expected = hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        logger.debug("SwiftPay verify_signature computed=%s received=%s message=%s", expected, signature, message)
        return hmac.compare_digest(expected, signature)

    async def get_institutions(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/institutions"
        logger.info("SwiftPay get_institutions %s", url)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers={"Accept": "application/json"})
            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay get_institutions failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}
            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except ConnectError as exc:
            logger.warning("SwiftPay get_institutions network error: %s", exc)
            return {"success": False, "error": "Network error: unable to reach SwiftPay host (DNS or network error)."}
        except Exception as exc:
            logger.exception("SwiftPay get_institutions exception")
            return {"success": False, "error": str(exc)}
