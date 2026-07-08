import logging
import uuid
from typing import Any, Dict, List, Optional

import asyncio
import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class MagpieService:
    """Magpie payment API client.

    This service intentionally avoids Maya/PayMongo dependencies.
    """

    api_key: str = ""
    base_url: str = "https://api.magpie.im"

    def __init__(self):
        self.api_key = (settings.magpie_api_key or "").strip()
        base_url = (settings.magpie_base_url or "").strip().rstrip("/")
        # Default base URL can be overridden via MAGPIE_BASE_URL.
        self.base_url = base_url or "https://api.magpie.im"

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            # Send both header formats for compatibility with different Magpie
            # deployments: some expect `X-API-Key`, others `Authorization: Bearer ...`.
            headers["X-API-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _post(self, path: str, payload: Dict[str, Any], idempotency_key: Optional[str] = None, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}

        url = f"{self.base_url}{path}"
        logger.debug("Magpie request %s payload=%s", url, payload)
        max_attempts = 4
        for attempt in range(1, max_attempts + 1):
            try:
                headers = self._headers()
                if idempotency_key:
                    headers["Idempotency-Key"] = idempotency_key
                if extra_headers:
                    headers.update(extra_headers)
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                response_text = resp.text or ""

                # Retry on server errors (5xx)
                if resp.status_code >= 500 and attempt < max_attempts:
                    logger.warning(
                        "Magpie API server error %s %s attempt=%d/%d - retrying",
                        resp.status_code,
                        url,
                        attempt,
                        max_attempts,
                    )
                    # Exponential backoff with jitter
                    backoff = (2 ** (attempt - 1)) * 0.5
                    jitter = backoff * 0.2
                    await asyncio.sleep(backoff + (jitter * (0.5 - asyncio.get_event_loop().time() % 1)))
                    continue

                if resp.status_code >= 400:
                    logger.warning(
                        "Magpie API error %s %s payload=%s response=%s",
                        resp.status_code,
                        url,
                        payload,
                        response_text,
                    )
                    return {
                        "success": False,
                        "error": f"Magpie API error ({resp.status_code}): {response_text}",
                    }

                data = resp.json() if response_text else {}
                logger.debug("Magpie response %s payload=%s data=%s", url, payload, data)
                return {"success": True, "data": data}
            except Exception as exc:
                logger.error(
                    "Magpie request failed (attempt %d/%d): %s payload=%s",
                    attempt,
                    max_attempts,
                    exc,
                    payload,
                    exc_info=True,
                )
                if attempt < max_attempts:
                    await asyncio.sleep(0.5 * attempt)
                    continue
                return {"success": False, "error": str(exc)}

    @staticmethod
    def _pick(data: Any, *keys: str) -> Optional[Any]:
        if not isinstance(data, dict):
            return None
        for key in keys:
            if key in data and data[key] not in (None, ""):
                return data[key]
        return None

    def _normalize_checkout_response(self, data: Dict[str, Any], fallback_external_id: str) -> Dict[str, Any]:
        checkout_id = self._pick(data, "checkout_id", "id", "payment_id", "invoice_id", "link_id") or ""
        checkout_url = self._pick(data, "checkout_url", "url", "payment_url", "invoice_url", "link_url") or ""
        external_id = self._pick(data, "external_id", "reference", "reference_id") or fallback_external_id

        return {
            "success": True,
            "checkout_id": str(checkout_id),
            "checkout_url": str(checkout_url),
            "external_id": str(external_id),
            "raw": data,
        }

    def _normalize_qr_response(self, data: Dict[str, Any], fallback_external_id: str) -> Dict[str, Any]:
        # Do not fall back to 'checkout_id' here — it can be confused with
        # the checkout response when tests or integrations return mixed fields.
        qr_id = self._pick(data, "qr_id", "id") or ""
        qr_content = self._pick(data, "qr_content", "qr_url", "qr_image_url", "payment_url") or ""
        external_id = self._pick(data, "external_id", "reference", "reference_id") or fallback_external_id

        return {
            "success": True,
            "qr_id": str(qr_id),
            "qr_content": str(qr_content),
            "external_id": str(external_id),
            "raw": data,
        }

    async def create_checkout(
        self,
        *,
        amount: float,
        description: str,
        descriptor: str = "Click Store",
        merchant_name: str = "Click Store",
        customer_name: str = "",
        customer_email: str = "",
        external_id: str,
        payment_methods: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # Magpie expects amount in cents (integer)
        amount_cents = int(round(amount * 100))

        payload: Dict[str, Any] = {
            "amount": amount_cents,
            "description": description,
            "external_id": external_id,
            "currency": "php",
        }
        if descriptor:
            payload["descriptor"] = descriptor
        if merchant_name:
            payload["merchant_name"] = merchant_name
        if customer_name:
            payload["customer_name"] = customer_name
        if customer_email:
            payload["customer_email"] = customer_email
        if payment_methods:
            payload["payment_methods"] = payment_methods
        cleaned_metadata = {k: v for k, v in (metadata or {}).items() if v not in (None, "", [], {})}
        if cleaned_metadata:
            payload["metadata"] = cleaned_metadata

        idempotency_key = external_id or f"magpie-checkout-{uuid.uuid4().hex[:12]}"
        result = await self._post("/v1/payments/checkout", payload, idempotency_key=idempotency_key)
        if not result.get("success"):
            # Some Magpie accounts or environments reject the legacy checkout
            # endpoint with a 500 while the newer checkout-session endpoint works.
            # Newer Sessions API also expects cents.
            session_payload = {
                **payload,
                "amount": amount_cents,
                "currency": payload.get("currency", "php").lower(),
                "external_id": external_id,
                "mode": "payment",
                "success_url": f"{settings.backend_url}/magpie-success",
                "cancel_url": f"{settings.backend_url}/magpie-cancel",
            }
            session_result = await self._post("/v1/checkout/sessions", session_payload, idempotency_key=idempotency_key)
            if not session_result.get("success"):
                return result
            data = session_result.get("data", {})
            return {
                "success": True,
                "checkout_id": str(self._pick(data, "id", "session_id", "checkout_id") or ""),
                "checkout_url": str(self._pick(data, "payment_url", "checkout_url", "url") or ""),
                "external_id": str(self._pick(data, "external_id", "reference", "reference_id") or external_id),
                "raw": data,
            }
        return self._normalize_checkout_response(result.get("data", {}), external_id)

    async def create_invoice(
        self,
        *,
        amount: float,
        description: str = "",
        customer_name: str = "",
        customer_email: str = "",
    ) -> Dict[str, Any]:
        external_id = f"magpie-inv-{uuid.uuid4().hex[:12]}"
        result = await self.create_checkout(
            amount=amount,
            description=description or "Invoice payment",
            external_id=external_id,
            customer_name=customer_name,
            customer_email=customer_email,
        )
        if not result.get("success"):
            return result
        return {
            "success": True,
            "invoice_id": result.get("checkout_id", ""),
            "invoice_url": result.get("checkout_url", ""),
            "external_id": result.get("external_id", external_id),
        }

    async def create_payment_link(self, *, amount: float, description: str = "") -> Dict[str, Any]:
        external_id = f"magpie-link-{uuid.uuid4().hex[:12]}"
        result = await self.create_checkout(
            amount=amount,
            description=description or "Payment link",
            external_id=external_id,
        )
        if not result.get("success"):
            return result
        return {
            "success": True,
            "payment_link_id": result.get("checkout_id", ""),
            "payment_link_url": result.get("checkout_url", ""),
            "external_id": result.get("external_id", external_id),
        }

    async def create_ewallet_charge(
        self,
        *,
        amount: float,
        channel_code: str,
        mobile_number: str = "",
    ) -> Dict[str, Any]:
        external_id = f"magpie-ewallet-{uuid.uuid4().hex[:12]}"
        result = await self._post(
            "/v1/payments/ewallet",
            {
                "amount": int(round(amount * 100)),
                "channel_code": channel_code,
                "mobile_number": mobile_number,
                "external_id": external_id,
            },
            idempotency_key=external_id,
        )
        if not result.get("success"):
            return result
        normalized = self._normalize_checkout_response(result.get("data", {}), external_id)
        return {
            "success": True,
            "checkout_id": normalized.get("checkout_id", ""),
            "checkout_url": normalized.get("checkout_url", ""),
            "external_id": normalized.get("external_id", external_id),
        }

    async def create_refund(self, *, invoice_id: str, amount: float) -> Dict[str, Any]:
        result = await self._post(
            "/v1/payments/refunds",
            {
                "invoice_id": invoice_id,
                "amount": int(round(amount * 100)),
            },
        )
        if not result.get("success"):
            return result
        data = result.get("data", {})
        return {
            "success": True,
            "refund_id": self._pick(data, "refund_id", "id") or "",
            "status": self._pick(data, "status") or "pending",
        }

    async def get_checkout_status(self, checkout_id: str) -> Dict[str, Any]:
        result = await self._post("/v1/payments/status", {"checkout_id": checkout_id})
        if not result.get("success"):
            return result
        data = result.get("data", {})
        return {
            "success": True,
            "status": str(self._pick(data, "status", "payment_status") or "PENDING"),
            "raw": data,
        }

    async def create_terminal_payment(
        self,
        *,
        amount: float,
        description: str,
        terminal_id: str,
        external_id: str,
        customer_name: str = "",
        customer_email: str = "",
        mobile_number: str = "",
    ) -> Dict[str, Any]:
        result = await self._post(
            "/v1/payments/terminal",
            {
                "amount": int(round(amount * 100)),
                "description": description,
                "terminal_id": terminal_id,
                "external_id": external_id,
                "customer_name": customer_name,
                "customer_email": customer_email,
                "mobile_number": mobile_number,
            },
            idempotency_key=external_id,
        )
        if not result.get("success"):
            return result
        return self._normalize_checkout_response(result.get("data", {}), external_id)

    async def create_card_payment(
        self,
        *,
        amount: float,
        description: str,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
        external_id: str,
    ) -> Dict[str, Any]:
        result = await self._post(
            "/v1/payments/card",
            {
                "amount": int(round(amount * 100)),
                "description": description,
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": customer_phone,
                "external_id": external_id,
            },
            idempotency_key=external_id,
        )
        if not result.get("success"):
            return result
        return self._normalize_checkout_response(result.get("data", {}), external_id)

    async def create_payout(
        self,
        *,
        amount: float,
        bank_code: str,
        account_number: str,
        account_name: str,
        description: str,
        external_id: str,
    ) -> Dict[str, Any]:
        result = await self._post(
            "/v1/payouts",
            {
                "amount": int(round(amount * 100)),
                "bank_code": bank_code,
                "account_number": account_number,
                "account_name": account_name,
                "description": description,
                "external_id": external_id,
            },
            idempotency_key=external_id,
        )
        if not result.get("success"):
            return result
        data = result.get("data", {})
        return {
            "success": True,
            "payout_id": self._pick(data, "payout_id", "id") or "",
            "status": self._pick(data, "status") or "processing",
        }

    async def get_balance(self) -> Dict[str, Any]:
        result = await self._post("/v1/account/balance", {})
        if not result.get("success"):
            return result
        data = result.get("data", {})
        available = data.get("available")
        if isinstance(available, list):
            return {"success": True, "available": available}
        php_amount = self._pick(data, "php_balance", "balance")
        return {
            "success": True,
            "available": [{"currency": "PHP", "amount": int(float(php_amount or 0) * 100)}],
        }

    async def create_qr_payment(
        self,
        *,
        amount: float,
        description: str,
        external_id: str,
        payment_methods: Optional[List[str]] = None,
        merchant_name: str = "Click Store",
        descriptor: str = "Click Store",
    ) -> Dict[str, Any]:
        payload = {
            "amount": int(round(amount * 100)),
            "description": description,
            "external_id": external_id,
            "payment_methods": payment_methods or ["qrph"],
        }
        # Only include optional fields if non-empty to avoid Magpie API rejection
        if merchant_name:
            payload["merchant_name"] = merchant_name
        if descriptor:
            payload["descriptor"] = descriptor
        idempotency_key = external_id or f"magpie-qr-{uuid.uuid4().hex[:12]}"
        result = await self._post("/v1/payments/qr", payload, idempotency_key=idempotency_key)
        if not result.get("success"):
            return result
        return self._normalize_qr_response(result.get("data", {}), external_id)

    async def create_session(
        self,
        *,
        amount: Optional[float] = None,
        currency: str = "php",
        external_id: Optional[str] = None,
        description: str = "",
        payment_methods: Optional[List[str]] = None,
        line_items: Optional[List[Dict[str, Any]]] = None,
        success_url: str = "",
        cancel_url: str = "",
        customer_email: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        mode: str = "payment",
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a hosted checkout session (Magpie Checkout Sessions API).

        Handles amount calculation from line_items and falls back to legacy checkout
        if the sessions API fails.
        """
        if payload is not None:
            payload = dict(payload)
            amount = payload.get("amount", amount)
            currency = payload.get("currency", currency) or "php"
            external_id = payload.get("external_id", external_id)
            description = payload.get("description", description)
            payment_methods = payload.get("payment_methods", payment_methods) or payload.get("payment_method_types", None)
            line_items = payload.get("line_items", line_items)
            success_url = payload.get("success_url", success_url)
            cancel_url = payload.get("cancel_url", cancel_url)
            customer_email = payload.get("customer_email", customer_email)
            metadata = payload.get("metadata", metadata)
            mode = payload.get("mode", mode)

        # 1. Resolve amount from line_items if not provided
        if amount is None and line_items:
            try:
                total_cents = 0
                for item in line_items:
                    qty = int(float(item.get("quantity") or 1))
                    item_amount = int(float(item.get("amount") or 0))
                    total_cents += item_amount * qty
                amount = float(total_cents) / 100.0
            except Exception as e:
                logger.warning("Failed to calculate session amount from line_items: %s", e)
                return {"success": False, "error": "Invalid line_items format"}

        if amount is None or amount <= 0:
            return {"success": False, "error": "Amount must be provided and > 0"}

        # 2. Prepare payload
        final_external_id = external_id or f"magpie-session-{uuid.uuid4().hex[:12]}"
        session_payload: Dict[str, Any] = {
            "amount": int(round(amount * 100)),
            "currency": str(currency or "php").lower(),
            "external_id": final_external_id,
            "mode": mode,
            "description": description,
        }

        if payment_methods:
            # Magpie sometimes expects both keys for compatibility
            session_payload["payment_methods"] = payment_methods
            session_payload["payment_method_types"] = payment_methods
        if line_items:
            session_payload["line_items"] = line_items
        if not success_url:
            success_url = f"{settings.backend_url}/magpie-success"
        if not cancel_url:
            cancel_url = f"{settings.backend_url}/magpie-cancel"

        session_payload["success_url"] = success_url
        session_payload["cancel_url"] = cancel_url

        if customer_email:
            session_payload["customer_email"] = customer_email
        if metadata:
            session_payload["metadata"] = metadata

        # 3. Attempt to create session
        result = await self._post("/v1/checkout/sessions", session_payload, idempotency_key=final_external_id)

        if result.get("success"):
            data = result.get("data", {})
            if isinstance(data, dict):
                session_id = self._pick(data, "id", "session_id", "checkout_id") or ""
                payment_url = self._pick(data, "payment_url", "checkout_url", "url") or ""
                return {
                    "success": True,
                    "session_id": str(session_id),
                    "payment_url": str(payment_url),
                    "external_id": str(self._pick(data, "external_id") or final_external_id),
                    "raw": data,
                }

        # 4. Fallback to legacy checkout
        logger.warning("Magpie sessions API failed, falling back to legacy checkout: %s", result.get("error"))
        fallback = await self.create_checkout(
            amount=amount,
            description=description or "Checkout session",
            external_id=final_external_id,
            customer_email=customer_email,
            payment_methods=payment_methods,
            metadata={
                **(metadata or {}),
                "source": "magpie_legacy_session_fallback",
            },
        )

        if not fallback.get("success"):
            return fallback

        return {
            "success": True,
            "session_id": fallback.get("checkout_id", ""),
            "payment_url": fallback.get("checkout_url", ""),
            "external_id": fallback.get("external_id", final_external_id),
            "raw": fallback.get("raw", {}),
        }

    async def create_unified_checkout(
        self,
        *,
        amount: float,
        description: str,
        transaction_type: str,
        external_prefix: str,
        use_qr: bool,
        merchant_name: str = "Click Store",
        descriptor: str = "Click Store",
        customer_name: str = "",
        customer_email: str = "",
        payment_methods: Optional[List[str]] = None,
        external_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Unified method for creating various payment types (invoice, link, QR)."""
        if amount <= 0:
             return {"success": False, "error": "Amount must be greater than zero"}

        final_external_id = external_id or f"{external_prefix}-{uuid.uuid4().hex[:12]}"

        # Format description
        checkout_desc = description.strip() or "magpie payment"
        if descriptor and descriptor not in checkout_desc:
            checkout_desc = f"{descriptor.upper()[:22]} | {checkout_desc}"
        elif merchant_name and merchant_name not in checkout_desc:
            checkout_desc = f"{merchant_name} | {checkout_desc}"

        final_metadata = {"source": "magpie", **(metadata or {})}
        if merchant_name: final_metadata["merchant_name"] = merchant_name
        if descriptor: final_metadata["descriptor"] = descriptor
        if payment_methods: final_metadata["payment_methods"] = payment_methods

        if use_qr:
            result = await self.create_qr_payment(
                amount=amount,
                description=checkout_desc,
                external_id=final_external_id,
                payment_methods=payment_methods,
                merchant_name=merchant_name,
                descriptor=descriptor,
            )
        else:
            result = await self.create_checkout(
                amount=amount,
                description=checkout_desc,
                descriptor=descriptor,
                merchant_name=merchant_name,
                customer_name=customer_name,
                customer_email=customer_email,
                external_id=final_external_id,
                payment_methods=payment_methods,
                metadata=final_metadata,
            )

        if not result.get("success"):
            return result

        # Return normalized data for internal use
        return {
            "success": True,
            "transaction_type": transaction_type,
            "amount": amount,
            "external_id": result.get("external_id", final_external_id),
            "gateway_id": str(result.get("checkout_id", "") or result.get("qr_id", "")),
            "payment_url": str(result.get("checkout_url", "") or result.get("qr_content", "")),
            "payment_methods": payment_methods,
            "merchant_name": merchant_name,
            "descriptor": descriptor,
            "applied_description": checkout_desc,
            "raw": result,
        }


async def run_card_settlement_sweep() -> None:
    # TODO: remove once Magpie migration is confirmed stable (added 2026-07)
    logger.info("Magpie settlement sweep hook executed")
