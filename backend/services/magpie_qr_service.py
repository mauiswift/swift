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
    }
    
    # Supported currencies per payment method
    ALIPAY_CURRENCIES = ['CNY', 'USD', 'EUR', 'PHP']  # Alipay supports multiple
    WECHAT_CURRENCIES = ['CNY']  # WeChat primarily uses CNY
    
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
        method_upper = method.upper()
        if 'ALIPAY' in method_upper:
            return 'CNY'
        elif 'WECHAT' in method_upper:
            return 'CNY'
        return 'PHP'


class MagpieQRService:
    """Service for generating Alipay and WeChat Pay QR codes via Magpie.im."""
    
    def __init__(self):
        self.api_key: str = (getattr(settings, "magpie_api_key", "") or "").strip()
        base_url = (getattr(settings, "magpie_base_url", "") or "").strip().rstrip("/")
        self.base_url: str = base_url or "https://api.magpie.im"
        self.is_configured: bool = bool(self.api_key)
    
    def _headers(self) -> Dict[str, str]:
        """Generate request headers for Magpie API."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["X-API-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    async def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make a POST request to Magpie API."""
        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}
        
        url = f"{self.base_url}{path}"
        logger.debug(f"Magpie POST request to {url} with payload: {payload}")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload, headers=self._headers())
            
            response_text = resp.text or ""
            
            if resp.status_code >= 400:
                logger.error(
                    f"Magpie API error {resp.status_code} on {path}: {response_text}"
                )
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
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate an Alipay QR code via Magpie.
        
        Args:
            amount: Payment amount in the specified currency
            description: Payment description/purpose
            currency: Currency code (PHP, CNY, USD, EUR) - defaults to PHP
            reference_id: Merchant reference ID
            customer_name: Customer name (optional)
            **kwargs: Additional parameters
        
        Returns:
            Dict with success status and QR code data
        """
        if not self.is_configured:
            return {"success": False, "error": "Magpie API not configured"}
        
        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}
        
        # Normalize currency
        currency = (currency or "PHP").upper()
        
        # For Alipay, convert PHP to CNY (standard for Alipay)
        alipay_currency = "CNY"
        alipay_amount = amount
        
        if currency != alipay_currency:
            alipay_amount = CurrencyConverter.convert(amount, currency, alipay_currency)
            logger.info(
                f"Converting {amount} {currency} to {alipay_amount} {alipay_currency} for Alipay"
            )
        
        reference_id = reference_id or f"alipay-{uuid.uuid4().hex[:12]}"
        
        # Build Magpie QR payload
        payload = {
            "method": "alipay",
            "amount": alipay_amount,
            "currency": alipay_currency,
            "reference_id": reference_id,
            "description": description or "Alipay Payment",
            "merchant_name": getattr(settings, "app_name", "SwiftPay"),
        }
        
        if customer_name:
            payload["customer_name"] = customer_name
        
        # Add metadata
        payload["metadata"] = {
            "original_amount": amount,
            "original_currency": currency,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        result = await self._post("/qr/alipay", payload)
        
        if result.get("success"):
            qr_data = result.get("data", {})
            return {
                "success": True,
                "payment_method": "alipay",
                "qr_code": qr_data.get("qr_code"),
                "qr_url": qr_data.get("qr_url"),
                "qr_content": qr_data.get("qr_content"),
                "reference_id": reference_id,
                "amount": alipay_amount,
                "currency": alipay_currency,
                "original_amount": amount,
                "original_currency": currency,
                "checkout_url": qr_data.get("checkout_url"),
                "expires_at": qr_data.get("expires_at"),
            }
        
        return result
    
    async def create_wechat_qr(
        self,
        amount: float,
        description: str = "",
        currency: str = "PHP",
        reference_id: Optional[str] = None,
        customer_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a WeChat Pay QR code via Magpie.
        
        Args:
            amount: Payment amount in the specified currency
            description: Payment description/purpose
            currency: Currency code (PHP, CNY, USD, EUR) - defaults to PHP
            reference_id: Merchant reference ID
            customer_name: Customer name (optional)
            **kwargs: Additional parameters
        
        Returns:
            Dict with success status and QR code data
        """
        if not self.is_configured:
            return {"success": False, "error": "Magpie API not configured"}
        
        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}
        
        # Normalize currency
        currency = (currency or "PHP").upper()
        
        # For WeChat, convert PHP to CNY (standard for WeChat)
        wechat_currency = "CNY"
        wechat_amount = amount
        
        if currency != wechat_currency:
            wechat_amount = CurrencyConverter.convert(amount, currency, wechat_currency)
            logger.info(
                f"Converting {amount} {currency} to {wechat_amount} {wechat_currency} for WeChat Pay"
            )
        
        reference_id = reference_id or f"wechat-{uuid.uuid4().hex[:12]}"
        
        # Build Magpie QR payload
        payload = {
            "method": "wechat_pay",
            "amount": wechat_amount,
            "currency": wechat_currency,
            "reference_id": reference_id,
            "description": description or "WeChat Payment",
            "merchant_name": getattr(settings, "app_name", "SwiftPay"),
        }
        
        if customer_name:
            payload["customer_name"] = customer_name
        
        # Add metadata
        payload["metadata"] = {
            "original_amount": amount,
            "original_currency": currency,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        result = await self._post("/qr/wechat", payload)
        
        if result.get("success"):
            qr_data = result.get("data", {})
            return {
                "success": True,
                "payment_method": "wechat",
                "qr_code": qr_data.get("qr_code"),
                "qr_url": qr_data.get("qr_url"),
                "qr_content": qr_data.get("qr_content"),
                "reference_id": reference_id,
                "amount": wechat_amount,
                "currency": wechat_currency,
                "original_amount": amount,
                "original_currency": currency,
                "checkout_url": qr_data.get("checkout_url"),
                "expires_at": qr_data.get("expires_at"),
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
        Create a QR code for either Alipay or WeChat based on payment method.
        Automatically selects best currency for the payment method.
        
        Args:
            payment_method: "alipay" or "wechat"
            amount: Payment amount
            description: Payment description
            currency: Currency code (auto-selected if not specified)
            reference_id: Merchant reference ID
            customer_name: Customer name
            **kwargs: Additional parameters
        
        Returns:
            Dict with QR code data and metadata
        """
        payment_method = (payment_method or "").lower().strip()
        
        if payment_method not in ["alipay", "wechat"]:
            return {
                "success": False,
                "error": f"Unsupported payment method: {payment_method}. Use 'alipay' or 'wechat'",
            }
        
        # Auto-select currency if not specified
        if not currency:
            currency = CurrencyConverter.get_best_currency_for_method(payment_method)
        
        if payment_method == "alipay":
            return await self.create_alipay_qr(
                amount=amount,
                description=description,
                currency=currency,
                reference_id=reference_id,
                customer_name=customer_name,
                **kwargs
            )
        else:  # wechat
            return await self.create_wechat_qr(
                amount=amount,
                description=description,
                currency=currency,
                reference_id=reference_id,
                customer_name=customer_name,
                **kwargs
            )
