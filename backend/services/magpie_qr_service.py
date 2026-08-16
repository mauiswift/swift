"""
Magpie.im QR Code generation service for Alipay and WeChat Pay.
Handles QR code generation with proper currency support and conversion.
"""

import logging
import uuid
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class CurrencyConverter:
    """Simple currency converter for multi-currency support."""
    
    # Exchange rates (PHP to major currencies) - should be fetched from real service in production
    EXCHANGE_RATES = {
        'PHP': 1.0,
        'CNY': 0.0137,  # PHP to CNY (approximate)
        'USD': 0.0184,  # PHP to USD
        'EUR': 0.0170,  # PHP to EUR
        'KRW': 26.0,    # PHP to KRW (approximate)
    }
    
    # Supported currencies per payment method
    ALIPAY_CURRENCIES = ['CNY', 'USD', 'EUR', 'PHP']  # Alipay supports multiple
    WECHAT_CURRENCIES = ['CNY']  # WeChat primarily uses CNY
    KOREAN_CURRENCIES = ['KRW']  # Korean wallets commonly use KRW
    
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
    
    @classmethod
    def get_best_currency_for_method(cls, method: str) -> str:
        """Get the recommended currency for a payment method."""
        method_upper = (method or '').upper()
        if 'ALIPAY' in method_upper:
            return 'CNY'
        if 'WECHAT' in method_upper:
            return 'CNY'
        if any(token in method_upper for token in ['KAKAO', 'NAVER', 'PAYCO', 'TOSS']):
            return 'KRW'
        return 'PHP'


