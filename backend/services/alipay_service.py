"""
Alipay integration scaffold.

This file provides a minimal, safe scaffold for creating Alipay "precreate" (QR)
orders. It prefers a direct Alipay configuration but will fall back to the
existing Magpie QR service if available and configured.

This is intentionally lightweight: real production use should replace the
placeholder signing and HTTP plumbing with a tested SDK or the official
integration code, and must persist orders in your DB and handle retries.
"""
import logging
import json
import base64
from typing import Optional, Dict, Any, Tuple

import httpx

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
from cryptography.exceptions import InvalidSignature

from core.config import settings

logger = logging.getLogger(__name__)


class AlipayService:
    def __init__(self):
        # Direct Alipay configuration
        self.app_id: str = getattr(settings, "alipay_app_id", "") or ""
        self.private_key: str = getattr(settings, "alipay_private_key", "") or ""
        self.alipay_public_key: str = getattr(settings, "alipay_public_key", "") or ""
        self.gateway: str = getattr(settings, "alipay_gateway", "https://openapi.alipay.com/gateway.do")

        # Optional: use Magpie service as a fallback if present
        try:
            from services.magpie_qr_service import MagpieQRService

            self._magpie = MagpieQRService()
        except Exception:
            self._magpie = None

        # Lazily-loaded key objects
        self._private_key_obj = None
        self._public_key_obj = None

    @property
    def is_configured(self) -> bool:
        return bool(self.app_id and self.private_key and self.alipay_public_key)

    async def create_precreate_qr(
        self,
        out_trade_no: str,
        amount: float,
        subject: str = "Payment",
        currency: str = "CNY",
        expire_seconds: int = 900,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a precreate order and return a QR payload or URL.

        If direct Alipay configuration is missing, fall back to Magpie if available.
        Returns a dict with keys: `success`, and on success: `qr_content` or `qr_url`.
        """
        # Validate
        if amount <= 0:
            return {"success": False, "error": "amount must be > 0"}

        if not self.is_configured:
            if self._magpie and self._magpie.is_configured:
                return await self._magpie.create_checkout_session(
                    payment_method="alipay",
                    amount=amount,
                    currency=(currency or "CNY").upper(),
                    reference_id=out_trade_no,
                    description=subject,
                    success_url=kwargs.get("success_url"),
                    cancel_url=kwargs.get("cancel_url"),
                    metadata=kwargs.get("metadata"),
                )

            # Not configured at all: return a deterministic placeholder for local/dev
            qr_payload = f"https://example.local/alipay/pay?out_trade_no={out_trade_no}&amount={amount}"
            return {"success": True, "qr_content": qr_payload, "qr_url": qr_payload}

        # Direct implementation: build signed form and call Alipay gateway.
        # Uses RSA2 (SHA256) signing via cryptography.
        params = {
            "app_id": self.app_id,
            "method": "alipay.trade.precreate",
            "charset": "utf-8",
            "timestamp": __import__("datetime").datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "version": "1.0",
            "biz_content": json.dumps({
                "out_trade_no": out_trade_no,
                "total_amount": str(amount),
                "subject": subject,
            }, separators=(",", ":"), ensure_ascii=False),
            "sign_type": "RSA2",
        }

        # Sign the params
        try:
            params["sign"] = self._sign_rsa2(params)
        except Exception as exc:
            logger.exception("Alipay signing failed: %s", exc)
            return {"success": False, "error": "signing failed"}

        # Post as form-encoded
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.gateway, data=params, headers={"Content-Type": "application/x-www-form-urlencoded"})

            if resp.status_code >= 400:
                return {"success": False, "error": f"gateway error {resp.status_code}"}

            data = resp.json() if resp.text else {}

            # Alipay returns a top-level response object plus a `sign` field
            response_key = "alipay_trade_precreate_response"
            resp_obj = data.get(response_key, {})
            resp_sign = data.get("sign")

            # Verify response signature if present
            if resp_sign and resp_obj:
                if not self._verify_alipay_response_signature(resp_obj, resp_sign):
                    return {"success": False, "error": "response signature verification failed"}

            # Check response code (10000 typically means success)
            if resp_obj.get("code") not in (None, "10000") and resp_obj.get("code") != "10000":
                return {"success": False, "error": resp_obj.get("sub_msg") or resp_obj.get("msg") or "alipay error", "raw": resp_obj}

            qr = resp_obj.get("qr_code")
            if qr:
                return {"success": True, "qr_content": qr, "qr_url": qr, "raw": resp_obj}

            # fallback
            return {"success": True, "qr_content": f"alipay://pay?order={out_trade_no}", "qr_url": f"alipay://pay?order={out_trade_no}", "raw": resp_obj}

        except Exception as exc:
            logger.exception("Alipay precreate failed: %s", exc)
            return {"success": False, "error": str(exc)}

    async def verify_notify(self, payload: Dict[str, Any]) -> bool:
        """Verify an incoming Alipay notification (webhook).

        This scaffold returns True if Magpie verifies it or if keys are not configured
        (intended for development). Implement proper RSA2 signature verification in prod.
        """
        if not self.is_configured:
            # Accept for local/dev only
            return True

        # Alipay sends form-encoded params including `sign` and `sign_type`.
        sign = payload.get("sign")
        if not sign:
            logger.warning("Alipay notify missing sign")
            return False

        try:
            # Build the unsigned string following Alipay rules: sort keys, skip sign and empty
            unsigned_items = []
            for k in sorted(payload.keys()):
                if k == "sign" or k == "sign_type":
                    continue
                v = payload.get(k)
                if v is None or v == "":
                    continue
                unsigned_items.append(f"{k}={v}")

            unsigned_str = "&".join(unsigned_items)
            return self._verify_rsa2(unsigned_str, sign)
        except Exception as exc:
            logger.exception("Alipay notify verification failed: %s", exc)
            return False

    # ---- Internal crypto helpers ----
    def _load_private_key(self):
        if self._private_key_obj:
            return self._private_key_obj
        if not self.private_key:
            raise ValueError("private key not configured")
        key_bytes = self._ensure_pem(self.private_key).encode("utf-8")
        self._private_key_obj = load_pem_private_key(key_bytes, password=None)
        return self._private_key_obj

    def _load_public_key(self):
        if self._public_key_obj:
            return self._public_key_obj
        if not self.alipay_public_key:
            raise ValueError("alipay public key not configured")
        key_bytes = self._ensure_pem(self.alipay_public_key, public=True).encode("utf-8")
        self._public_key_obj = load_pem_public_key(key_bytes)
        return self._public_key_obj

    def _ensure_pem(self, key_str: str, public: bool = False) -> str:
        # Accept raw PEM or base64 body — wrap with headers if needed
        s = key_str.strip()
        if s.startswith("-----BEGIN"):
            return s
        # assume it's the body without headers
        if public:
            return "-----BEGIN PUBLIC KEY-----\n" + s + "\n-----END PUBLIC KEY-----"
        return "-----BEGIN PRIVATE KEY-----\n" + s + "\n-----END PRIVATE KEY-----"

    def _sign_rsa2(self, params: Dict[str, Any]) -> str:
        # Construct string to sign
        items = []
        for k in sorted(params.keys()):
            v = params[k]
            if v is None or v == "":
                continue
            items.append(f"{k}={v}")
        unsigned = "&".join(items)

        private_key = self._load_private_key()
        signature = private_key.sign(
            unsigned.encode("utf-8"),
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        return base64.b64encode(signature).decode("utf-8")

    def _verify_rsa2(self, unsigned_str: str, sign: str) -> bool:
        public_key = self._load_public_key()
        try:
            public_key.verify(
                base64.b64decode(sign),
                unsigned_str.encode("utf-8"),
                padding.PKCS1v15(),
                hashes.SHA256(),
            )
            return True
        except (InvalidSignature, Exception) as exc:
            logger.warning("Alipay RSA2 verify failed: %s", exc)
            return False

    def _verify_alipay_response_signature(self, resp_obj: Dict[str, Any], sign: str) -> bool:
        # The signed content is the JSON string of the response object without the sign
        try:
            # Produce deterministic JSON: sort keys, no spaces
            signed_content = json.dumps(resp_obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False)
            return self._verify_rsa2(signed_content, sign)
        except Exception as exc:
            logger.exception("Failed to verify alipay response signature: %s", exc)
            return False
