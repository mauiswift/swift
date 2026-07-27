import logging
import base64
import uuid
from typing import Any, Dict, List, Optional
import httpx
from core.config import settings

logger = logging.getLogger(__name__)

class ZipService:
    """Zip.ph payment API client."""

    def __init__(self):
        self.api_key = (settings.zip_api_key or "").strip()
        self.base_url = (settings.zip_base_url or "https://api.zip.ph").strip().rstrip("/")

    def _headers(self) -> Dict[str, str]:
        # Zip uses Basic Authentication with the API key as the username and an empty password.
        # Format: Authorization: Basic {api_key}:
        auth_str = f"{self.api_key}:"
        auth_bytes = auth_str.encode("ascii")
        base64_auth = base64.b64encode(auth_bytes).decode("ascii")
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64_auth}"
        }

    async def _request(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "ZIP_API_KEY not configured"}

        url = f"{self.base_url}{path}"
        headers = self._headers()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if method.upper() == "POST":
                    resp = await client.post(url, json=payload, headers=headers)
                else:
                    resp = await client.get(url, headers=headers)

                response_text = resp.text
                if resp.status_code >= 400:
                    logger.warning("Zip API error: %s %s", resp.status_code, response_text)
                    return {"success": False, "error": f"Zip API error ({resp.status_code}): {response_text}"}

                data = resp.json() if response_text else {}
                return {"success": True, "data": data}
        except Exception as e:
            logger.exception("Zip API request failed")
            return {"success": False, "error": str(e)}

    async def create_checkout(
        self,
        amount: float,
        description: str,
        external_id: str,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        payment_method_types: Optional[List[str]] = None,
        customer_email: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a hosted checkout session with Zip."""
        if not success_url:
            # Note: Zip might not automatically replace {CHECKOUT_SESSION_ID} unless specified in their docs,
            # but it's a common pattern. Adjust if necessary.
            success_url = f"{settings.backend_url}/api/v1/zip/success?session_id={{CHECKOUT_SESSION_ID}}"
        if not cancel_url:
            cancel_url = f"{settings.backend_url}/api/v1/zip/cancel"

        # Zip expects amount in cents (integer)
        amount_cents = int(round(amount * 100))

        payload = {
            "currency": "PHP",
            "line_items": [
                {
                    "name": description or "Payment",
                    "amount": amount_cents,
                    "quantity": 1
                }
            ],
            "success_url": success_url,
            "cancel_url": cancel_url,
            "payment_method_types": payment_method_types or ["card", "gcash", "paymaya"],
            "description": description,
            "metadata": {
                "external_id": external_id,
                "source": "paybot",
                **(metadata or {})
            }
        }

        if customer_email:
            payload["customer_email"] = customer_email

        result = await self._request("POST", "/v2/sessions", payload)
        if result.get("success"):
            data = result.get("data", {})
            return {
                "success": True,
                "checkout_id": data.get("id"),
                "checkout_url": data.get("payment_url") or data.get("url"),
                "external_id": external_id,
                "raw": data
            }
        return result

    async def get_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieve a checkout session to check status."""
        result = await self._request("GET", f"/v2/sessions/{session_id}")
        if result.get("success"):
            data = result.get("data", {})
            return {
                "success": True,
                "status": data.get("status"),
                "payment_status": data.get("payment_status"),
                "external_id": data.get("metadata", {}).get("external_id"),
                "raw": data
            }
        return result
