import logging
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, quote, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from services.swiftpay_service import SwiftPayService
from services.magpie_qr_service import MagpieQRService
from services.magpie_service import MagpieService
from services.transactions import TransactionsService
from services.app_settings import get_wallet_currency_limits

logger = logging.getLogger(__name__)

MIN_KRW_PAYMENT_AMOUNT = 50_000


def validate_collection_amount(amount: float, currency: str) -> None:
    """Validate provider collection limits before creating a payment order."""
    normalized_currency = str(currency or "PHP").strip().upper()
    if normalized_currency == "KRW" and amount < MIN_KRW_PAYMENT_AMOUNT:
        raise ValueError(f"Minimum KRW payment amount is {MIN_KRW_PAYMENT_AMOUNT:,}")


def _kakao_card_deep_link(payment_url: str) -> str:
    """Return a SwiftPay hosted card URL safe for KakaoPay handoff."""
    if not payment_url:
        return ""
    parsed = urlparse(payment_url)
    query = parse_qs(parsed.query)
    query["payment_method"] = ["card"]
    query["wallet"] = ["kakaopay"]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


class PaymentGateway:
    """Unified gateway wrapper used by the dashboard and bot.

    Behavior:
    - If SwiftPay is configured, use it to create an order and persist a transaction.
    - Otherwise, create a pending internal transaction for manual verification.
    Returns a canonical dict with keys: success, data (payment_url, checkout_url, gateway, payment_id, reference_no)
    """

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.swift = SwiftPayService()
        # Two magpie clients: QR-specific service and the main Magpie API shim
        self.magpie_qr = MagpieQRService()
        self.magpie = MagpieService()
        self.photonpay = None

    async def create_payment(
        self,
        db: AsyncSession,
        *,
        user_id: str,
        amount: float,
        description: str = "",
        transaction_type: str = "invoice",
        customer_name: str = "",
        customer_email: str = "",
        external_id: Optional[str] = None,
        payment_methods: Optional[list] = None,
        metadata: Optional[Dict[str, Any]] = None,
        currency: Optional[str] = None,
    ) -> Dict[str, Any]:
        requested_methods = [m.lower() for m in (payment_methods or [])]
        manual_verification = bool((metadata or {}).get("manual_verification"))
        selected_currency = currency or (metadata or {}).get("currency")
        currency = str(selected_currency).upper() if selected_currency else "PHP"
        if selected_currency and currency not in {"PHP", "USD", "CNY", "KRW", "USDT"}:
            return {"success": False, "error": "Unsupported collection currency"}
        try:
            validate_collection_amount(amount, currency)
        except ValueError as exc:
            return {"success": False, "error": str(exc)}
        limits = await get_wallet_currency_limits(db, currency)
        if limits["minimum_deposit"] > 0 and amount < limits["minimum_deposit"]:
            return {
                "success": False,
                "error": f"Minimum deposit is {currency} {limits['minimum_deposit']:,.2f}",
            }
        if limits["max_incoming"] > 0 and amount > limits["max_incoming"]:
            return {
                "success": False,
                "error": f"Incoming amount exceeds the {currency} maximum of {limits['max_incoming']:,.2f}",
            }
        currency_is_explicit = bool(selected_currency)
        if currency == "KRW" and transaction_type == "payment_link":
            transaction_type = "invoice"

        is_international_wallet = any(m in {"alipay", "wechat", "wechat_pay"} for m in requested_methods)

        # Prefer QR magpie client for international wallet flows.
        magpie_qr_configured = getattr(self, "magpie_qr", None) and getattr(self.magpie_qr, "is_configured", False)
        if (not currency_is_explicit or currency == "CNY") and is_international_wallet and magpie_qr_configured:
            # Determine specific method
            method = "alipay" if "alipay" in requested_methods else "wechat"
            logger.info("Routing %s payment request to Magpie QR service", method)

            res = await self.magpie_qr.create_dynamic_qr(
                payment_method=method,
                amount=amount,
                description=description,
                reference_id=external_id,
                customer_name=customer_name,
                customer_email=customer_email,
            )

            if not res.get("success"):
                logger.warning("Magpie creation failed: %s", res)
                return {"success": False, "error": res.get("error")}

            data = res.get("data") or {}

            # Robustly pick the payment URL from response or nested data
            payment_url = data.get("payment_url") or data.get("qr_url") or res.get("payment_url") or res.get("qr_url") or data.get("url") or ""
            checkout_url = data.get("checkout_url") or data.get("url") or payment_url
            gateway_id = data.get("id") or data.get("paymentId") or data.get("payment_id") or res.get("reference_id") or external_id or ""

            # Persist transaction record
            txn_svc = TransactionsService(db)
            txn = await txn_svc.create_transaction(
                user_id=user_id,
                transaction_type=f"{method}_qr",
                amount=amount,
                external_id=res.get("reference_id") or external_id,
                gateway_id=gateway_id,
                description=(description or ""),
                customer_name=customer_name,
                customer_email=customer_email,
                payment_url=payment_url,
                status="pending",
            )

            return {
                "success": True,
                "data": {
                    "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                    "transaction_id": getattr(txn, "id", None),
                    "payment_url": payment_url,
                    "checkout_url": checkout_url,
                    "gateway": "magpie",
                    "raw": data,
                },
            }

        # Never fall through to SwiftPay for supported Magpie e-wallets.
        # These methods are supported by Magpie only.
        if (not currency_is_explicit or currency == "CNY") and is_international_wallet:
            return {
                "success": False,
                "error": "Magpie is not configured for this e-wallet payment",
            }

        # 2. Prefer Magpie for invoice/payment_link when configured (Xend compatibility)
        magpie_configured = bool(getattr(self, "magpie", None) and getattr(self.magpie, "api_key", ""))
        if not manual_verification and (not currency_is_explicit or currency == "CNY") and magpie_configured and transaction_type in ("invoice", "payment_link"):
            logger.info("Routing %s request to Magpie (invoice/payment_link)", transaction_type)
            try:
                # Prefer create_checkout for invoice-like requests
                # Forward descriptor and merchant_name when available in metadata
                # Collect extra metadata to forward, excluding descriptor/merchant_name which are handled explicitly
                extra = {}
                if metadata:
                    for k, v in metadata.items():
                        if k in ("descriptor", "merchant_name", "currency"):
                            continue
                        extra[k] = v

                logger.debug("Magpie create_checkout called with amount=%s external_id=%s extra=%s", amount, external_id, extra)
                # Ensure description includes descriptor when provided (tests expect this)
                desc = description
                if metadata and metadata.get("descriptor"):
                    desc = f"{metadata.get('descriptor')} - {description}" if description else metadata.get("descriptor")

                checkout_res = await self.magpie.create_checkout(
                    amount=amount,
                    currency=currency,
                    description=desc,
                    external_id=external_id,
                    payment_method_types=payment_methods or [],
                    descriptor=metadata.get("descriptor") if metadata else None,
                    merchant_name=metadata.get("merchant_name") if metadata else None,
                    metadata={
                        "descriptor": metadata.get("descriptor") if metadata else None,
                        "merchant_name": metadata.get("merchant_name") if metadata else None,
                    },
                    **extra,
                )
            except TypeError as e:
                logger.exception("Magpie.create_checkout signature mismatch or TypeError: %s", e)
                # In case create_checkout expects cents or different args
                kwargs = {
                    "amount": amount,
                    "currency": currency,
                    "description": description,
                    "external_id": external_id,
                    "payment_method_types": payment_methods or [],
                }
                if metadata:
                    if metadata.get("descriptor"):
                        kwargs["descriptor"] = metadata.get("descriptor")
                    if metadata.get("merchant_name"):
                        kwargs["merchant_name"] = metadata.get("merchant_name")
                checkout_res = await self.magpie.create_checkout(**kwargs)

            if checkout_res.get("success"):
                data = checkout_res
                txn_svc = TransactionsService(db)
                txn = await txn_svc.create_transaction(
                    user_id=user_id,
                    transaction_type=transaction_type,
                    amount=amount,
                    external_id=checkout_res.get("external_id") or external_id,
                    gateway_id=checkout_res.get("checkout_id") or checkout_res.get("external_id") or "",
                    description=(description or ""),
                    customer_name=customer_name,
                    customer_email=customer_email,
                    payment_url=checkout_res.get("checkout_url"),
                    status="pending",
                )
                return {
                    "success": True,
                    "data": {
                        "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                        "transaction_id": getattr(txn, "id", None),
                        "payment_url": checkout_res.get("checkout_url"),
                        "checkout_url": checkout_res.get("checkout_url"),
                        "gateway": "magpie",
                        "external_id": checkout_res.get("external_id"),
                        "raw": checkout_res,
                    },
                }
            # If magpie didn't handle it, fall through to other gateways

        # 3. KRW collections must stay on the internal checkout so a super
        # admin can verify the external payment manually instead of using PH SwiftPay.
        if not manual_verification and self.swift.is_configured() and currency != "KRW":
            # Build a reference_no using external_id when present
            import uuid as _uuid
            reference_no = external_id or f"swiftpay-{transaction_type}-{_uuid.uuid4().hex[:12]}"
            if currency == "PHP":
                checkout_url = f"/checkout/{reference_no}"
                txn = await TransactionsService(db).create_transaction(
                    user_id=user_id,
                    transaction_type=transaction_type,
                    amount=amount,
                    currency="PHP",
                    external_id=reference_no,
                    gateway_id=reference_no,
                    description=description or "",
                    customer_name=customer_name,
                    customer_email=customer_email,
                    payment_url=checkout_url,
                    status="pending",
                )
                return {
                    "success": True,
                    "data": {
                        "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                        "transaction_id": getattr(txn, "id", None),
                        "payment_url": checkout_url,
                        "checkout_url": checkout_url,
                        "gateway": "swiftpay_self_hosted",
                    },
                }

            details = {
                "payment_type": transaction_type,
                "description": description,
                "customer_name": customer_name,
                "customer_email": customer_email,
                "payment_methods": payment_methods or [],
                "external_id": external_id or "",
            }
            res = await self.swift.create_order(
                amount=amount,
                reference_no=reference_no,
                details=details,
                currency=currency,
                generate_customer_redirect_url=True,
            )
            if not res.get("success"):
                logger.warning("SwiftPay create_order failed: %s", res)
                return {"success": False, "error": res.get("error")}

            data = res.get("data") or {}

            # Helper: robustly pick first non-empty field from possible key variants
            def _pick(d, *keys):
                for k in keys:
                    if isinstance(d, dict) and k in d and d[k]:
                        return d[k]
                return None

            payment_url = _pick(data, "customerRedirectUrl", "customer_redirect_url", "payment_url", "paymentUrl") or _pick(res, "reference_no", "referenceNo") or ""
            checkout_url = _pick(data, "checkoutUrl", "checkout_url", "customerRedirectUrl", "customer_redirect_url") or f"/checkout/{reference_no}"
            gateway_id = _pick(data, "paymentId", "payment_id", "id") or ""

            # Persist transaction record
            txn_svc = TransactionsService(db)
            receipt_path = None
            if metadata:
                receipt_path = metadata.get("receipt_path") or metadata.get("receipt")

            txn = await txn_svc.create_transaction(
                user_id=user_id,
                transaction_type=transaction_type,
                amount=amount,
                external_id=res.get("reference_no") or reference_no,
                gateway_id=gateway_id,
                description=(description or ""),
                customer_name=customer_name,
                customer_email=customer_email,
                payment_url=payment_url,
                receipt_file_id=receipt_path,
                status="pending",
            )

            return {
                "success": True,
                "data": {
                    "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                    "transaction_id": getattr(txn, "id", None),
                    "payment_url": payment_url,
                    "checkout_url": checkout_url,
                    "gateway": "swiftpay",
                    "raw": data,
                },
            }


        # Provider-less links and invoices use the internal checkout and remain
        # pending until a super admin verifies the external payment.
        import uuid as _uuid
        reference_id = external_id or f"manual-{transaction_type}-{_uuid.uuid4().hex[:12]}"
        checkout_url = f"/checkout/{reference_id}"
        txn = await TransactionsService(db).create_transaction(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            currency=currency,
            external_id=reference_id,
            gateway_id=reference_id,
            description=description or f"{transaction_type} payment",
            customer_name=customer_name,
            customer_email=customer_email,
            payment_url=checkout_url,
            status="pending",
        )
        return {
            "success": True,
            "data": {
                "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                "transaction_id": getattr(txn, "id", None),
                "payment_url": checkout_url,
                "checkout_url": checkout_url,
                "gateway": "manual_external_verification",
                "approval_required": True,
            },
        }


gateway = PaymentGateway()
