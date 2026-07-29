"""Magpie service shim with safe runtime short-circuit and circuit breaker.

This module provides a `MagpieService` class that implements the Magpie.im
Source + Charge API for Alipay and WeChat Pay payments.

Documentation: https://magpie.apidocumentation.com/core-payments
"""

import logging
import time
import base64
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class CurrencyConverter:
    """Simple currency converter for multi-currency support."""
    
    # Exchange rates (PHP to major currencies)
    EXCHANGE_RATES = {
        'PHP': 1.0,
        'CNY': 0.0137,  # PHP to CNY (approximate)
        'USD': 0.0184,  # PHP to USD
        'EUR': 0.0170,  # PHP to EUR
    }
    
    @classmethod
    def convert(cls, amount: float, from_currency: str, to_currency: str) -> float:
        """Convert amount from one currency to another."""
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        if from_currency == to_currency:
            return amount
        
        if from_currency not in cls.EXCHANGE_RATES or to_currency not in cls.EXCHANGE_RATES:
            logger.warning(f"Unsupported currency conversion: {from_currency} -> {to_currency}")
            return amount
        
        # Convert to base currency (PHP), then to target
        php_amount = amount / cls.EXCHANGE_RATES[from_currency]
        converted = php_amount * cls.EXCHANGE_RATES[to_currency]
        
        return round(converted, 2)


