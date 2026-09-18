import logging
import uuid
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, quote, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from models.admin_users import AdminUser
from services.swiftpay_service import SwiftPayService
from services.magpie_qr_service import MagpieQRService
from services.magpie_service import CurrencyConverter, MagpieService
from services.transactions import TransactionsService
from services.app_settings import get_enabled_collection_currencies, get_wallet_currency_limits
from services.user_benefits import get_krw_benefits

logger = logging.getLogger(__name__)
KRW_LOCAL_CHANNELS = frozenset({"bank_transfer"})

def _kakao_card_deep_link(payment_url: str) -> str:
    """Return a SwiftPay hosted card URL safe for KakaoPay handoff."""
    if not payment_url:
        return ""
    parsed = urlparse(payment_url)
    query = parse_qs(parsed.query)
    query["payment_method"] = ["card"]
    query["wallet"] = ["kakaopay"]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


async def _is_test_mode_enabled(db: Optional[AsyncSession], user_id: str) -> bool:
    """Return the persisted test toggle for the payment owner.

    Provider test mode is fail-closed: a missing user, database session, or
    toggle never enables a test provider.
    """
    if db is None:
        return False
    result = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == str(user_id))
    )
    admin = result.scalar_one_or_none()
    return bool(admin and admin.test_mode)


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
        original_transaction_type = transaction_type
        currency = str(selected_currency).upper() if selected_currency else "PHP"
        if selected_currency and currency not in {"PHP", "CNY", "KRW", "USDT"}:
            return {"success": False, "error": "Unsupported collection currency"}
        if selected_currency and db is not None and currency not in await get_enabled_collection_currencies(db):
            return {"success": False, "error": "That collection currency is currently disabled by the main administrator"}
        if currency == "KRW" and db is not None:
            benefits = await get_krw_benefits(db, str(user_id))
            if not benefits["unlocked"]:
                return {
                    "success": False,
                    "error": "KRW payment features unlock after an approved USDT deposit of at least 600 USDT",
                }
            merchant = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
            configured_channels = (
                merchant.payment_channels.get("KRW", [])
                if merchant and isinstance(merchant.payment_channels, dict)
                else []
            )
            if configured_channels:
                unavailable = [method for method in requested_methods if method not in configured_channels]
                if unavailable:
                    return {
                        "success": False,
                        "error": f"KRW payment channel is not activated for this user: {unavailable[0]}",
                    }
                if not requested_methods:
                    requested_methods = [method for method in configured_channels if method in KRW_LOCAL_CHANNELS]
            unsupported_local = [method for method in requested_methods if method not in KRW_LOCAL_CHANNELS]
            if unsupported_local:
                return {
                    "success": False,
                    "error": f"KRW channel '{unsupported_local[0]}' is unavailable until a Korean acquiring provider is configured",
                }
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
        if currency == "KRW" and original_transaction_type == "payment_link":
            transaction_type = "invoice"

        if currency == "KRW" and original_transaction_type == "payment_link" and not manual_verification and not bool((metadata or {}).get("manual_krw_checkout")):
            logger.info("Routing KRW payment link to manual verification instead of provider checkout")
            return {
                "success": True,
                "data": {
                    "payment_id": external_id or f"manual-{original_transaction_type}-{uuid.uuid4().hex[:12]}",
                    "transaction_id": None,
                    "payment_url": f"/checkout/{external_id or f'manual-{original_transaction_type}-{uuid.uuid4().hex[:12]}'}",
                    "checkout_url": f"/checkout/{external_id or f'manual-{original_transaction_type}-{uuid.uuid4().hex[:12]}'}",
                    "gateway": "manual_external_verification",
                    "approval_required": True,
                },
            }


        is_international_wallet = any(m in {"alipay", "wechat", "wechat_pay"} for m in requested_methods)

        # Prefer QR magpie client for international wallet flows.
        magpie_qr_configured = getattr(self, "magpie_qr", None) and getattr(self.magpie_qr, "is_configured", False)
        if currency != "CNY" and not currency_is_explicit and is_international_wallet and magpie_qr_configured:
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
                currency=currency,
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
        # Explicit CNY wallet payments are handled by the Checkout Sessions
        # path below. Do not reject them here before Magpie can create the
        # session; the QR service is only used for non-explicit legacy flows.
        if is_international_wallet and currency != "CNY":
            return {
                "success": False,
                "error": "Magpie is not configured for this e-wallet payment",
            }

        magpie_card_requested = bool((metadata or {}).get("magpie_card"))
        force_manual_krw = bool((metadata or {}).get("manual_krw_checkout"))
        # 2. Prefer Magpie for CNY invoice/payment_link checkout sessions.
        # CNY must not fall through to SwiftPay, which only supports PHP
        # collection. Checkout Sessions are the live Magpie API surface and
        # support the CNY wallet/card methods.
        magpie_client = getattr(self, "magpie", None)
        has_magpie_checkout = bool(magpie_client and (
            callable(getattr(magpie_client, "create_checkout", None))
            or callable(getattr(magpie_client, "create_session", None))
        ))
        magpie_configured = bool(magpie_client and getattr(magpie_client, "api_key", ""))

        if (
            not manual_verification
            and not force_manual_krw
            and magpie_configured
            and has_magpie_checkout
            and transaction_type in ("invoice", "payment_link")
            and ((not currency_is_explicit) or currency in {"CNY", "KRW"} or magpie_card_requested)
        ):
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

                logger.debug("Magpie checkout called with amount=%s external_id=%s extra=%s", amount, external_id, extra)
                # Ensure description includes descriptor when provided (tests expect this)
                desc = description
                if metadata and metadata.get("descriptor"):
                    desc = f"{metadata.get('descriptor')} - {description}" if description else metadata.get("descriptor")

                requested_magpie_methods = payment_methods or []
                if currency == "CNY" and not requested_magpie_methods:
                    requested_magpie_methods = ["alipay", "wechat", "unionpay"]
                if magpie_card_requested:
                    requested_magpie_methods = ["card"]

                if currency in {"CNY", "KRW"} and callable(getattr(self.magpie, "create_session", None)):
                    public_host = (
                        getattr(settings, "public_checkout_host", "")
                        or getattr(settings, "frontend_url", "")
                        or "https://swiftpay.site"
                    ).strip().rstrip("/")
                    if not public_host.startswith(("http://", "https://")):
                        public_host = f"https://{public_host}"
                    reference_id = external_id or f"magpie-{uuid.uuid4().hex[:12]}"
                    checkout_external_id = reference_id
                    provider_amount = amount
                    provider_currency = currency
                    if currency != "PHP":
                        provider_currency = "PHP"
                        provider_amount = CurrencyConverter.convert(amount, currency, provider_currency)
                        if provider_amount < 1:
                            return {
                                "success": False,
                                "error": (
                                    f"{currency} {amount:,.2f} converts to less than the provider minimum "
                                    "of PHP 1.00. Increase the payment amount and try again."
                                ),
                            }
                        logger.info(
                            "Converting Magpie checkout amount %.2f %s to %.2f %s for %s",
                            amount,
                            currency,
                            provider_amount,
                            provider_currency,
                            reference_id,
                        )
                    checkout_res = await self.magpie.create_session(
                        amount_cents=int(round(provider_amount * 100)),
                        currency=provider_currency,
                        product_name=desc or "Payment",
                        success_url=(metadata or {}).get("success_url") or f"{public_host}/checkout/{reference_id}?status=success",
                        cancel_url=(metadata or {}).get("cancel_url") or f"{public_host}/checkout/{reference_id}?status=cancel",
                        client_reference_id=reference_id,
                        payment_method_types=requested_magpie_methods,
                        customer_name=customer_name or None,
                        customer_email=customer_email or None,
                    )
                else:
                    checkout_external_id = external_id
                    checkout_res = await self.magpie.create_checkout(
                        amount=amount,
                        currency=currency,
                        description=desc,
                        external_id=external_id,
                        payment_method_types=requested_magpie_methods,
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
                    "payment_method_types": requested_magpie_methods,
                }
                if metadata:
                    if metadata.get("descriptor"):
                        kwargs["descriptor"] = metadata.get("descriptor")
                    if metadata.get("merchant_name"):
                        kwargs["merchant_name"] = metadata.get("merchant_name")
                checkout_res = await self.magpie.create_checkout(**kwargs)

            if checkout_res.get("success"):
                data = checkout_res.get("data") if isinstance(checkout_res.get("data"), dict) else {}
                checkout_url = (
                    checkout_res.get("checkout_url")
                    or checkout_res.get("payment_url")
                    or data.get("checkout_url")
                    or data.get("payment_url")
                    or data.get("url")
                )
                provider_external_id = (
                    checkout_res.get("external_id")
                    or data.get("external_id")
                    or data.get("id")
                    or checkout_external_id
                )
                txn_svc = TransactionsService(db)
                txn = await txn_svc.create_transaction(
                    user_id=user_id,
                    transaction_type=transaction_type,
                    amount=amount,
                    currency=currency,
                    external_id=provider_external_id,
                    gateway_id=checkout_res.get("checkout_id") or data.get("checkout_id") or provider_external_id or "",
                    description=(description or ""),
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
                        "gateway": "magpie",
                        "external_id": provider_external_id,
                        "raw": checkout_res,
                    },
                }
            if currency == "CNY":
                return {
                    "success": False,
                    "error": checkout_res.get("error") or "Magpie CNY checkout could not be created",
                }

        # SwiftPay collection orders support PHP only. Non-PHP currencies must
        # use their configured gateway or remain on the internal/manual flow.
        if not manual_verification and self.swift.is_configured() and currency == "PHP":
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
        if currency == "KRW" and transaction_type == "invoice" and not has_magpie_checkout:
            return {"success": False, "error": "PhotonPay KRW checkout is not configured"}

        import uuid as _uuid
        reference_id = external_id or f"manual-{transaction_type}-{_uuid.uuid4().hex[:12]}"
        checkout_url = f"/checkout/{reference_id}"
        if db is None:
            return {
                "success": True,
                "data": {
                    "payment_id": reference_id,
                    "transaction_id": None,
                    "payment_url": checkout_url,
                    "checkout_url": checkout_url,
                    "gateway": "manual_external_verification",
                    "approval_required": True,
                },
            }
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
