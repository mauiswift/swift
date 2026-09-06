"""PhotonPay hosted cashier integration for KRW collection."""

import base64
import hashlib
import json
from typing import Any, Dict, Optional

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from core.config import settings


class PhotonPayService:
    DEFAULT_API_URLS = {
        "production": "https://x-api.photonpay.com",
        "sandbox": "https://x-api.sandbox.photontech.cc",
    }
    DEFAULT_CASHIER_URL = "https://checkout.photonpay.com/pay/aggregation"

    def __init__(self):
        self.app_id = (getattr(settings, "photonpay_app_id", "") or "").strip()
        self.app_secret = (getattr(settings, "photonpay_app_secret", "") or "").strip()
        self.site_id = (getattr(settings, "photonpay_site_id", "") or "").strip()
        self.private_key = (getattr(settings, "photonpay_rsa_private_key", "") or "").replace("\\n", "\n")
        self.public_key = (getattr(settings, "photonpay_rsa_public_key", "") or "").replace("\\n", "\n")
        self.mode = (getattr(settings, "photonpay_mode", "production") or "production").strip().lower()
        self.base_url = (getattr(settings, "photonpay_base_url", "") or "").strip().rstrip("/") or self.DEFAULT_API_URLS.get(self.mode, self.DEFAULT_API_URLS["production"])
        self.cashier_url = (getattr(settings, "photonpay_cashier_url", "") or "").strip().rstrip("/") or self.DEFAULT_CASHIER_URL
        self.is_configured = bool(self.app_id and self.app_secret and self.site_id and self.private_key and self.public_key)

    @staticmethod
    def _basic_auth(app_id: str, app_secret: str) -> str:
        value = base64.b64encode(f"{app_id}/{app_secret}".encode()).decode()
        return f"Basic {value}"

    def sign_body(self, raw_body: bytes) -> str:
        key = serialization.load_pem_private_key(self.private_key.encode(), password=None)
        signature = key.sign(raw_body, padding.PKCS1v15(), hashes.MD5())
        return base64.b64encode(signature).decode()

    def verify_notification(self, raw_body: bytes, signature: str) -> bool:
        if not self.public_key or not signature:
            return False
        try:
            key = serialization.load_pem_public_key(self.public_key.encode())
            key.verify(base64.b64decode(signature), raw_body, padding.PKCS1v15(), hashes.MD5())
            return True
        except Exception:
            return False

    async def _access_token(self, client: httpx.AsyncClient) -> Optional[str]:
        response = await client.post(
            f"{self.base_url}/oauth2/token/accessToken",
            headers={"Authorization": self._basic_auth(self.app_id, self.app_secret), "Content-Type": "application/json"},
        )
        if response.status_code >= 400:
            return None
        data = response.json()
        return ((data.get("data") or {}).get("token") or data.get("token"))

    async def create_krw_session(
        self,
        *,
        amount: float,
        reference_id: str,
        description: str = "KRW payment",
        customer_name: str = "Customer",
        customer_email: str = "",
        notify_url: str = "",
        redirect_url: str = "",
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return {"success": False, "error": "PhotonPay KRW checkout is not configured"}

        payload = {
            "amount": amount,
            "autoRedirect": True,
            "currency": "KRW",
            "goodsInfo": [{"name": description or "KRW payment", "desc": description or "KRW payment", "price": f"{amount:.2f}", "quantity": "1", "virtual": "Y"}],
            "notifyUrl": notify_url,
            "redirectUrl": redirect_url,
            "remark": description or "KRW payment",
            "reqId": reference_id,
            "risk": {"fingerprintId": "swiftpay-server", "platform": "pc", "retryTimes": "1"},
            "shopper": {"id": reference_id, "nickName": customer_name or "Customer", "email": customer_email, "platform": "pc", "shopperIp": "0.0.0.0"},
            "siteId": self.site_id,
        }
        raw_body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                token = await self._access_token(client)
                if not token:
                    return {"success": False, "error": "PhotonPay access token could not be obtained"}
                response = await client.post(
                    f"{self.base_url}/txncore/openApi/v5/cashierSession",
                    content=raw_body,
                    headers={"Content-Type": "application/json", "X-PD-TOKEN": token, "X-PD-SIGN": self.sign_body(raw_body)},
                )
            data = response.json()
        except (httpx.HTTPError, ValueError, TypeError) as exc:
            return {"success": False, "error": f"PhotonPay request failed: {exc}"}
        if response.status_code >= 400 or data.get("code") != "0000":
            return {"success": False, "error": data.get("msg") or "PhotonPay KRW session creation failed", "raw": data}
        payment_url = data.get("payRedirectUrl") or (
            f"{self.cashier_url}?authCode={data['authCode']}" if data.get("authCode") else ""
        )
        return {"success": True, "data": data, "payment_url": payment_url, "payment_id": data.get("payId") or reference_id}

    async def create_alipay_session(self, *args, **kwargs) -> Dict[str, Any]:
        return {"success": False, "error": "PhotonPay Alipay integration is not enabled"}

    async def create_wechat_session(self, *args, **kwargs) -> Dict[str, Any]:
        return {"success": False, "error": "PhotonPay WeChat integration is not enabled"}

    async def some_other_method(self, *args, **kwargs) -> Dict[str, Any]:
        return {"success": False, "error": "Not implemented in stub"}
