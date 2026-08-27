"""Paymentwall Widget checkout and pingback helpers."""

import hashlib
import hmac
from typing import Any, Dict, Mapping, Optional
from urllib.parse import urlencode

from core.config import settings


class PaymentwallService:
    """Build signed Paymentwall Widget URLs and validate pingbacks."""

    BASE_URL = "https://api.paymentwall.com/api"

    def __init__(self) -> None:
        self.app_key = (getattr(settings, "paymentwall_app_key", "") or "").strip()
        self.secret_key = (getattr(settings, "paymentwall_secret_key", "") or "").strip()
        self.widget_code = (getattr(settings, "paymentwall_widget_code", "") or "").strip()
        self.sign_version = int(getattr(settings, "paymentwall_sign_version", 3) or 3)
        self.is_configured = bool(self.app_key and self.secret_key and self.widget_code)

    @staticmethod
    def calculate_signature(parameters: Mapping[str, Any], secret_key: str, sign_version: int = 3) -> str:
        """Match Paymentwall's Widget signature algorithm."""
        if sign_version == 1:
            raw = f"{parameters.get('uid', '')}{secret_key}"
            return hashlib.md5(raw.encode("utf-8")).hexdigest()

        raw = "".join(
            f"{key}={value}"
            for key, value in sorted(parameters.items())
            if key != "sign"
        ) + secret_key
        algorithm = hashlib.md5 if sign_version == 2 else hashlib.sha256
        return algorithm(raw.encode("utf-8")).hexdigest()

    def create_widget_url(
        self,
        *,
        user_id: str,
        amount: float,
        currency: str = "KRW",
        reference_id: str,
        description: str = "",
        metadata: Optional[Mapping[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return {"success": False, "error": "Paymentwall is not configured"}
        if amount <= 0:
            return {"success": False, "error": "Amount must be greater than zero"}
        if currency.upper() != "KRW":
            return {"success": False, "error": "Paymentwall collection is restricted to KRW"}

        parameters: Dict[str, Any] = {
            "key": self.app_key,
            "uid": str(user_id),
            "widget": self.widget_code,
            "amount": f"{amount:.2f}",
            "currencyCode": "KRW",
            "ag_name": description or "SwiftPay payment",
            "ag_external_id": reference_id,
            "ag_type": "fixed",
            "ref": reference_id,
            "sign_version": str(self.sign_version),
        }
        if metadata:
            parameters.update({key: value for key, value in metadata.items() if value is not None})
        parameters["sign"] = self.calculate_signature(parameters, self.secret_key, self.sign_version)
        return {
            "success": True,
            "payment_url": f"{self.BASE_URL}/subscription?{urlencode(parameters)}",
            "reference_id": reference_id,
            "currency": "KRW",
            "amount": amount,
            "data": parameters,
        }

    def validate_pingback(self, parameters: Mapping[str, Any]) -> bool:
        signature = str(parameters.get("sig", ""))
        if not signature or not all(parameters.get(key) is not None for key in ("uid", "goodsid", "type", "ref")):
            return False

        sign_version = int(parameters.get("sign_version", 2) or 2)
        if sign_version == 1:
            signed_parameters = {key: parameters.get(key) for key in ("uid", "goodsid", "type", "ref")}
        else:
            signed_parameters = {key: value for key, value in parameters.items() if key not in ("sig", "sign_version")}
            signed_parameters["sign_version"] = str(sign_version)

        expected = self.calculate_signature(signed_parameters, self.secret_key, sign_version)
        return bool(self.secret_key) and hmac.compare_digest(signature, expected)
