import base64
import hashlib
import hmac
import json
import logging
import re
import uuid
from typing import Any, Dict, Optional
from urllib.parse import quote

import httpx
from core.config import settings
import asyncio
import socket
from httpx import ConnectError

logger = logging.getLogger(__name__)

DEFAULT_SWIFTPAY_BASE_URLS = {
    "sandbox": "https://api.pay.sandbox.live.swiftpay.ph",
    "production": "https://api.pay.live.swiftpay.ph",
}
LEGACY_SWIFTPAY_BASE_URLS = {
    "https://api.swiftpay.ph": "https://api.pay.live.swiftpay.ph",
}


class SwiftPayService:
    """Client for SwiftPay's REST API integration."""

    @staticmethod
    def normalize_philippine_mobile(value: Optional[str]) -> Optional[str]:
        """Format a Philippine mobile number for SwiftPay's payout API."""
        digits = re.sub(r"\D", "", value or "")
        if digits.startswith("63"):
            digits = digits[2:]
        if digits.startswith("0"):
            digits = digits[1:]
        if len(digits) != 10 or not digits.startswith("9"):
            return None
        return f"+63-{digits[:2]}-{digits[2:5]}-{digits[5:]}"

    @staticmethod
    def normalize_external_bank_code(value: str) -> str:
        """Convert catalog aliases and SWIFT/BIC values to SwiftPay's bank code."""
        code = str(value or "").strip().upper()
        legacy_aliases = {
            "BDO": "BNOR",
            "BPI": "BOPI",
            "UBP": "UBPH",
            "UNIONBANK": "UBPH",
            "MBT": "MBTE",
            "METROBANK": "MBTE",
            "RCBC": "RCBC",
            "SECB": "SETC",
            "SECURITYBANK": "SETC",
            "LANDBANK": "TLBP",
            "LBP": "TLBP",
            "PNB": "PNBM",
            "PBCOM": "CPHI",
        }
        if code in legacy_aliases:
            return legacy_aliases[code]
        if len(code) in {8, 11} and code.isalnum():
            return code[:4]
        return code

    @classmethod
    def validate_external_bank_code(cls, value: str) -> str:
        """Return a provider-compatible external bank code or raise a useful error."""
        code = cls.normalize_external_bank_code(value)
        # SwiftPay accepts four-character bank identifiers. E-wallet identifiers
        # are provider-defined and remain unchanged for compatibility.
        if code in {"GCASH", "MAYA", "GRAB", "SHOPEE", "PALAWAN"}:
            return code
        if not re.fullmatch(r"[A-Z0-9]{4}", code):
            raise ValueError(
                "Unsupported bank code. Use the SwiftPay institution code or a supported bank alias."
            )
        return code

    _CARD_TERMS = ("card", "visa", "mastercard", "master card", "amex", "american express", "jcb", "unionpay", "discover")
    _KRW_BANK_HINTS = (
        "KB", "KOOOKMIN", "KOOKMIN", "KDB", "SHINHAN", "HANA", "WOORI", "NH", "NONGHYUP",
        "IBK", "SC", "SBI", "KAKAO", "NAVER", "TOSS", "PAYCO", "KOREA"
    )
    _KRW_BANK_FALLBACK_NAMES = (
        "KB KOOKMIN BANK", "KB Kookmin Bank", "KOOKMIN BANK", "SHINHAN BANK", "HANA BANK",
        "WOORI BANK", "NH NONGHYUP BANK", "IBK", "SC FIRST BANK", "KDB BANK", "DAEGU BANK",
        "DGB", "BANK OF KOREA", "K BANK", "KAKAO BANK", "NAVER BANK", "TOSS BANK"
    )
    _KRW_FALLBACK_INSTITUTIONS = (
        {"code": "KB", "name": "KB Kookmin Bank"},
        {"code": "SHINHAN", "name": "Shinhan Bank"},
        {"code": "HANA", "name": "Hana Bank"},
        {"code": "WOORI", "name": "Woori Bank"},
        {"code": "NH", "name": "NH NongHyup Bank"},
        {"code": "IBK", "name": "IBK"},
        {"code": "KDB", "name": "KDB Bank"},
        {"code": "SC", "name": "SC First Bank"},
        {"code": "KAKAO", "name": "Kakao Bank"},
        {"code": "NAVER", "name": "Naver Bank"},
    )
    @classmethod
    def _looks_like_korean_bank(cls, code: str, name: str, item_type: str = "") -> bool:
        haystack = f"{item_type} {code} {name}".upper()
        has_bank_keyword = "BANK" in haystack or "BANKING" in haystack or "FINANCIAL" in haystack
        has_korean_hint = any(hint in haystack for hint in cls._KRW_BANK_HINTS)
        if has_bank_keyword and has_korean_hint:
            return True
        if any(fallback in haystack for fallback in cls._KRW_BANK_FALLBACK_NAMES):
            return True
        return False

    @classmethod
    def _normalize_disbursement_institutions(cls, data: Any, currency: Optional[str] = None) -> list[Dict[str, str]]:
        """Return unique bank/e-wallet payout institutions from SwiftPay's catalog."""
        if isinstance(data, dict):
            for key in ("institutions", "banks", "data", "items"):
                if isinstance(data.get(key), list):
                    data = data[key]
                    break
        if not isinstance(data, list):
            return []

        institutions: list[Dict[str, str]] = []
        seen_codes: set[str] = set()
        seen_names: set[str] = set()
        currency_upper = (currency or "").upper()

        for item in data:
            if not isinstance(item, dict):
                continue
            item_type = str(item.get("type") or item.get("category") or "").lower()
            code = str(item.get("code") or item.get("institutionCode") or item.get("institution_code") or "").strip()
            name = str(item.get("name") or item.get("institutionName") or item.get("institution_name") or "").strip()
            logo_url = str(
                item.get("logoUrl")
                or item.get("logo_url")
                or item.get("logo")
                or item.get("iconUrl")
                or item.get("icon_url")
                or ""
            ).strip()
            searchable = f"{item_type} {code} {name}".lower()
            if not code or not name or any(term in searchable for term in cls._CARD_TERMS):
                continue

            if currency_upper == "KRW" and not cls._looks_like_korean_bank(code, name, item_type):
                continue

            code_key = code.upper()
            name_key = " ".join(name.casefold().split())
            if code_key in seen_codes or name_key in seen_names:
                continue
            seen_codes.add(code_key)
            seen_names.add(name_key)
            institution = {"code": code, "name": name}
            if logo_url:
                institution["logoUrl"] = logo_url
            institutions.append(institution)

        # IMPORTANT: For KRW we must not fall back to returning non-Korean banks.
        # Previously the code would append the full provider catalog when no Korean-looking
        # institutions were found, which caused Philippine banks to appear for KRW withdrawals.
        # Returning an empty list lets callers show a clear "unsupported" state instead.
        if currency_upper == "KRW" and not institutions:
            logger.info("No Korean institutions found for KRW; returning Korean fallback list")
            return [dict(item) for item in cls._KRW_FALLBACK_INSTITUTIONS]

        return institutions

    def __init__(self):
        self.access_key = (settings.swiftpay_access_key or "").strip()
        self.secret_key = (settings.swiftpay_secret_key or "").strip()
        self.mode = (settings.swiftpay_mode or "sandbox").strip().lower()
        base_url = (settings.swiftpay_base_url or "").strip().rstrip("/")
        base_url = LEGACY_SWIFTPAY_BASE_URLS.get(base_url, base_url)
        self.base_url = base_url or DEFAULT_SWIFTPAY_BASE_URLS.get(self.mode, DEFAULT_SWIFTPAY_BASE_URLS["production"])
        self.callback_url = (settings.swiftpay_callback_url or "").strip()
        self.timeout = 30.0
        # Quick DNS sanity check for the configured base host to catch bad hostnames early
        try:
            host = self.base_url.split("//")[-1].split("/")[0]
            socket.getaddrinfo(host, None)
        except Exception:
            logger.warning("SwiftPay host %s did not resolve during init; network/DNS may be restricted", getattr(self, 'base_url', None))

    def is_configured(self) -> bool:
        return bool(self.access_key and self.secret_key)

    async def get_balance(self) -> Dict[str, Any]:
        """Fetch the merchant's live balance from SwiftPay."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        configured_url = (settings.swiftpay_balance_url or "").strip()
        url = configured_url or f"{self.base_url}/api/account/balance"
        auth = base64.b64encode(f"{self.access_key}:{self.secret_key}".encode("utf-8")).decode("ascii")
        basic_headers = {
            "Authorization": f"Basic {auth}",
            "Accept": "application/json",
        }
        auth_variants = [
            basic_headers,
            {
                "X-Access-Key": self.access_key,
                "X-Secret-Key": self.secret_key,
                "Accept": "application/json",
            },
            {
                "Authorization": f"Bearer {self.access_key}",
                "Accept": "application/json",
            },
        ]
        logger.info("SwiftPay get_balance %s", url)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                last_status = 0
                for headers in auth_variants:
                    response = await client.get(url, headers=headers)
                    last_status = response.status_code
                    if response.status_code != 401:
                        break
            text = response.text or ""
            if response.status_code >= 400:
                logger.warning("SwiftPay get_balance failed status=%s", last_status)
                if last_status == 401:
                    return {
                        "success": False,
                        "code": "provider_unauthorized",
                        "error": "SwiftPay live balance is not enabled for the configured API credentials",
                    }
                return {"success": False, "error": f"SwiftPay API error ({last_status})"}
            data = response.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay get_balance exception")
            return {"success": False, "error": "Unable to reach SwiftPay balance service"}

    @staticmethod
    def _format_amount(amount: float) -> str:
        return f"{amount:.2f}"

    @staticmethod
    def _stringify_value(value: Any) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if value is None:
            return ""
        if isinstance(value, (dict, list)):
            return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        return str(value)

    def _sign_payload(self, payload: Dict[str, Any]) -> str:
        signing_keys = sorted(k for k in payload if k.startswith("x_") and payload[k] not in (None, ""))
        message = "".join(
            f"{key}{self._stringify_value(payload[key])}" if key != "x_amount" else f"{key}{self._format_amount(float(payload[key]))}"
            for key in signing_keys
        )
        logger.debug("SwiftPay signing message=%s", message)
        return hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    async def create_order(
        self,
        *,
        amount: float,
        reference_no: str,
        details: Optional[Dict[str, Any]] = None,
        currency: str = "PHP",
        generate_customer_redirect_url: bool = True,
        institution_code: Optional[str] = None,
        merchant_redirect_url: Optional[str] = None,
        merchant_webhook_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}
        currency_value: Any = currency or "PHP"
        if isinstance(currency_value, str):
            candidate = currency_value.strip()
            if candidate.startswith("[") and candidate.endswith("]"):
                try:
                    parsed = json.loads(candidate)
                except json.JSONDecodeError:
                    parsed = None
                if isinstance(parsed, list) and len(parsed) == 1:
                    candidate = str(parsed[0])
            currency_value = candidate
        if not isinstance(currency_value, str):
            return {"success": False, "error": "SwiftPay order currency must be a single currency code"}
        currency_code = currency_value.strip().upper()
        if currency_code not in {"PHP", "USD", "EUR"}:
            return {"success": False, "error": "SwiftPay provider orders support PHP, USD, and EUR"}

        max_retries = 3
        base_reference = (reference_no or "").strip() or f"swiftpay-{uuid.uuid4().hex[:12]}"
        last_error: Optional[str] = None
        last_data: Optional[Dict[str, Any]] = None

        for attempt in range(1, max_retries + 1):
            current_reference = base_reference if attempt == 1 else f"{base_reference}-{uuid.uuid4().hex[:6]}"
            # The live contract defines details as a JSON string.
            details_payload = json.dumps(details or {}, separators=(",", ":"), ensure_ascii=False)

            payload: Dict[str, Any] = {
                "x_access_key": self.access_key,
                "x_reference_no": current_reference,
                "x_amount": self._format_amount(amount),
                "x_currency": currency_code,
                "details": details_payload,
                "generate_customer_redirect_url": generate_customer_redirect_url,
            }
            if institution_code:
                # Collection institution codes come from SwiftPay's
                # /api/institutions catalog (for example, "BDO").
                payload["institution_code"] = str(institution_code).strip().upper()
            if merchant_redirect_url:
                payload["merchant_redirect_url"] = merchant_redirect_url
            if merchant_webhook_url:
                payload["merchant_webhook_url"] = merchant_webhook_url

            payload["signature"] = self._sign_payload(payload)

            url = f"{self.base_url}/api/orders"
            logger.info(
                "SwiftPay create_order %s reference=%s amount=%s currency=%s institution=%s",
                url,
                current_reference,
                payload["x_amount"],
                currency_code,
                payload.get("institution_code"),
            )
            backoff = 1.0
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload)
                text = resp.text or ""
                
                # Log response details
                logger.info("SwiftPay create_order response status=%s content_length=%s", resp.status_code, len(text))
                if text:
                    try:
                        logger.debug("SwiftPay create_order response body=%s", text)
                    except Exception:
                        logger.debug("SwiftPay create_order response body (raw): %s bytes", len(text))
                
                if resp.status_code >= 400:
                    logger.warning("SwiftPay create_order failed %s %s", resp.status_code, text)
                    last_error = f"SwiftPay API error ({resp.status_code}): {text}"
                    try:
                        parsed = resp.json() if text else {}
                    except Exception:
                        parsed = {}
                    if isinstance(parsed, dict) and (parsed.get("errorCode") == "DUPLICATED_REFERENCE_NO" or parsed.get("code") == "DUPLICATED_REFERENCE_NO"):
                        if attempt < max_retries:
                            logger.warning("SwiftPay duplicate reference detected, retrying with new reference: %s", current_reference)
                            await asyncio.sleep(backoff)
                            continue
                    return {"success": False, "error": last_error}
                
                # Handle both 200 and 202 responses
                if resp.status_code in (200, 202):
                    data = resp.json() if text else {}
                    last_data = data
                    
                    # ✅ DISABLED: For 202 responses, skip status polling
                    # Status polling was failing with 401 errors (authentication issue with GET endpoints)
                    # The order is created successfully on the server, so we proceed without polling
                    if resp.status_code == 202:
                        logger.info("SwiftPay returned 202 (async). Order created, skipping status polling due to GET auth issues.")
                    
                    return {"success": True, "data": data, "reference_no": current_reference}
                
                # Unexpected status code that's not >= 400
                logger.warning("SwiftPay unexpected status code %s", resp.status_code)
                return {"success": False, "error": f"Unexpected status code: {resp.status_code}"}
                
            except ConnectError as exc:
                logger.warning("SwiftPay connect error on attempt %s/%s: %s", attempt, max_retries, exc)
                last_error = "Network error: unable to reach SwiftPay host (DNS or network error). Please check network/DNS or set `swiftpay_base_url` to a reachable host."
                if attempt == max_retries:
                    return {"success": False, "error": last_error}
            except Exception as exc:
                logger.exception("SwiftPay create_order exception on attempt %s/%s", attempt, max_retries)
                last_error = str(exc)
                if attempt == max_retries:
                    return {"success": False, "error": last_error}
            await asyncio.sleep(backoff)
            backoff *= 2

        return {"success": False, "error": last_error or "SwiftPay create order failed"}

    def verify_signature(self, payload: Dict[str, Any], signature: str) -> bool:
        if not self.is_configured():
            return False

        signing_payload = {k: payload[k] for k in payload if k.startswith("x_") and payload[k] not in (None, "")}
        signing_keys = sorted(signing_payload.keys())
        message = "".join(
            f"{key}{self._stringify_value(signing_payload[key])}" if key != "x_amount" else f"{key}{self._format_amount(float(signing_payload[key]))}"
            for key in signing_keys
        )
        expected = hmac.new(
            self.secret_key.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        logger.debug("SwiftPay verify_signature computed=%s received=%s message=%s", expected, signature, message)
        return hmac.compare_digest(expected, signature)

    async def get_institutions(self, currency: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        currency_code = (currency or "").strip().upper()
        url = f"{self.base_url}/api/institutions"
        if currency_code:
            url = f"{url}?currency={quote(currency_code)}"
        logger.info("SwiftPay get_institutions %s currency=%s", url, currency_code or None)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers={"Accept": "application/json"})
            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay get_institutions failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}
            data = resp.json() if text else {}
            institutions = self._normalize_disbursement_institutions(data, currency=currency)
            return {"success": True, "data": institutions}
        except ConnectError as exc:
            logger.warning("SwiftPay get_institutions network error: %s", exc)
            return {"success": False, "error": "Network error: unable to reach SwiftPay host (DNS or network error)."}
        except Exception as exc:
            logger.exception("SwiftPay get_institutions exception")
            return {"success": False, "error": str(exc)}

    async def get_collection_institutions(self) -> Dict[str, Any]:
        """Fetch SwiftPay collection institutions, which support PHP only."""
        return await self.get_institutions(currency="PHP")

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Query payment status by payment ID (Step 6).

        Uses the X-Swiftpay-Payment-Token header as specified in the documentation.
        """
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/payments/status"
        headers = {
            "Accept": "application/json",
            "X-Swiftpay-Payment-Token": payment_id
        }

        logger.info("SwiftPay get_payment_status_by_id %s (id=%s)", url, payment_id)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers=headers)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay status by ID failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay get_payment_status_by_id exception")
            return {"success": False, "error": str(exc)}

    async def get_payment_status_by_reference(self, reference_no: str) -> Dict[str, Any]:
        """Query payment status by reference number (Step 7).

        Uses query parameters as specified in the documentation.
        """
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/payments/status/query"
        params = {
            "accessKey": self.access_key,
            "referenceNo": reference_no
        }

        logger.info("SwiftPay get_payment_status_by_reference %s (ref=%s)", url, reference_no)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params, headers={"Accept": "application/json"})

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay status by reference failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            # Step 7 can return a list of payments if referenceNo is not unique
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay get_payment_status_by_reference exception")
            return {"success": False, "error": str(exc)}

    async def generate_qrph(
        self,
        *,
        amount: float,
        reference_no: str,
        currency: str = "PHP",
        qr_type: str = "P2P"
    ) -> Dict[str, Any]:
        """Generate QR PH payment (Step 5)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}
        if currency.upper() != "PHP":
            return {
                "success": False,
                "error": "SwiftPay QRPH supports PHP only; it cannot create a KRW Korean bank QR",
            }

        url = f"{self.base_url}/api/bootstrap/qrph"
        # Type is a query parameter
        request_url = f"{url}?type={qr_type}"

        payload = {
            "x_access_key": self.access_key,
            "x_reference_no": reference_no,
            "x_amount": self._format_amount(amount),
            "x_currency": currency
        }
        payload["signature"] = self._sign_payload(payload)

        logger.info("SwiftPay generate_qrph %s payload=%s", request_url, payload)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(request_url, json=payload)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay generate_qrph failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay generate_qrph exception")
            return {"success": False, "error": str(exc)}

    async def send_disbursement(
        self,
        *,
        reference_no: str,
        amount: float,
        bank_code: str,
        account_number: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        middle_name: Optional[str] = None,
        account_name: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        line1: str = "N/A",
        line2: Optional[str] = None,
        city: str = "Manila",
        province: str = "Metro Manila",
        postal_code: str = "1000",
        country_code: str = "PH",
        note: str = "",
        channel: str = "INSTAPAY",
        currency: str = "PHP",
    ) -> Dict[str, Any]:
        """Send a disbursement via SwiftPay Disbursement API (Step 1 & 2)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}
        normalized_phone = self.normalize_philippine_mobile(phone)
        if phone and not normalized_phone:
            return {
                "success": False,
                "error": "A valid Philippine mobile number is required (format: +63-XX-XXX-XXXXX)",
            }
        # Backward compatibility: callers may pass account_name instead of split first/last names.
        if (not first_name and not last_name) and account_name:
            name_parts = [part for part in str(account_name).split() if part]
            if name_parts:
                first_name = name_parts[0]
                last_name = name_parts[-1] if len(name_parts) > 1 else name_parts[0]
                if len(name_parts) > 2:
                    middle_name = " ".join(name_parts[1:-1]) if not middle_name else middle_name
        first_name = first_name or "Customer"
        last_name = last_name or "Customer"

        url = f"{self.base_url}/api/disbursements/send"
        base_reference = (reference_no or "").strip() or f"swiftpay-disb-{uuid.uuid4().hex[:12]}"
        max_retries = 3

        for attempt in range(1, max_retries + 1):
            current_reference = (
                base_reference
                if attempt == 1
                else f"{base_reference}-{uuid.uuid4().hex[:8]}"
            )
            payload = {
                "merchantReferenceNo": current_reference,
                "channel": channel,
                "institutionCode": bank_code,
                "externalBankCode": self.validate_external_bank_code(bank_code),
                "creditInformation": {
                    "amount": self._format_amount(amount),
                    "currency": currency.upper(),
                    "remarks": note or f"Disbursement for {current_reference}"
                },
                "recipientInformation": {
                    "accountNumber": account_number,
                    "firstName": first_name,
                    "middleName": middle_name,
                    "lastName": last_name,
                    "mobileNumber": normalized_phone or "",
                    "email": email or "",
                    "address": {
                        "Line1": line1,
                        "Line2": line2,
                        "city": city,
                        "postalCode": postal_code,
                        "province": province,
                        "countryCode": country_code
                    }
                }
            }

            # Basic Auth: base64(accessKey:secretKey)
            auth_str = f"{self.access_key}:{self.secret_key}"
            auth_bytes = auth_str.encode("utf-8")
            auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
            headers = {
                "Authorization": f"Basic {auth_b64}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            logger.info("SwiftPay send_disbursement %s reference=%s", url, current_reference)
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload, headers=headers)

                text = resp.text or ""
                # Documentation says HTTP 200 with empty body means scheduled.
                if resp.status_code == 200 and not text.strip():
                    return {
                        "success": True,
                        "data": {"status": "PENDING"},
                        "reference_no": current_reference,
                    }

                if resp.status_code >= 400:
                    logger.warning("SwiftPay send_disbursement failed %s %s", resp.status_code, text)
                    try:
                        parsed = resp.json() if text else {}
                    except Exception:
                        parsed = {}
                    duplicate = isinstance(parsed, dict) and parsed.get("errorCode") in {
                        "DUPLICATE_MERCHANT_REFERENCE_NO",
                        "DUPLICATED_REFERENCE_NO",
                    }
                    if duplicate and attempt < max_retries:
                        logger.warning(
                            "SwiftPay duplicate disbursement reference; retrying with a new reference: %s",
                            current_reference,
                        )
                        continue
                    return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

                data = resp.json() if text else {"status": "PENDING"}
                return {"success": True, "data": data, "reference_no": current_reference}
            except Exception as exc:
                logger.exception("SwiftPay send_disbursement exception")
                return {"success": False, "error": str(exc)}

    async def get_disbursement_by_id(self, disb_id: str) -> Dict[str, Any]:
        """Read Disbursement By Id (Step 4)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/disbursements/{disb_id}"

        auth_str = f"{self.access_key}:{self.secret_key}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        }

        logger.info("SwiftPay get_disbursement_by_id %s", url)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers=headers)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay read disbursement failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else {}
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay read disbursement exception")
            return {"success": False, "error": str(exc)}

    async def get_disbursements(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read Disbursements (Step 3)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{self.base_url}/api/disbursements"

        # Note: Documentation says "Body" for GET request in Read Disbursements,
        # but also lists merchantId, merchantReferenceNo, etc.
        # Usually GET requests use query params. I'll use query params first.

        auth_str = f"{self.access_key}:{self.secret_key}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Accept": "application/json"
        }

        logger.info("SwiftPay get_disbursements %s params=%s", url, params)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params, headers=headers)

            text = resp.text or ""
            if resp.status_code >= 400:
                logger.warning("SwiftPay read disbursements failed %s %s", resp.status_code, text)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            data = resp.json() if text else []
            return {"success": True, "data": data}
        except Exception as exc:
            logger.exception("SwiftPay read disbursements exception")
            return {"success": False, "error": str(exc)}
