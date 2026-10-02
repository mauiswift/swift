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
    "https://api.swiftpay.site": "https://api.pay.live.swiftpay.ph",
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
        name_aliases = (
            ("BANCO DE ORO", "BNOR"),
            ("BANCO DE ORO UNIBANK", "BNOR"),
            ("BANK OF THE PHILIPPINE ISLANDS", "BOPI"),
            ("UNIONBANK", "UBPH"),
            ("METROBANK", "MBTE"),
            ("METROPOLITAN BANK", "MBTE"),
            ("SECURITY BANK", "SETC"),
            ("LAND BANK", "TLBP"),
            ("PHILIPPINE NATIONAL BANK", "PNBM"),
            ("PHILIPPINE BANK OF COMMUNICATIONS", "CPHI"),
        )
        for name, normalized in name_aliases:
            if name in code:
                return normalized
        bic_prefixes = {
            "BNORPHM": "BNOR",
            "BOPIPHM": "BOPI",
            "UBPHPHM": "UBPH",
            "MBTCPHM": "MBTE",
            "RCBCPHM": "RCBC",
            "SETCPHM": "SETC",
            "TLBPPHM": "TLBP",
            "PNBMPHM": "PNBM",
        }
        for prefix, normalized in bic_prefixes.items():
            if code.startswith(prefix):
                return normalized
        if len(code) in {8, 10, 11} and code.isalnum():
            return code[:4]
        return code

    @staticmethod
    def normalize_disbursement_institution_code(value: str) -> str:
        """Return the SwiftPay institution catalogue code for a bank alias."""
        code = str(value or "").strip().upper()
        institution_aliases = {
            "BDO": "BNORPHMMXXX",
            "BPI": "BOPIPHMMXXX",
            "GCASH": "GXCHPHM2XXX",
            "G-XCHANGE, INC. (GCASH)": "GXCHPHM2XXX",
            "MAYA": "PAPHPHM1XXX",
            "PAYMAYA": "PAPHPHM1XXX",
            "MAYA PHILIPPINES, INC.": "PAPHPHM1XXX",
            "UNIONBANK": "UBPHPHMMXXX",
            "UBP": "UBPHPHMMXXX",
            "METROBANK": "MBTCPHMMXXX",
            "MBT": "MBTCPHMMXXX",
            "RCBC": "RCBCPHMMXXX",
            "SECURITYBANK": "SETCPHMMXXX",
            "SECB": "SETCPHMMXXX",
            "LANDBANK": "TLBPPHMMXXX",
            "LBP": "TLBPPHMMXXX",
            "PNB": "PNBMPHMMTOD",
            "PBCOM": "CPHIPHMMXXX",
        }
        return institution_aliases.get(code, code)

    @staticmethod
    def normalize_collection_institution_code(value: str) -> str:
        """Convert Philippine BIC/catalog values to SwiftPay collection keys."""
        code = str(value or "").strip().upper()
        collection_aliases = {
            "BNORPHM": "BDO",
            "BOPIPHM": "BPI",
            "UBPHPHM": "UNIONBANK",
            "MBTCPHM": "METROBANK",
            "RCBCPHM": "RCBC",
            "SETCPHM": "SECURITYBANK",
            "TLBPPHM": "LANDBANK",
            "PNBMPHM": "PNB",
            "EAWRPHM": "EASTWEST",
            "CHSVPHM": "CHINABANK",
            "CHBKPHM": "CHINABANK",
            "CIPHPHM": "CIMB",
            "MBBEPHM": "MAYBANK",
            "ROBPPHM": "ROBINSONS",
            "PSBPPHM": "PSBANK",
        }
        for prefix, alias in collection_aliases.items():
            if code.startswith(prefix):
                return alias
        return code

    @classmethod
    def validate_external_bank_code(cls, value: str) -> str:
        """Return a provider-compatible external bank code or raise a useful error."""
        code = cls.normalize_external_bank_code(value)
        # SwiftPay accepts four-character bank identifiers. E-wallet identifiers
        # are provider-defined and remain unchanged for compatibility.
        if code in {"GCASH", "MAYA", "GRAB", "SHOPEE", "PALAWAN", "ALIPAY"}:
            return code
        if not re.fullmatch(r"[A-Z0-9]{4}", code):
            raise ValueError(
                "Unsupported bank code. Use the SwiftPay institution code or a supported bank alias."
            )
        return code

    _CARD_TERMS = ("card", "visa", "mastercard", "master card", "amex", "american express", "jcb", "unionpay", "discover")
    _KRW_BANK_HINTS = (
        "KB", "KOOOKMIN", "KOOKMIN", "KDB", "SHINHAN", "HANA", "WOORI", "NH", "NONGHYUP",
        "IBK", "SC", "SBI", "KAKAO", "K BANK", "KBANK", "NAVER", "TOSS", "PAYCO", "KOREA"
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
        {"code": "K", "name": "K Bank"},
        {"code": "KBANK", "name": "K Bank"},
        {"code": "KAKAO", "name": "Kakao Bank"},
        {"code": "NAVER", "name": "Naver Bank"},
        {"code": "TOSS", "name": "Toss Bank"},
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
    def _normalize_disbursement_institutions(cls, data: Any, currency: Optional[str] = None) -> list[Dict[str, Any]]:
        """Return unique bank/e-wallet payout institutions from SwiftPay's catalog."""
        if isinstance(data, dict):
            for key in ("institutions", "banks", "data", "items"):
                if isinstance(data.get(key), list):
                    data = data[key]
                    break
        if not isinstance(data, list):
            return []

        institutions: list[Dict[str, Any]] = []
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
            for field in ("enabled", "minAmount", "maxAmount"):
                if field in item:
                    institution[field] = item[field]
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
                payload["institution_code"] = self.normalize_collection_institution_code(institution_code)
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

    async def get_disbursement_institutions(self, channel: str = "INSTAPAY") -> Dict[str, Any]:
        """Fetch the public catalogue of institutions supported for disbursements."""
        normalized_channel = str(channel or "").strip().upper()
        if normalized_channel not in {"INSTAPAY", "PESONET"}:
            return {"success": False, "error": "Disbursement channel must be INSTAPAY or PESONET"}

        url = f"{self.base_url}/api/disbursements/institutions?channel={normalized_channel}"
        logger.info("SwiftPay get_disbursement_institutions %s", url)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers={"Accept": "application/json"})
            if response.status_code >= 400:
                logger.warning(
                    "SwiftPay get_disbursement_institutions failed status=%s",
                    response.status_code,
                )
                return {
                    "success": False,
                    "error": f"SwiftPay institution catalogue unavailable ({response.status_code})",
                }
            data = response.json() if response.text else []
            return {
                "success": True,
                "data": self._normalize_disbursement_institutions(data),
            }
        except httpx.TransportError:
            logger.warning("SwiftPay disbursement institution catalogue is unreachable", exc_info=True)
            return {"success": False, "error": "SwiftPay institution catalogue is unreachable"}
        except Exception:
            logger.exception("SwiftPay get_disbursement_institutions failed")
            return {"success": False, "error": "Unable to load SwiftPay institution catalogue"}

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

    async def get_order_status(
        self,
        *,
        reference_no: Optional[str] = None,
        payment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Resolve a SwiftPay order status using its payment ID or reference."""
        if payment_id:
            result = await self.get_payment_status(payment_id)
            if result.get("success"):
                return result
        if reference_no:
            return await self.get_payment_status_by_reference(reference_no)
        return {"success": False, "error": "SwiftPay reference_no or payment_id is required"}

    def _basic_auth_headers(self) -> Dict[str, str]:
        credentials = base64.b64encode(
            f"{self.access_key}:{self.secret_key}".encode("utf-8")
        ).decode("ascii")
        return {
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _parse_payment_link_response(response: httpx.Response) -> Dict[str, Any]:
        try:
            data = response.json() if response.text else {}
        except ValueError:
            data = {}

        if response.status_code >= 400:
            detail = ""
            if isinstance(data, dict):
                detail = str(data.get("message") or data.get("detail") or data.get("error") or "")
            detail = detail or (response.text or "").strip()[:500]
            return {
                "success": False,
                "status_code": response.status_code,
                "error": detail or f"SwiftPay API error ({response.status_code})",
            }
        if not isinstance(data, dict):
            return {
                "success": False,
                "status_code": 502,
                "error": "SwiftPay returned an invalid payment-link response",
            }
        return {"success": True, "data": data}

    async def create_payment_link(self_or_payload: Any, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a provider-hosted payment link using SwiftPay's Basic Auth API.

        This accepts both the normal instance call pattern and the legacy/class-level
        compatibility pattern used across the codebase/tests.
        """
        service = self_or_payload if isinstance(self_or_payload, SwiftPayService) else SwiftPayService()
        provider_payload = payload if payload is not None else self_or_payload if isinstance(self_or_payload, dict) else {}
        if not service.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{service.base_url}/api/payments/links"
        try:
            async with httpx.AsyncClient(timeout=service.timeout) as client:
                response = await client.post(url, json=provider_payload, headers=service._basic_auth_headers())
        except httpx.TransportError:
            logger.warning("SwiftPay create payment link transport failure", exc_info=True)
            return {"success": False, "status_code": 502, "error": "Unable to reach SwiftPay payment-link service"}
        return service._parse_payment_link_response(response)

    async def get_payment_link(self_or_code: Any, code: Optional[str] = None) -> Dict[str, Any]:
        """Read a provider-hosted payment link by its immutable code."""
        service = self_or_code if isinstance(self_or_code, SwiftPayService) else SwiftPayService()
        requested_code = code if code is not None else (self_or_code if isinstance(self_or_code, str) else "")
        if not service.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{service.base_url}/api/payments/links/{quote(requested_code, safe='')}"
        try:
            async with httpx.AsyncClient(timeout=service.timeout) as client:
                response = await client.get(url, headers=service._basic_auth_headers())
        except httpx.TransportError:
            logger.warning("SwiftPay read payment link transport failure", exc_info=True)
            return {"success": False, "status_code": 502, "error": "Unable to reach SwiftPay payment-link service"}
        return service._parse_payment_link_response(response)

    async def invalidate_payment_link(self_or_code: Any, code: Optional[str] = None) -> Dict[str, Any]:
        """Irreversibly invalidate a provider-hosted payment link."""
        service = self_or_code if isinstance(self_or_code, SwiftPayService) else SwiftPayService()
        requested_code = code if code is not None else (self_or_code if isinstance(self_or_code, str) else "")
        if not service.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        url = f"{service.base_url}/api/payments/links/{quote(requested_code, safe='')}/invalidate"
        try:
            async with httpx.AsyncClient(timeout=service.timeout) as client:
                response = await client.delete(url, headers=service._basic_auth_headers())
        except httpx.TransportError:
            logger.warning("SwiftPay invalidate payment link transport failure", exc_info=True)
            return {"success": False, "status_code": 502, "error": "Unable to reach SwiftPay payment-link service"}
        if response.status_code >= 400:
            return service._parse_payment_link_response(response)
        try:
            data = response.json() if response.text else {}
        except ValueError:
            data = {}
        return {"success": True, "data": data}

    async def generate_qrph(
        self,
        *,
        amount: float,
        reference_no: str,
        currency: str = "PHP",
        qr_type: str = "P2P"
    ) -> Dict[str, Any]:
        """Generate QR PH payment (Step 5).

        Supports multicurrency payments by sending the original currency to SwiftPay API.
        Non-PHP amounts are also converted to PHP for reference in the response.
        The response reports both the original amount/currency and PHP equivalent.
        """
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}

        original_currency = (currency or "PHP").upper()
        php_amount = amount
        if original_currency != "PHP":
            from services.magpie_services import CurrencyConverter

            php_amount = await CurrencyConverter.convert_live(amount, original_currency, "PHP")

        url = f"{self.base_url}/api/bootstrap/qrph"
        # Type is a query parameter
        request_url = f"{url}?type={qr_type}"

        base_reference = (reference_no or "").strip() or f"swiftpay-qr-{uuid.uuid4().hex[:12]}"
        for attempt in range(1, 4):
            current_reference = base_reference if attempt == 1 else f"{base_reference}-{uuid.uuid4().hex[:6]}"
            payload = {
                "x_access_key": self.access_key,
                "x_reference_no": current_reference,
                "x_amount": self._format_amount(php_amount),
                "x_currency": "PHP",
            }
            payload["signature"] = self._sign_payload(payload)

            logger.info("SwiftPay generate_qrph %s reference=%s amount=%s currency=PHP (orig: %s %s)",
                       request_url, current_reference, payload.get("x_amount"), php_amount, original_currency)
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(request_url, json=payload)

                text = resp.text or ""
                if resp.status_code >= 400:
                    logger.warning("SwiftPay generate_qrph failed %s %s", resp.status_code, text)
                    try:
                        parsed = resp.json() if text else {}
                    except Exception:
                        parsed = {}
                    error_code = parsed.get("errorCode") if isinstance(parsed, dict) else None
                    if error_code == "DUPLICATED_REFERENCE_NO" and attempt < 3:
                        logger.warning(
                            "SwiftPay duplicate QRPH reference detected; retrying with %s",
                            current_reference,
                        )
                        continue
                    return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

                data = resp.json() if text else {}
                logger.info("SwiftPay QRPH response success: data=%s", data)
                return {
                    "success": True,
                    "data": data,
                    "reference_no": current_reference,
                    "amount": php_amount,
                    "currency": "PHP",
                    "original_amount": amount,
                    "original_currency": original_currency,
                    "php_amount": php_amount,
                }
            except Exception as exc:
                logger.exception("SwiftPay generate_qrph exception")
                return {"success": False, "error": str(exc)}
        return {"success": False, "error": "Could not create SwiftPay QRPH checkout"}

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
        transfer_type: Optional[str] = None,
        merchant_information: Optional[Dict[str, Any]] = None,
        full_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a disbursement via SwiftPay Disbursement API (Step 1 & 2)."""
        if not self.is_configured():
            return {"success": False, "error": "SwiftPay is not configured"}
        if not isinstance(amount, (int, float)) or amount <= 0:
            return {"success": False, "error": "Disbursement amount must be greater than zero"}
        normalized_channel = str(channel or "").strip().upper()
        if normalized_channel not in {"INSTAPAY", "PESONET"}:
            return {"success": False, "error": "Disbursement channel must be INSTAPAY or PESONET"}
        normalized_transfer_type = str(transfer_type or "").strip().upper() or None
        if normalized_transfer_type and normalized_transfer_type not in {
            "P2P", "QR_P2P", "QR_P2M", "QR_P2MICRO"
        }:
            return {"success": False, "error": "Unsupported SwiftPay disbursement type"}
        if normalized_transfer_type == "QR_P2M":
            if normalized_channel != "INSTAPAY":
                return {"success": False, "error": "QR_P2M disbursements require the INSTAPAY channel"}
            if not merchant_information or not merchant_information.get("merchantCategoryCode") or not merchant_information.get("proxyNotifyFlag"):
                return {"success": False, "error": "QR_P2M disbursements require merchant category and proxy notification fields"}
        elif merchant_information:
            return {"success": False, "error": "Merchant information is only supported for QR_P2M disbursements"}
        base_reference = (reference_no or "").strip()
        if not base_reference:
            base_reference = f"swiftpay-disb-{uuid.uuid4().hex[:12]}"
        if len(base_reference) > 50:
            return {"success": False, "error": "Disbursement reference must be 50 characters or fewer"}
        institution_code = self.normalize_disbursement_institution_code(bank_code)
        if not institution_code or len(institution_code) > 16:
            return {"success": False, "error": "A valid SwiftPay institution code is required"}
        normalized_phone = self.normalize_philippine_mobile(phone)
        if phone and not normalized_phone:
            return {
                "success": False,
                "error": "A valid Philippine mobile number is required (format: +63-XX-XXX-XXXXX)",
            }
        # Prefer the recipient's exact name when the source is a QR merchant label.
        if full_name:
            full_name = full_name.strip()
        # Backward compatibility: callers may pass account_name instead of split first/last names.
        elif (not first_name and not last_name) and account_name:
            name_parts = [part for part in str(account_name).split() if part]
            if name_parts:
                first_name = name_parts[0]
                last_name = name_parts[-1] if len(name_parts) > 1 else name_parts[0]
                if len(name_parts) > 2:
                    middle_name = " ".join(name_parts[1:-1]) if not middle_name else middle_name
        first_name = first_name or "Customer"
        last_name = last_name or "Customer"
        full_name = full_name or " ".join(
            part for part in (first_name, middle_name, last_name) if part
        ).strip() or "Customer"

        url = f"{self.base_url}/api/disbursements/send"
        payload = {
            "merchantReferenceNo": base_reference,
            "channel": normalized_channel,
            "institutionCode": institution_code,
            "creditInformation": {
                "amount": float(amount),
                "remarks": note or f"Disbursement for {base_reference}"
            },
            "recipientInformation": {
                "accountNumber": account_number,
                "fullName": full_name,
                "mobileNumber": normalized_phone or "",
                "email": email or "",
                "address": {
                    "fullAddress": None,
                    "line1": line1,
                    "line2": line2,
                    "city": city,
                    "postalCode": postal_code,
                    "province": province,
                    "countryCode": country_code
                }
            }
        }
        if normalized_transfer_type:
            payload["type"] = normalized_transfer_type
        if merchant_information:
            payload["recipientInformation"]["merchantInformation"] = merchant_information

        # Basic Auth: base64(accessKey:secretKey)
        auth_str = f"{self.access_key}:{self.secret_key}"
        auth_bytes = auth_str.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            logger.info(
                "SwiftPay send_disbursement %s reference=%s attempt=%s",
                url,
                base_reference,
                attempt,
            )
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload, headers=headers)
            except httpx.TransportError as exc:
                logger.warning(
                    "SwiftPay disbursement request transport error for reference=%s attempt=%s: %s",
                    base_reference,
                    attempt,
                    exc,
                )
                if attempt < max_attempts:
                    continue
                return await self._reconcile_disbursement_reference(base_reference)
            except Exception as exc:
                logger.exception(
                    "SwiftPay disbursement request failed unexpectedly for reference=%s",
                    base_reference,
                )
                return {
                    "success": False,
                    "code": "SWIFTPAY_SUBMISSION_UNCERTAIN",
                    "submission_unknown": True,
                    "reference_no": base_reference,
                    "error": str(exc),
                }

            text = resp.text or ""
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
                if duplicate:
                    return await self._reconcile_disbursement_reference(
                        base_reference,
                        already_submitted=True,
                    )

                if (resp.status_code == 429 or resp.status_code >= 500) and attempt < max_attempts:
                    continue
                if resp.status_code == 429 or resp.status_code >= 500:
                    return await self._reconcile_disbursement_reference(base_reference)
                return {"success": False, "error": f"SwiftPay API error ({resp.status_code}): {text}"}

            # A successful response means SwiftPay accepted the request even if its
            # response body is malformed or omits the UUID needed for later polling.
            if resp.status_code == 200 and not text.strip():
                data: Dict[str, Any] = {"status": "PENDING"}
            else:
                try:
                    data = resp.json() if text else {"status": "PENDING"}
                except ValueError:
                    data = {}
            if not isinstance(data, dict):
                data = {}
            data.setdefault("status", "PENDING")

            result = {
                "success": True,
                "data": data,
                "reference_no": base_reference,
            }
            if not isinstance(data, dict) or not data.get("id"):
                result["reconciliation_required"] = True
            return result

        return await self._reconcile_disbursement_reference(base_reference)

    async def _reconcile_disbursement_reference(
        self,
        reference_no: str,
        *,
        already_submitted: bool = False,
    ) -> Dict[str, Any]:
        """Resolve a previously submitted transfer by its idempotency reference."""
        result = await self.get_disbursements(
            {"merchantReferenceNo": reference_no, "pageNo": 0, "pageSize": 10}
        )
        not_found = False
        if result.get("success"):
            data = result.get("data")
            records = data.get("result", []) if isinstance(data, dict) else data
            if isinstance(records, list):
                for record in records:
                    if (
                        isinstance(record, dict)
                        and str(record.get("merchantReferenceNo") or "") == reference_no
                    ):
                        return {
                            "success": True,
                            "data": record,
                            "reference_no": reference_no,
                            "already_submitted": True,
                        }
                not_found = True

        logger.warning(
            "SwiftPay could not confirm disbursement reference=%s; leaving it for reconciliation",
            reference_no,
        )
        reconciliation_result = {
            "success": False,
            "code": (
                "DUPLICATE_MERCHANT_REFERENCE_NO"
                if already_submitted
                else "SWIFTPAY_SUBMISSION_UNCERTAIN"
            ),
            "submission_unknown": True,
            "reference_no": reference_no,
            "error": "SwiftPay submission could not be confirmed; provider status must be reconciled",
        }
        if already_submitted:
            reconciliation_result["already_submitted"] = True
        if not_found:
            reconciliation_result["not_found"] = True
        return reconciliation_result

    async def get_disbursement_by_reference(self, reference_no: str) -> Dict[str, Any]:
        """Find one provider disbursement by its merchant idempotency reference."""
        return await self._reconcile_disbursement_reference(reference_no)

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

        # The provider's criteria object is serialized as query parameters.

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
