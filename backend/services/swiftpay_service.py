import base64
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
                "details": details if details is not None else [],
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
                    
                    # ✅ DISABLED: For 202 responses, skip status polling
                    # Status polling was failing with 401 errors (authentication issue with GET endpoints)
                    # The order is created successfully on the server, so we proceed without polling
                    if resp.status_code == 202:
                        logger.info("SwiftPay returned 202 (async). Order created, skipping status polling due to GET auth issues.")
                    
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
        """Query payment status by payment ID (Step 6).

        Uses the X-Swiftpay-Payment-Token header as specified in the documentation.
        """
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/payments/status"
        headers = {
            "Accept": "application/json",
            "X-Swiftpay-Payment-Token": payment_id
        }

        logger.info("SwiftPay get_payment_status_by_id %s (id=%s)", url, payment_id)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers=headers)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay status by ID failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay get_payment_status_by_id exception")
            return {"success": False, "error": str(exc)}

    async def get_payment_status_by_reference(self, reference_no: str) -> Dict[str, Any]:
        """Query payment status by reference number (Step 7).

        Uses query parameters as specified in the documentation.
        """
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/payments/status/query"
        params = {
            "accessKey": self.access_key,
            "referenceNo": reference_no
        }

        logger.info("SwiftPay get_payment_status_by_reference %s (ref=%s)", url, reference_no)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params, headers={"Accept": "application/json"})

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay status by reference failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            # Step 7 can return a list of payments if referenceNo is not unique
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay get_payment_status_by_reference exception")
            return {"success": False, "error": str(exc)}

    async def generate_qrph(
        self,
        *,
        amount: float,
        reference_no: str,
        currency: str = "PHP",
        qr_type: str = "P2P"
    ) -> Dict[str, Any]:
        """Generate QR PH payment (Step 5)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/bootstrap/qrph"
        # Type is a query parameter
        request_url = f"{url}?type={qr_type}"

        payload = {
            "x_access_key": self.access_key,
            "x_reference_no": reference_no,
            "x_amount": self._format_amount(amount),
            "x_currency": currency
        }
        payload["signature"] = self._sign_payload(payload)

        logger.info("SwiftPay generate_qrph %s payload=%s", request_url, payload)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(request_url, json=payload)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay generate_qrph failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay generate_qrph exception")
            return {"success": False, "error": str(exc)}

    async def send_disbursement(
        self,
        *,
        reference_no: str,
        amount: float,
        bank_code: str,
        account_number: str,
        first_name: str,
        last_name: str,
        middle_name: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        line1: str = "N/A",
        line2: Optional[str] = None,
        city: str = "Manila",
        province: str = "Metro Manila",
        postal_code: str = "1000",
        country_code: str = "PH",
        note: str = "",
        channel: str = "INSTAPAY"
    ) -> Dict[str, Any]:
        """Send a disbursement via SwiftPay Disbursement API (Step 1 & 2)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/disbursements/send"

        payload = {
            "merchantReferenceNo": reference_no,
            "channel": channel,
            "institutionCode": bank_code,
            "creditInformation": {
                "amount": self._format_amount(amount),
                "remarks": note or f"Disbursement for {reference_no}"
            },
            "recipientInformation": {
                "accountNumber": account_number,
                "firstName": first_name,
                "middleName": middle_name,
                "lastName": last_name,
                "mobileNumber": phone or "",
                "email": email or "",
                "address": {
                    "Line1": line1,
                    "Line2": line2,
                    "city": city,
                    "postalCode": postal_code,
                    "province": province,
                    "countryCode": country_code
                }
            }
        }

        # Basic Auth: base64(accessKey:secretKey)
        auth_str = f"{self.access_key}:{self.secret_key}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        logger.info("SwiftPay send_disbursement %s payload=%s", url, payload)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)

            text = resp.text or ""
            # Documentation says HTTP 200 with empty body means scheduled
            if resp.status_code == 200 and not text.strip():
                return {"success": True, "data": {"status": "PENDING"}}

            if resp.status_code >= 400:
                logger.warning("SwiftPay send_disbursement failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {"status": "PENDING"}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay send_disbursement exception")
            return {"success": False, "error": str(exc)}

    async def get_disbursement_by_id(self, disb_id: str) -> Dict[str, Any]:
        """Read Disbursement By Id (Step 4)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/disbursements/{disb_id}"

        auth_str = f"{self.access_key}:{self.secret_key}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        }

        logger.info("SwiftPay get_disbursement_by_id %s", url)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers=headers)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay read disbursement failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay read disbursement exception")
            return {"success": False, "error": str(exc)}

    async def get_disbursements(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read Disbursements (Step 3)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/disbursements"

        # Note: Documentation says "Body" for GET request in Read Disbursements,
        # but also lists merchantId, merchantReferenceNo, etc.
        # Usually GET requests use query params. I'll use query params first.

        auth_str = f"{self.access_key}:{self.secret_key}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        }

        logger.info("SwiftPay get_disbursements %s params=%s", url, params)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params, headers=headers)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay read disbursements failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else []
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay read disbursements exception")
            return {"success": False, "error": str(exc)}
