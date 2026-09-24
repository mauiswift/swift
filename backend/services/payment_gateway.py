import logging
import uuid
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, quote, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from models.admin_users import AdminUser
from models.transactions import Transactions
from services.swiftpay_service import SwiftPayService
from services.magpie_qr_service import MagpieQRService
from services.magpie_service import CurrencyConverter, MagpieService
from services.paymentwall_service import PaymentwallService
from services.transactions import TransactionsService
from services.app_settings import (
    get_enabled_collection_currencies,
    get_payment_channels,
    get_wallet_currency_limits,
    get_deposit_accounts,
)
from services.user_benefits import get_krw_benefits

logger = logging.getLogger(__name__)
KRW_LOCAL_CHANNELS = frozenset({"bank_transfer"})


def _is_security_bank_name(value: object) -> bool:
    normalized = "".join(
        character for character in str(value or "").casefold()
        if character.isalnum()
    )
    return "securitybank" in normalized or normalized == "secbank"


async def _select_manual_transfer_account(db: AsyncSession, currency: str, amount: float) -> dict[str, str]:
    accounts = [
        account for account in await get_deposit_accounts(db)
        if str(account.get("currency", "")).upper() == currency
        and str(account.get("account_number", "")).strip()
        and str(account.get("account_name", "")).strip()
    ]
    if currency.upper() == "KRW":
        accounts = [
            account for account in accounts
            if not _is_security_bank_name(
                account.get("bank_name") or account.get("label") or account.get("value")
            )
        ]
        toss_accounts = [
            account for account in accounts
            if "toss" in " ".join(
                str(account.get(key, "")).strip().lower()
                for key in ("value", "label", "bank_name")
            )
        ]
        accounts = toss_accounts
    eligible = [
        account for account in accounts
        if float(account.get("minimum_amount") or 0) <= amount
    ] or accounts
    if not eligible:
        return {}
    if currency.upper() == "KRW" and len(eligible) > 1:
        latest_result = await db.execute(
            select(Transactions.bank_account_number)
            .where(
                Transactions.currency == "KRW",
                Transactions.bank_account_number.is_not(None),
            )
            .order_by(Transactions.id.desc())
            .limit(1)
        )
        latest_account_number = latest_result.scalar_one_or_none()
        eligible = [
            account for account in eligible
            if str(account.get("account_number") or "").strip() != str(latest_account_number or "").strip()
        ] or eligible
    account = eligible[uuid.uuid4().int % len(eligible)]
    return {
        "bank_name": str(account.get("label") or account.get("value") or "").strip(),
        "bank_account_number": str(account.get("account_number") or "").strip(),
        "bank_account_name": str(account.get("account_name") or "").strip(),
    }

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
        channel_aliases = {"wechat_pay": "wechat", "qrph": "qr_code"}
        requested_methods = [
            channel_aliases.get(str(method).strip().lower(), str(method).strip().lower())
            for method in (payment_methods or [])
            if str(method).strip()
        ]
        manual_verification = bool((metadata or {}).get("manual_verification"))
        selected_currency = currency or (metadata or {}).get("currency")
        original_transaction_type = transaction_type
        currency = str(selected_currency).upper() if selected_currency else "PHP"
        if selected_currency and currency not in {"PHP", "CNY", "KRW", "USDT"}:
            return {"success": False, "error": "Unsupported collection currency"}
        if selected_currency and db is not None and currency not in await get_enabled_collection_currencies(db):
            return {"success": False, "error": "That collection currency is currently disabled by the main administrator"}
        # Legacy QR requests omit currency and are resolved by the Magpie QR
        # flow below. Explicitly currency-scoped requests must pass the
        # configured checkout allowlist instead.
        is_legacy_international_request = (
            not selected_currency
            and any(method in {"alipay", "wechat"} for method in requested_methods)
        )
        if requested_methods and db is not None and not is_legacy_international_request:
            configured_channels = (await get_payment_channels(db)).get(currency, {})
            enabled_checkout = set(configured_channels.get("checkout", []))
            unsupported_methods = [method for method in requested_methods if method not in enabled_checkout]
            if unsupported_methods:
                return {
                    "success": False,
                    "error": f"{unsupported_methods[0]} collection is not enabled for {currency}",
                }
        if (
            currency == "KRW"
            and db is not None
            and original_transaction_type != "payment_link"
            and not self.swift.is_configured()
        ):
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
            and currency != "KRW"
            and ((not currency_is_explicit) or currency == "CNY" or magpie_card_requested)
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

                if currency == "CNY" and callable(getattr(self.magpie, "create_session", None)):
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
                        provider_amount = await CurrencyConverter.convert_live(amount, currency, provider_currency)
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

        # SwiftPay's documented collection order contract supports PHP, USD,
        # and EUR. The caller must provide the amount in this currency.
        if not manual_verification and self.swift.is_configured() and currency in {"PHP", "USD", "EUR"}:
            # Build a reference_no using external_id when present
            import uuid as _uuid
            reference_no = external_id or f"swiftpay-{transaction_type}-{_uuid.uuid4().hex[:12]}"
            provider_amount = amount
            if provider_amount < 1:
                return {
                    "success": False,
                    "error": f"{currency} {amount:,.2f} is below the SwiftPay minimum provider amount",
                }
            order_result = await self.swift.create_order(
                amount=provider_amount,
                reference_no=reference_no,
                details={
                    "customerName": customer_name or "Customer",
                    "email": customer_email,
                    "description": description or "SwiftPay payment",
                    "sourceAmount": (metadata or {}).get("original_amount"),
                    "sourceCurrency": (metadata or {}).get("original_currency"),
                },
                currency=currency,
                generate_customer_redirect_url=True,
                merchant_webhook_url=self.swift.callback_url or None,
            )
            if not order_result.get("success"):
                return order_result
            order_data = order_result.get("data") if isinstance(order_result.get("data"), dict) else {}
            provider_reference = str(order_result.get("reference_no") or reference_no)
            checkout_url = (
                order_data.get("customerRedirectUrl")
                or order_data.get("customer_redirect_url")
                or ""
            )
            provider_payment_id = (
                order_data.get("paymentId")
                or order_data.get("payment_id")
                or order_result.get("payment_id")
                or provider_reference
            )
            txn = await TransactionsService(db).create_transaction(
                user_id=user_id,
                transaction_type=transaction_type,
                amount=provider_amount,
                currency=currency,
                original_amount=(metadata or {}).get("original_amount"),
                original_currency=(metadata or {}).get("original_currency"),
                external_id=provider_reference,
                gateway_id=provider_payment_id,
                description=description or "",
                customer_name=customer_name,
                customer_email=customer_email,
                payment_url=checkout_url,
                status="pending",
            )
            return {
                "success": True,
                "data": {
                    "payment_id": provider_payment_id,
                    "transaction_id": getattr(txn, "id", None),
                    "payment_url": checkout_url,
                    "checkout_url": checkout_url,
                    "gateway": "swiftpay_self_hosted",
                    "amount": provider_amount,
                    "currency": currency,
                    "processing_amount": provider_amount,
                    "processing_currency": currency,
                    "exchange_rate": 1,
                    "provider_payment_id": provider_payment_id,
                },
            }

        # Provider-less links and invoices use the internal checkout and remain
        # pending until a super admin verifies the external payment.
        if currency == "KRW" and transaction_type == "invoice" and not has_magpie_checkout and not force_manual_krw:
            return {"success": False, "error": "PhotonPay KRW checkout is not configured"}

        import uuid as _uuid
        reference_id = external_id or f"manual-{transaction_type}-{_uuid.uuid4().hex[:12]}"
        checkout_url = f"/checkout/{reference_id}"
        transfer_account = {}
        if currency == "KRW" and db is not None:
            transfer_account = await _select_manual_transfer_account(db, currency, amount)
        if currency == "KRW" and not transfer_account:
            virtual_account = PaymentwallService.generate_krw_virtual_account(
                user_id=user_id,
                reference_id=reference_id,
            )
            transfer_account = {
                "bank_name": virtual_account["bank_name"],
                "bank_account_number": virtual_account["number"],
                "bank_account_name": virtual_account["account_name"],
            }
        bank_account = {
            "bank_name": transfer_account.get("bank_name", ""),
            "number": transfer_account.get("bank_account_number", ""),
            "account_name": transfer_account.get("bank_account_name", ""),
        }
        if db is None:
            return {
                "success": True,
                "data": {
                    "payment_id": reference_id,
                    "transaction_id": None,
                    "payment_url": checkout_url,
                    "checkout_url": checkout_url,
                    "gateway": "manual_internal",
                    "bank_account": bank_account,
                },
            }
        txn_svc = TransactionsService(db)
        txn = await txn_svc.create_transaction(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            currency=currency,
            external_id=reference_id,
            gateway_id=reference_id,
            description=description or "",
            customer_name=customer_name,
            customer_email=customer_email,
            payment_url=checkout_url,
            **transfer_account,
            status="pending",
        )
        return {
            "success": True,
            "data": {
                "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                "transaction_id": getattr(txn, "id", None),
                "payment_url": checkout_url,
                "checkout_url": checkout_url,
                "gateway": "manual_internal",
                "bank_account": bank_account,
            },
        }


# Shared gateway instance used by routers and background handlers.
gateway = PaymentGateway()
