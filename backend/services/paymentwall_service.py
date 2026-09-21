"""Paymentwall Widget checkout and pingback helpers."""

import hashlib
import hmac
from typing import Any, Dict, Mapping, Optional
from urllib.parse import quote, urlencode

from core.config import settings


class PaymentwallService:
    """Build signed Paymentwall Widget URLs and validate pingbacks."""

    KRW_BANK_NAME = "Toss Bank"
    KRW_ACCOUNT_NAME = "SwiftPay Ventures Inc."
    KRW_SWIFT_CODE = "TVBKVVTTXXX"

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

    @staticmethod
    def generate_krw_virtual_account(
        user_id: str,
        reference_id: str,
        bank_name: Optional[str] = None,
        account_holder_name: Optional[str] = None,
        account_number: Optional[str] = None,
    ) -> Dict[str, str]:
        """Return stable Korean virtual-account details for one payment session."""
        bank_name = bank_name or PaymentwallService.KRW_BANK_NAME
        account_holder_name = account_holder_name or PaymentwallService.KRW_ACCOUNT_NAME
        seed = f"{user_id}:{reference_id}"
        digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
        digits = "".join(ch for ch in digest if ch.isdigit())[:14]
        if len(digits) < 14:
            digits = (digits + "0" * 14)[:14]
        account_number = account_number or f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        return {
            "bank_name": bank_name,
            "number": account_number,
            "name": account_holder_name,
            "account_name": account_holder_name,
            "swift_code": PaymentwallService.KRW_SWIFT_CODE,
            "account_type": "virtual_account",
        }

    def create_krw_bank_transfer_qr(
        self,
        *,
        user_id: str,
        amount: float,
        reference_id: str,
        description: str = "",
        bank_name: Optional[str] = None,
        account_holder_name: Optional[str] = None,
        account_number: Optional[str] = None,
        qr_payload: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create bank-transfer metadata and a QR payload for KRW sessions."""
        account = self.generate_krw_virtual_account(
            user_id=user_id,
            reference_id=reference_id,
            bank_name=bank_name,
            account_holder_name=account_holder_name,
            account_number=account_number,
        )
        transfer_text = (
            f"Bank: {account['bank_name']}\n"
            "Account Name: SwiftPay Ventures Inc.\n"
            f"Amount: {amount:.2f} KRW\n"
            f"Reference: {reference_id}\n"
            f"Memo: {description or 'SwiftPay payment'}"
        )
        qr_data = qr_payload or transfer_text
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=600x600&data={quote(qr_data, safe='')}"
        return {
            "success": True,
            "bank_account": account,
            "qr_code_url": qr_code_url,
            "transfer_text": transfer_text,
            "qr_payload": qr_data,
        }

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
        signed_data = dict(parameters)
        result = {
            "success": True,
            "payment_url": f"{self.BASE_URL}/subscription?{urlencode(parameters)}",
            "reference_id": reference_id,
            "currency": "KRW",
            "amount": amount,
            "data": signed_data,
        }
        bank_session = self.create_krw_bank_transfer_qr(
            user_id=user_id,
            amount=amount,
            reference_id=reference_id,
            description=description,
        )
        result["bank_account"] = bank_session["bank_account"]
        result["qr_code_url"] = bank_session["qr_code_url"]
        result["transfer_text"] = bank_session["transfer_text"]
        return result

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
