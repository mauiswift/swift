"""KOMOJU direct payment integration."""

import base64
import logging
from typing import Any, Optional

import httpx

from core.config import settings
from services.magpie_services import CurrencyConverter

logger = logging.getLogger(__name__)
KOREAN_PAYMENT_TYPES = frozenset({"kakaopay", "naverpay", "payco", "tosspay"})


class KomojuService:
    """Create hosted KOMOJU payments using the direct API."""

    def __init__(self) -> None:
        self.secret_key = settings.komoju_secret_key.strip()
        self.base_url = settings.komoju_base_url.rstrip("/")

    @property
    def is_configured(self) -> bool:
        return bool(self.secret_key)

    async def create_payment(
        self,
        *,
        amount: float,
        currency: str,
        return_url: str,
        external_id: Optional[str] = None,
        description: str = "",
        payment_types: Optional[list[str]] = None,
        source_currency: Optional[str] = None,
        source_amount: Optional[float] = None,
    ) -> dict[str, Any]:
        if not self.is_configured:
            return {"success": False, "error": "KOMOJU is not configured"}

        normalized_currency = currency.strip().upper()
        normalized_source_currency = (source_currency or normalized_currency).strip().upper()
        if normalized_source_currency == "KRW":
            expected_amount = CurrencyConverter.convert(
                float(source_amount if source_amount is not None else amount),
                "KRW",
                "PHP",
            )
            if normalized_currency != "PHP" or abs(float(amount) - expected_amount) > 0.01:
                return {
                    "success": False,
                    "error": "Unsafe KRW checkout: provider amount does not match the server conversion.",
                }
            if expected_amount < 1:
                return {
                    "success": False,
                    "error": "This KRW amount converts to less than the provider minimum of PHP 1.00.",
                }

        payload: dict[str, Any] = {
            "amount": int(round(amount)),
            "currency": normalized_currency,
            "return_url": return_url,
        }
        if external_id:
            payload["external_charge_id"] = external_id
        if description:
            payload["description"] = description
        # KRW KOMOJU payments must remain limited to Korean wallets.
        selected_payment_types = [
            payment_type for payment_type in (payment_types or [])
            if payment_type.strip().lower() in KOREAN_PAYMENT_TYPES
        ]
        payment_types_value = selected_payment_types or sorted(KOREAN_PAYMENT_TYPES)
        # KOMOJU expects array form fields using the bracketed key notation.
        payload_items = [(key, value) for key, value in payload.items()]
        payload_items.extend(("payment_types[]", value) for value in payment_types_value)
        credentials = f"{self.secret_key}:".encode("utf-8")
        authorization = base64.b64encode(credentials).decode("ascii")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/payments",
                    headers={"Authorization": f"Basic {authorization}"},
                    data=payload_items,
                )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            try:
                detail = exc.response.json()
            except ValueError:
                detail = exc.response.text.strip()
            logger.warning("KOMOJU payment creation failed (%s): %s", exc.response.status_code, detail)
            return {"success": False, "error": f"KOMOJU returned HTTP {exc.response.status_code}", "details": detail}
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("KOMOJU payment creation failed: %s", exc)
            return {"success": False, "error": str(exc)}

        payment_url = data.get("payment_url") or data.get("session_url") or data.get("url")
        if not payment_url:
            return {"success": False, "error": "KOMOJU did not return a payment URL", "raw": data}

        return {
            "success": True,
            "payment_id": data.get("id"),
            "payment_url": payment_url,
            "currency": data.get("currency") or currency.upper(),
            "raw": data,
        }