class MagpieService:
    """Magpie.im payment service using Source + Charge API.

    Implements proper Magpie API flow for Alipay and WeChat Pay:
    1. Create a Source (payment method)
    2. Create a Charge using that source
    3. Redirect user to checkout URL
    """

    def __init__(self) -> None:
        self.api_key: str = (getattr(settings, "magpie_secret_key", None) or getattr(settings, "magpie_api_key", "") or "").strip()
        base_url = (getattr(settings, "magpie_base_url", "") or "").strip().rstrip("/")
        # Magpie V2 (current) uses pay.magpie.im for API and hosted checkout
        self.base_url: str = base_url or "https://pay.magpie.im"

        # Circuit breaker (class-level state shared across process)
        if not hasattr(MagpieService, "_consecutive_failures"):
            MagpieService._consecutive_failures = 0
            MagpieService._circuit_open_until = 0.0
            MagpieService._circuit_threshold = getattr(settings, "magpie_circuit_threshold", 5)
            MagpieService._circuit_cooldown_seconds = getattr(settings, "magpie_circuit_cooldown_seconds", 60)

        # Runtime short-circuit flag (in-memory toggle)
        if not hasattr(MagpieService, "_runtime_short_circuit"):
            MagpieService._runtime_short_circuit = False

    def _basic_auth_header(self) -> str:
        """Generate HTTP Basic Auth header using API key as username."""
        # Magpie uses Basic Auth with API key as username and empty password
        credentials = f"{self.api_key}:"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    def _headers(self) -> Dict[str, str]:
        """Generate request headers for Magpie API."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            # Magpie Checkout Sessions (V2) uses Basic Auth
            # Credentials are "<api_key>:" (api_key as username, empty password)
            headers["Authorization"] = self._basic_auth_header()
        return headers

    @classmethod
    def set_runtime_short_circuit(cls, enabled: bool) -> None:
        cls._runtime_short_circuit = bool(enabled)
        logger.warning("Magpie runtime short-circuit set to %s", cls._runtime_short_circuit)

    @classmethod
    def is_runtime_short_circuited(cls) -> bool:
        return bool(getattr(cls, "_runtime_short_circuit", False))

    def _removed(self) -> Dict[str, Any]:
        return {"success": False, "error": "Magpie integration unavailable"}

    def _check_circuit(self, operation: str = "request") -> Optional[Dict[str, Any]]:
        """Check circuit breaker and runtime short-circuit."""
        if MagpieService.is_runtime_short_circuited():
            logger.warning("Magpie runtime short-circuit active; blocking %s", operation)
            return {"success": False, "error": "Magpie requests disabled by runtime short-circuit"}
        
        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}
        
        now = time.time()
        if getattr(MagpieService, "_circuit_open_until", 0.0) > now:
            logger.warning("Magpie circuit open, short-circuiting %s", operation)
            return {"success": False, "error": "Magpie temporarily unavailable (circuit open)"}
        
        return None

    async def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make a POST request to Magpie API."""
        circuit_check = self._check_circuit("POST")
        if circuit_check:
            return circuit_check
        
        url = f"{self.base_url}{path}"
        logger.info(f"Magpie POST request to {url} payload={payload}")
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=self._headers())
            
            response_text = resp.text or ""
            logger.info(f"Magpie POST response status={resp.status_code} body={response_text}")

            if resp.status_code >= 400:
                logger.error(
                    f"Magpie API error {resp.status_code} on {path}: {response_text}"
                )

                # Try to extract a clean error message
                error_msg = response_text
                try:
                    error_json = resp.json()
                    if isinstance(error_json, dict):
                        error_msg = error_json.get("error", {}).get("message") or error_json.get("message") or response_text
                except Exception:
                    pass

                MagpieService._consecutive_failures = getattr(MagpieService, "_consecutive_failures", 0) + 1
                if MagpieService._consecutive_failures >= MagpieService._circuit_threshold:
                    MagpieService._circuit_open_until = time.time() + MagpieService._circuit_cooldown_seconds
                    logger.warning("Magpie circuit opened due to repeated errors")
                return {
                    "success": False,
                    "error": f"Magpie Error ({resp.status_code}): {error_msg}",
                }
            
            data = resp.json() if response_text else {}
            MagpieService._consecutive_failures = 0  # Reset on success
            return {"success": True, "data": data}
        
        except Exception as exc:
            logger.error(f"Magpie POST request failed: {exc}", exc_info=True)
            MagpieService._consecutive_failures = getattr(MagpieService, "_consecutive_failures", 0) + 1
            if MagpieService._consecutive_failures >= MagpieService._circuit_threshold:
                MagpieService._circuit_open_until = time.time() + MagpieService._circuit_cooldown_seconds
            return {"success": False, "error": str(exc)}

    async def _get(self, path: str) -> Dict[str, Any]:
        """Make a GET request to Magpie API."""
        circuit_check = self._check_circuit("GET")
        if circuit_check:
            return circuit_check
        
        url = f"{self.base_url}{path}"
        logger.debug(f"Magpie GET request to {url}")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
            
            response_text = resp.text or ""
            
            if resp.status_code >= 400:
                logger.warning(f"Magpie API GET error {resp.status_code} on {path}: {response_text}")
                MagpieService._consecutive_failures = getattr(MagpieService, "_consecutive_failures", 0) + 1
                if MagpieService._consecutive_failures >= MagpieService._circuit_threshold:
                    MagpieService._circuit_open_until = time.time() + MagpieService._circuit_cooldown_seconds
                return {"success": False, "error": f"Magpie API error ({resp.status_code}): {response_text}"}
            
            data = resp.json() if response_text else {}
            MagpieService._consecutive_failures = 0  # Reset on success
            return {"success": True, "data": data}
        
        except Exception as exc:
            logger.error(f"Magpie GET request failed: {exc}", exc_info=True)
            MagpieService._consecutive_failures = getattr(MagpieService, "_consecutive_failures", 0) + 1
            if MagpieService._consecutive_failures >= MagpieService._circuit_threshold:
                MagpieService._circuit_open_until = time.time() + MagpieService._circuit_cooldown_seconds
            return {"success": False, "error": str(exc)}

    @staticmethod
    def _pick(data: Any, *keys: str) -> Optional[Any]:
        if not isinstance(data, dict):
            return None
        for key in keys:
            if key in data and data[key] not in (None, ""):
                return data[key]
        return None

    async def create_source(
        self,
        payment_type: str,  # "alipay" or "wechat"
        success_url: str,
        fail_url: str,
        notify_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a Magpie Source for Alipay or WeChat Pay.
        
        Args:
            payment_type: "alipay" for Alipay or "wechat" for WeChat Pay
            success_url: Redirect URL on successful payment
            fail_url: Redirect URL on failed payment
            notify_url: Optional webhook URL for notifications
        
        Returns:
            Dict with source ID and metadata
        """
        # Map payment types to Magpie source types
        type_map = {
            "alipay": "alipay",
            "wechat": "wechat",
        }
        source_type = type_map.get(payment_type.lower())
        if not source_type:
            return {"success": False, "error": f"Unsupported payment type: {payment_type}"}
        
        payload = {
            "type": source_type,
            "redirect": {
                "success": success_url,
                "fail": fail_url,
            }
        }
        
        if notify_url:
            payload["redirect"]["notify"] = notify_url
        
        logger.info(f"Creating Magpie source for {payment_type}")
        result = await self._post("/v2/sources/", payload)
        
        if result.get("success"):
            source_data = result.get("data", {})
            return {
                "success": True,
                "source_id": source_data.get("id"),
                "source_type": source_data.get("type"),
                "vaulted": source_data.get("vaulted", False),
                "created_at": source_data.get("created_at"),
            }
        
        return result

    async def create_charge(
        self,
        source_id: str,
        amount: int,  # In smallest currency unit (e.g., centavos for CNY)
        currency: str,
        description: str,
        statement_descriptor: str,
        capture: bool = True,
    ) -> Dict[str, Any]:
        """
        Create a charge using an existing source.
        
        Args:
            source_id: ID from create_source
            amount: Amount in smallest currency unit (e.g., 5000 for ¥50.00)
            currency: Currency code (e.g., "CNY", "PHP")
            description: Payment description
            statement_descriptor: Text shown on user's statement (max 15 chars)
            capture: Whether to immediately capture (True) or authorize only (False)
        
        Returns:
            Dict with charge data including redirect URL
        """
        payload = {
            "amount": amount,
            "currency": currency.upper(),
            "source": source_id,
            "description": description,
            "statement_descriptor": statement_descriptor[:15],  # Truncate to max 15 chars
            "capture": capture,
        }
        
        logger.info(f"Creating charge for {amount} {currency} with source {source_id}")
        result = await self._post("/v2/charges/", payload)
        
        if result.get("success"):
            charge_data = result.get("data", {})
            action = charge_data.get("action", {})
            
            return {
                "success": True,
                "charge_id": charge_data.get("id"),
                "amount": charge_data.get("amount"),
                "currency": charge_data.get("currency"),
                "status": charge_data.get("status"),
                "redirect_url": action.get("url"),
                "action_type": action.get("type"),
                "created_at": charge_data.get("created_at"),
            }
        
        return result

    async def get_charge(self, charge_id: str) -> Dict[str, Any]:
        """Retrieve charge status."""
        result = await self._get(f"/v2/charges/{charge_id}")
        
        if result.get("success"):
            charge_data = result.get("data", {})
            return {
                "success": True,
                "charge_id": charge_data.get("id"),
                "status": charge_data.get("status"),
                "amount": charge_data.get("amount"),
                "currency": charge_data.get("currency"),
                "captured": charge_data.get("captured"),
                "amount_refunded": charge_data.get("amount_refunded"),
            }
        
        return result

    async def create_alipay_payment(
        self,
        amount_php: float,
        description: str,
        reference_id: Optional[str] = None,
        success_url: Optional[str] = None,
        fail_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an Alipay payment (source + charge flow).
        
        Args:
            amount_php: Amount in PHP
            description: Payment description
            reference_id: Your reference ID
            success_url: URL to redirect on success
            fail_url: URL to redirect on failure
        
        Returns:
            Dict with payment checkout URL and transaction data
        """
        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}
        
        reference_id = reference_id or f"alipay-{uuid.uuid4().hex[:12]}"
        
        # Convert PHP to CNY
        amount_cny = CurrencyConverter.convert(amount_php, "PHP", "CNY")
        # Convert to centavos (smallest currency unit for CNY, i.e., multiply by 100)
        amount_cny_cents = int(round(amount_cny * 100))
        
        logger.info(f"Alipay: Converting ₱{amount_php} to ¥{amount_cny} ({amount_cny_cents} cents)")
        
        # Use provided URLs or fallback to app defaults
        success_url = success_url or f"{getattr(settings, 'app_url', 'https://example.com')}/payment/success?ref={reference_id}"
        fail_url = fail_url or f"{getattr(settings, 'app_url', 'https://example.com')}/payment/fail?ref={reference_id}"
        
        # Step 1: Create source
        source_result = await self.create_source(
            payment_type="alipay",
            success_url=success_url,
            fail_url=fail_url,
        )
        
        if not source_result.get("success"):
            return source_result
        
        source_id = source_result.get("source_id")
        
        # Step 2: Create charge with source
        charge_result = await self.create_charge(
            source_id=source_id,
            amount=amount_cny_cents,
            currency="CNY",
            description=description,
            statement_descriptor="SwiftPay",
            capture=True,
        )
        
        if charge_result.get("success"):
            return {
                "success": True,
                "payment_method": "alipay",
                "reference_id": reference_id,
                "charge_id": charge_result.get("charge_id"),
                "source_id": source_id,
                "amount_php": amount_php,
                "amount_cny": amount_cny,
                "checkout_url": charge_result.get("redirect_url"),
                "status": charge_result.get("status"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    "original_amount": amount_php,
                    "original_currency": "PHP",
                    "converted_amount": amount_cny,
                    "converted_currency": "CNY",
                }
            }
        
        return charge_result

    async def create_wechat_payment(
        self,
        amount_php: float,
        description: str,
        reference_id: Optional[str] = None,
        success_url: Optional[str] = None,
        fail_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a WeChat Pay payment (source + charge flow).
        
        Args:
            amount_php: Amount in PHP
            description: Payment description
            reference_id: Your reference ID
            success_url: URL to redirect on success
            fail_url: URL to redirect on failure
        
        Returns:
            Dict with payment checkout URL and transaction data
        """
        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}
        
        reference_id = reference_id or f"wechat-{uuid.uuid4().hex[:12]}"
        
        # Convert PHP to CNY
        amount_cny = CurrencyConverter.convert(amount_php, "PHP", "CNY")
        # Convert to centavos (smallest currency unit for CNY)
        amount_cny_cents = int(round(amount_cny * 100))
        
        logger.info(f"WeChat: Converting ₱{amount_php} to ¥{amount_cny} ({amount_cny_cents} cents)")
        
        # Use provided URLs or fallback to app defaults
        success_url = success_url or f"{getattr(settings, 'app_url', 'https://example.com')}/payment/success?ref={reference_id}"
        fail_url = fail_url or f"{getattr(settings, 'app_url', 'https://example.com')}/payment/fail?ref={reference_id}"
        
        # Step 1: Create source
        source_result = await self.create_source(
            payment_type="wechat",
            success_url=success_url,
            fail_url=fail_url,
        )
        
        if not source_result.get("success"):
            return source_result
        
        source_id = source_result.get("source_id")
        
        # Step 2: Create charge with source
        charge_result = await self.create_charge(
            source_id=source_id,
            amount=amount_cny_cents,
            currency="CNY",
            description=description,
            statement_descriptor="SwiftPay",
            capture=True,
        )
        
        if charge_result.get("success"):
            return {
                "success": True,
                "payment_method": "wechat",
                "reference_id": reference_id,
                "charge_id": charge_result.get("charge_id"),
                "source_id": source_id,
                "amount_php": amount_php,
                "amount_cny": amount_cny,
                "checkout_url": charge_result.get("redirect_url"),
                "status": charge_result.get("status"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    "original_amount": amount_php,
                    "original_currency": "PHP",
                    "converted_amount": amount_cny,
                    "converted_currency": "CNY",
                }
            }
        
        return charge_result

    async def create_session(
        self,
        *,
        amount_cents: int,
        currency: str,
        product_name: str,
        success_url: str,
        cancel_url: str,
        client_reference_id: Optional[str] = None,
        payment_method_types: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a Magpie Checkout Session (V2 API).

        Documentation: https://magpie.apidocumentation.com/checkout-sessions
        """
        # Note: Based on technical requirements for Magpie V2,
        # we use flat line_items structure for maximum compatibility.
        payload = {
            "success_url": success_url,
            "cancel_url": cancel_url,
            "line_items": [
                {
                    "description": product_name,
                    "amount": amount_cents,
                    "currency": currency.lower(),
                    "quantity": 1,
                }
            ],
        }

        if client_reference_id:
            payload["client_reference_id"] = client_reference_id

        if payment_method_types:
            payload["payment_method_types"] = payment_method_types

        logger.info(f"Creating Magpie checkout session for {product_name} ({amount_cents} {currency})")

        # Override base URL for sessions if it's currently pointing to api.magpie.im
        # pay.magpie.im is the required domain for Checkout Sessions (V2)
        endpoint_url = "/v2/sessions"
        if "api.magpie.im" in self.base_url:
            original_base = self.base_url
            self.base_url = self.base_url.replace("api.magpie.im", "pay.magpie.im")
            logger.info(f"Overriding Magpie base URL for session creation: {original_base} -> {self.base_url}")
            result = await self._post(endpoint_url, payload)
            self.base_url = original_base # Restore for other calls
            return result

        return await self._post(endpoint_url, payload)

    # Fallback methods for backward compatibility
    async def create_checkout(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_invoice(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_payment_link(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_ewallet_charge(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_refund(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def get_checkout_status(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_payout(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def get_balance(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_qr_payment(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()


async def run_card_settlement_sweep() -> None:
    # Placeholder hook to preserve the previous interface. Keep lightweight.
    logger.info("Magpie settlement sweep hook executed")
