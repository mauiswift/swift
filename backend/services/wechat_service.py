"""
WeChat Pay integration scaffold.

Provides a minimal `unifiedorder`-style scaffold that returns a `code_url`
for NATIVE (QR) payments. Falls back to the Magpie QR service if direct config
is not available. This is a scaffold — production must implement secure
signing, certificate handling, and DB persistence.
"""
import logging
import xmltodict
from typing import Dict, Any
import hashlib
import hmac
import secrets
import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def _nonce_str(length: int = 32) -> str:
    return secrets.token_hex(length // 2)


def _sign_params(params: Dict[str, Any], key: str, sign_type: str = "MD5") -> str:
    """Create WeChat sign for params using `key`.

    Follows WeChat spec: sort keys lexicographically, join k=v (skip empty), append
    `&key=API_KEY`, then compute MD5 or HMAC-SHA256. Return upper-case hex string.
    """
    # Filter out empty and sign
    items = [(k, v) for k, v in params.items() if v is not None and v != "" and k != "sign"]
    items.sort(key=lambda x: x[0])
    buf = "&".join(f"{k}={v}" for k, v in items)
    buf = f"{buf}&key={key}"

    if sign_type.upper() == "HMAC-SHA256":
        mac = hmac.new(key.encode("utf-8"), buf.encode("utf-8"), hashlib.sha256)
        return mac.hexdigest().upper()

    # default MD5
    m = hashlib.md5()
    m.update(buf.encode("utf-8"))
    return m.hexdigest().upper()


def _dict_to_xml(params: Dict[str, Any]) -> str:
    # xmltodict.unparse will create an XML document; ensure no full document wrapper
    # Convert all values to str
    clean = {k: str(v) for k, v in params.items()}
    return xmltodict.unparse({"xml": clean}, full_document=False)


def _xml_to_dict(xml: str) -> Dict[str, Any]:
    return xmltodict.parse(xml).get("xml", {}) if xml else {}


class WechatService:
    def __init__(self):
        self.appid = getattr(settings, "wechat_appid", "") or ""
        self.mch_id = getattr(settings, "wechat_mch_id", "") or ""
        self.api_key = getattr(settings, "wechat_api_key", "") or ""
        self.unifiedorder_url = "https://api.mch.weixin.qq.com/pay/unifiedorder"

        try:
            from services.magpie_qr_service import MagpieQRService

            self._magpie = MagpieQRService()
        except Exception:
            self._magpie = None

    @property
    def is_configured(self) -> bool:
        return bool(self.appid and self.mch_id and self.api_key)

    async def create_native_qr(
        self,
        out_trade_no: str,
        amount_cny: int,
        body: str = "Payment",
        notify_url: str | None = None,
        sign_type: str = "MD5",
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a NATIVE (QR) unifiedorder and return `code_url`.

        `amount_cny` must be an integer number of fen (CNY * 100).
        """
        if amount_cny <= 0:
            return {"success": False, "error": "amount must be > 0"}

        if not self.is_configured:
            if self._magpie and self._magpie.is_configured:
                # Use Magpie checkout sessions for WeChat Pay
                return await self._magpie.create_checkout_session(
                    payment_method="wechat_pay",
                    amount=amount_cny / 100.0,
                    currency="CNY",
                    reference_id=out_trade_no,
                    description=body,
                    success_url=kwargs.get("success_url"),
                    cancel_url=kwargs.get("cancel_url"),
                    metadata=kwargs.get("metadata"),
                )

            # Fallback placeholder for local/dev
            url = f"https://example.local/wechat/pay?out_trade_no={out_trade_no}&amount={amount_cny}"
            return {"success": True, "code_url": url, "qr_content": url}

        # Build params
        params: Dict[str, Any] = {
            "appid": self.appid,
            "mch_id": self.mch_id,
            "nonce_str": _nonce_str(32),
            "body": body,
            "out_trade_no": out_trade_no,
            "total_fee": str(amount_cny),
            "spbill_create_ip": "127.0.0.1",
            "notify_url": notify_url or (getattr(settings, "backend_url", "") + "/api/v1/payments/notify/wechat"),
            "trade_type": "NATIVE",
        }

        # Attach sign
        params["sign_type"] = sign_type
        params["sign"] = _sign_params(params, self.api_key, sign_type=sign_type)

        xml = _dict_to_xml(params)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.unifiedorder_url, content=xml, headers={"Content-Type": "text/xml"})

            if resp.status_code >= 400:
                return {"success": False, "error": f"gateway error {resp.status_code}"}

            parsed = _xml_to_dict(resp.text)

            # Basic response checks
            if parsed.get("return_code") != "SUCCESS":
                return {"success": False, "error": parsed.get("return_msg") or "return_code not SUCCESS", "raw": parsed}

            # Verify sign in response
            resp_sign = parsed.get("sign")
            if resp_sign:
                expected = _sign_params(parsed, self.api_key, sign_type=parsed.get("sign_type", "MD5"))
                if resp_sign != expected:
                    logger.warning("WeChat response sign mismatch: expected=%s got=%s", expected, resp_sign)
                    return {"success": False, "error": "response signature mismatch"}

            # Check result code
            if parsed.get("result_code") != "SUCCESS":
                return {"success": False, "error": parsed.get("err_code_des") or "result_code not SUCCESS", "raw": parsed}

            code_url = parsed.get("code_url")
            if code_url:
                return {"success": True, "code_url": code_url, "qr_content": code_url}

            return {"success": False, "error": "no code_url in response", "raw": parsed}

        except Exception as exc:
            logger.exception("WeChat unifiedorder failed: %s", exc)
            return {"success": False, "error": str(exc)}

    async def verify_notify(self, xml_payload: str) -> bool:
        """Verify incoming WeChat notify XML by checking the sign.

        Returns True if verification passes. In production also check order
        values, amount, and idempotency; this method only verifies signature.
        """
        if not self.is_configured:
            return True

        try:
            parsed = _xml_to_dict(xml_payload)
            received_sign = parsed.get("sign")
            if not received_sign:
                logger.warning("WeChat notify missing sign")
                return False

            expected = _sign_params(parsed, self.api_key, sign_type=parsed.get("sign_type", "MD5"))
            if expected != received_sign:
                logger.warning("WeChat notify signature mismatch: expected=%s got=%s", expected, received_sign)
                return False

            return True
        except Exception as exc:
            logger.exception("Error verifying WeChat notify: %s", exc)
            return False
