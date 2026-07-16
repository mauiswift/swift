import hashlib
import hmac
import json
import logging
import uuid
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

        max_retries = 3
        base_reference = (reference_no or "").strip() or f"swiftpay-{uuid.uuid4().hex[:12]}"
        last_error: Optional[str] = None
        last_data: Optional[Dict[str, Any]] = None

        for attempt in range(1, max_retries + 1):
            current_reference = base_reference if attempt == 1 else f"{base_reference}-{uuid.uuid4().hex[:6]}"
            payload: Dict[str, Any] = {
                "x_access_key": self.access_key,
                "x_reference_no": current_reference,
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
            backoff = 1.0
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload)
                text = resp.text or ""
                
                # Log response details
                logger.info("SwiftPay create_order response status=%s content_length=%s", resp.status_code, len(text))
                if text:
                    try:
                        logger.debug("SwiftPay create_order response body=%s", text)
                    except Exception:
                        logger.debug("SwiftPay create_order response body (raw): %s bytes", len(text))
                
                if resp.status_code >= 400:
                    logger.warning("SwiftPay create_order failed %s %s", resp.status_code, text)
                    last_error = f"SwiftPay API error ({resp.status_code}): {text}"
                    try:
                        parsed = resp.json() if text else {}
                    except Exception:
                        parsed = {}
                    if isinstance(parsed, dict) and (parsed.get("errorCode") == "DUPLICATED_REFERENCE_NO" or parsed.get("code") == "DUPLICATED_REFERENCE_NO"):
                        if attempt < max_retries:
                            logger.warning("SwiftPay duplicate reference detected, retrying with new reference: %s", current_reference)
                            await asyncio.sleep(backoff)
                            continue
                    return {"success": False, "error": last_error}
                
                # Handle both 200 and 202 responses
                if resp.status_code in (200, 202):
                    data = resp.json() if text else {}
                    last_data = data
                    
                    # For 202, wait a bit before polling to ensure the order is created
                    if resp.status_code == 202:
                        logger.info("SwiftPay returned 202 (async). Waiting before status polling...")
                        await asyncio.sleep(2)
                        
                        # Try to fetch the order status to ensure it's queryable
                        order_id = data.get("paymentId") or data.get("payment_id") or data.get("orderId") or data.get("order_id")
                        reference = data.get("referenceNo") or data.get("reference_no") or current_reference
                        
                        # Poll for order availability with retries
                        poll_attempts = 5
                        for poll_attempt in range(poll_attempts):
                            status_result = await self.get_payment_status(order_id or reference)
                            if status_result.get("success"):
                                logger.info("SwiftPay order confirmed as queryable after %d attempts", poll_attempt + 1)
                                # Merge status data into response
                                data = {**data, **status_result.get("data", {})}
                                break
                            elif poll_attempt < poll_attempts - 1:
                                await asyncio.sleep(1)  # Wait 1 second before retry
                            else:
                                logger.warning("SwiftPay order not yet queryable after %d attempts, returning response anyway", poll_attempts)
                    
                    return {"success": True, "data": data, "reference_no": current_reference}
                
                # Unexpected status code that's not >= 400
                logger.warning("SwiftPay unexpected status code %s", resp.status_code)
                return {"success": False, "error": f"Unexpected status code: {resp.status_code}"}
                
            except ConnectError as exc:
                logger.warning("SwiftPay connect error on attempt %s/%s: %s", attempt, max_retries, exc)
                last_error = "Network error: unable to reach SwiftPay host (DNS or network error). Please check network/DNS or set `swiftpay_base_url` to a reachable host."
                if attempt == max_retries:
                    return {"success": False, "error": last_error}
            except Exception as exc:
                logger.exception("SwiftPay create_order exception on attempt %s/%s", attempt, max_retries)
                last_error = str(exc)
                if attempt == max_retries:
                    return {"success": False, "error": last_error}
            await asyncio.sleep(backoff)
            backoff *= 2

        return {"success": False, "error": last_error or "SwiftPay create order failed"}

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

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Attempt to fetch payment/order status from SwiftPay.

        Tries common endpoints (`/api/payments/{id}` and `/api/orders/{id}`) and
        returns the JSON payload when successful.
        
        ✅ FIX: GET requests now include x_signature header for authentication.
        Signature is computed the same way as POST requests but using GET path.
        """
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        candidates = [f"{self.base_url}/api/payments/{payment_id}", f"{self.base_url}/api/orders/{payment_id}"]
        
        for url in candidates:
            try:
                logger.info("SwiftPay get_payment_status trying %s", url)
                
                # ✅ CRITICAL FIX: Compute signature for GET request
                # SwiftPay requires signature auth on GET endpoints too
                # Build a minimal payload for signature calculation
                signature_payload = {
                    "x_access_key": self.access_key,
                }
                signature = self._sign_payload(signature_payload)
                
                headers = {
                    "Accept": "application/json",
                    "x_access_key": self.access_key,
                    "x_signature": signature,  # ✅ ADD SIGNATURE HEADER
                }
                
                logger.debug("SwiftPay GET auth headers: x_access_key=%s x_signature=%s", 
                           self.access_key[:10] + "...", signature[:16] + "...")
                
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, headers=headers)
                text = resp.text or ""
                if resp.status_code >= 400:
                    logger.debug("SwiftPay endpoint %s returned %s", url, resp.status_code)
                    continue
                data = resp.json() if text else {}
                logger.info("SwiftPay get_payment_status success from %s: %s", url, data)
                return {"success": True, "data": data}
            except ConnectError as exc:
                logger.warning("SwiftPay get_payment_status network error for %s: %s", url, exc)
                return {"success": False, "error": "Network error: unable to reach SwiftPay host."}
            except Exception as exc:
                logger.exception("SwiftPay get_payment_status exception for %s", url)
                continue

        return {"success": False, "error": "Could not retrieve payment status from SwiftPay"}