class MagpieQRService:
    """Service for generating Alipay and WeChat Pay payments via Magpie.im Payment Requests."""
    
    def __init__(self):
        self.api_key: str = (getattr(settings, "magpie_api_key", "") or "").strip()
        # Default to pay.magpie.im (required for V2 Checkout Sessions)
        base_url = (getattr(settings, "magpie_base_url", "") or "").strip().rstrip("/")
        self.base_url: str = base_url or "https://pay.magpie.im"
        self.is_configured: bool = bool(self.api_key)
    
    def _headers(self) -> Dict[str, str]:
        """Generate request headers for Magpie API.

        Magpie Payment Requests API typically uses the Secret Key as the username
        in Basic Auth, or Bearer token.
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            # Using Bearer token as it's more modern and supported by Magpie
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    async def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make a POST request to Magpie API."""
        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}
        
        url_base = self.base_url
        # pay.magpie.im is required for sessions
        if "sessions" in path and "api.magpie.im" in url_base:
            url_base = url_base.replace("api.magpie.im", "pay.magpie.im")
            logger.info(f"Overriding Magpie base URL for sessions: {self.base_url} -> {url_base}")

        url = f"{url_base}{path}"
        logger.info(f"Magpie POST request to {url} with payload: {payload}")
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=self._headers())
            
            response_text = resp.text or ""
            logger.info(f"Magpie API response ({resp.status_code}): {response_text}")

            if resp.status_code >= 400:
                return {
                    "success": False,
                    "error": f"Magpie API error ({resp.status_code}): {response_text}",
                }
            
            data = resp.json() if response_text else {}
            return {"success": True, "data": data}
        
        except Exception as exc:
            logger.error(f"Magpie POST request failed: {exc}", exc_info=True)
            return {"success": False, "error": str(exc)}
    
    async def create_alipay_qr(
        self,
        amount: float,
        description: str = "",
        currency: str = "PHP",
        reference_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_email: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate an Alipay payment request via Magpie v1/requests.
        """
        if not self.is_configured:
            return {"success": False, "error": "Magpie API not configured"}
        
        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}

        # Magpie uses integer cents
        amount_cents = int(round(amount * 100))
        
        payload = {
            "amount": amount_cents,
            "currency": (currency or "PHP").upper(),
            "description": description or "Alipay Payment",
            "customer_name": customer_name or "Customer",
            "customer_email": customer_email or "no-reply@swiftpay.site",
            "payment_method_types": ["alipay"],
            "delivery_method": "none", # Don't send email/sms, we just want the URL
            "metadata": {
                "reference_id": reference_id,
                "platform": "SwiftPay"
            }
        }
        
        result = await self._post("/v1/requests", payload)
        
        if result.get("success"):
            data = result.get("data", {})
            return {
                "success": True,
                "payment_method": "alipay",
                "payment_url": data.get("payment_url"),
                "qr_url": data.get("payment_url"), # In requests API, the URL hosts the QR
                "reference_id": reference_id or data.get("id"),
                "amount": amount,
                "currency": payload["currency"],
                "data": data
            }
        
        return result

    async def create_wechat_qr(
        self,
        amount: float,
        description: str = "",
        currency: str = "PHP",
        reference_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_email: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a WeChat payment request via Magpie v1/requests.
        """
        if not self.is_configured:
            return {"success": False, "error": "Magpie API not configured"}
        
        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}

        amount_cents = int(round(amount * 100))
        
        payload = {
            "amount": amount_cents,
            "currency": (currency or "PHP").upper(),
            "description": description or "WeChat Payment",
            "customer_name": customer_name or "Customer",
            "customer_email": customer_email or "no-reply@swiftpay.site",
            "payment_method_types": ["wechat"],
            "delivery_method": "none",
            "metadata": {
                "reference_id": reference_id,
                "platform": "SwiftPay"
            }
        }
        
        result = await self._post("/v1/requests", payload)
        
        if result.get("success"):
            data = result.get("data", {})
            return {
                "success": True,
                "payment_method": "wechat",
                "payment_url": data.get("payment_url"),
                "qr_url": data.get("payment_url"),
                "reference_id": reference_id or data.get("id"),
                "amount": amount,
                "currency": payload["currency"],
                "data": data
            }
        
        return result
    
    async def create_generic_qr(
        self,
        payment_method: str,
        amount: float,
        description: str = "",
        currency: Optional[str] = None,
        reference_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_email: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate a QR request for a supported international wallet, including Korean wallets."""
        if not self.is_configured:
            return {"success": False, "error": "Magpie API not configured"}

        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}

        normalized = (payment_method or "").lower().strip()
        if not normalized:
            return {"success": False, "error": "Payment method is required"}

        if not currency:
            currency = CurrencyConverter.get_best_currency_for_method(normalized)

        amount_cents = int(round(amount * 100))
        payload = {
            "amount": amount_cents,
            "currency": (currency or "PHP").upper(),
            "description": description or f"{normalized.replace('_', ' ').title()} Payment",
            "customer_name": customer_name or "Customer",
            "customer_email": customer_email or "no-reply@swiftpay.site",
            "payment_method_types": [normalized],
            "delivery_method": "none",
            "metadata": {
                "reference_id": reference_id,
                "platform": "SwiftPay",
            },
        }

        result = await self._post("/v1/requests", payload)
        if result.get("success"):
            data = result.get("data", {})
            return {
                "success": True,
                "payment_method": normalized,
                "payment_url": data.get("payment_url"),
                "qr_url": data.get("payment_url"),
                "reference_id": reference_id or data.get("id"),
                "amount": amount,
                "currency": payload["currency"],
                "data": data,
            }
        return result

    async def create_dynamic_qr(
        self,
        payment_method: str,
        amount: float,
        description: str = "",
        currency: Optional[str] = None,
        reference_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a QR code for supported international wallets including Korean methods.
        Automatically selects best currency for the payment method.
        """
        payment_method = (payment_method or "").lower().strip()
        supported = {"alipay", "wechat", "kakao", "kakaopay", "naverpay", "payco", "toss", "tosspay"}

        if payment_method not in supported:
            return {
                "success": False,
                "error": f"Unsupported payment method: {payment_method}. Supported methods: {sorted(supported)}",
            }

        if not currency:
            currency = CurrencyConverter.get_best_currency_for_method(payment_method)

        if payment_method in {"alipay", "wechat"}:
            if payment_method == "alipay":
                return await self.create_alipay_qr(
                    amount=amount,
                    description=description,
                    currency=currency,
                    reference_id=reference_id,
                    customer_name=customer_name,
                    **kwargs
                )
            return await self.create_wechat_qr(
                amount=amount,
                description=description,
                currency=currency,
                reference_id=reference_id,
                customer_name=customer_name,
                **kwargs
            )

        return await self.create_generic_qr(
            payment_method=payment_method,
            amount=amount,
            description=description,
            currency=currency,
            reference_id=reference_id,
            customer_name=customer_name,
            **kwargs
        )

    async def create_checkout_session(
        self,
        payment_method: str,
        amount: float,
        currency: str = "CNY",
        reference_id: Optional[str] = None,
        description: str = "",
        customer_name: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a checkout session via Magpie `/checkout-sessions`.

        Returns Magpie response directly, normalized to contain `checkout_url`,
        `qr_url` or `qr_content` when available.
        """
        if not self.is_configured:
            return {"success": False, "error": "Magpie API not configured"}

        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}

        reference_id = reference_id or f"{payment_method}-{uuid.uuid4().hex[:12]}"

        payload = {
            "payment_method": payment_method,
            "amount": amount,
            "currency": (currency or "CNY").upper(),
            "reference_id": reference_id,
            "description": description or f"{payment_method} payment",
            "merchant_name": getattr(settings, "app_name", "SwiftPay"),
        }

        if customer_name:
            payload["customer_name"] = customer_name
        if success_url:
            payload["success_url"] = success_url
        if cancel_url:
            payload["cancel_url"] = cancel_url
        if metadata:
            payload["metadata"] = metadata

        result = await self._post("/v2/sessions", payload)
        if not result.get("success"):
            return result

        data = result.get("data", {})
        return {
            "success": True,
            "checkout_url": data.get("checkout_url") or data.get("url"),
            "qr_url": data.get("qr_url"),
            "qr_content": data.get("qr_content"),
            "reference_id": reference_id,
            "raw": data,
        }
