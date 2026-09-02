import logging
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from services.swiftpay_service import SwiftPayService
from services.magpie_qr_service import MagpieQRService
from services.magpie_service import MagpieService
from services.payment_processing import PaymentProcessor
from services.transactions import TransactionsService
from services.paymentwall_service import PaymentwallService

logger = logging.getLogger(__name__)


class PaymentGateway:
    """Unified gateway wrapper used by the dashboard and bot.

    Behavior:
    - If SwiftPay is configured, use it to create an order and persist a transaction.
    - Otherwise, fall back to the internal PaymentProcessor (create_payment).
    Returns a canonical dict with keys: success, data (payment_url, checkout_url, gateway, payment_id, reference_no)
    """

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.swift = SwiftPayService()
        # Two magpie clients: QR-specific service and the main Magpie API shim
        self.magpie_qr = MagpieQRService()
        self.magpie = MagpieService()
        self.paymentwall = PaymentwallService()

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
        # 1. Routing Logic: Prioritize Magpie for Alipay/WeChat Pay
        requested_methods = [m.lower() for m in (payment_methods or [])]
        selected_currency = currency or (metadata or {}).get("currency")
        currency = str(selected_currency).upper() if selected_currency else "PHP"
        if selected_currency and currency not in {"PHP", "CNY", "KRW"}:
            return {"success": False, "error": "Collection currency must be PHP, CNY, or KRW"}
        krw_wallet_methods = {"kakao", "kakaopay", "naverpay", "payco", "toss", "tosspay"}
        requested_krw_wallet = any(m.lower() in krw_wallet_methods for m in (payment_methods or []))
        currency_is_explicit = bool(selected_currency)
        wants_krw = currency_is_explicit and currency == "KRW"
        if self.swift.is_configured() and (wants_krw or requested_krw_wallet):
            import uuid as _uuid
            reference_id = external_id or f"swiftpay-krw-{_uuid.uuid4().hex[:12]}"
            details = {
                "payment_type": transaction_type,
                "description": description,
                "customer_name": customer_name,
                "customer_email": customer_email,
            }
            result = await self.swift.create_order(
                amount=amount,
                reference_no=reference_id,
                details=details,
                currency="KRW",
                generate_customer_redirect_url=True,
            )
            if result.get("success"):
                data = result.get("data") or {}
                payment_url = data.get("customerRedirectUrl") or data.get("customer_redirect_url") or data.get("payment_url") or data.get("paymentUrl") or ""
                txn = await TransactionsService(db).create_transaction(
                    user_id=user_id,
                    transaction_type=transaction_type,
                    amount=amount,
                    currency="KRW",
                    external_id=reference_id,
                    gateway_id=data.get("paymentId") or data.get("payment_id") or reference_id,
                    description=description,
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
                        "checkout_url": payment_url,
                        "gateway": "swiftpay",
                        "raw": data,
                    },
                }

            logger.warning("SwiftPay KRW payment failed for %s; falling back to Paymentwall: %s", reference_id, result.get("error") or "SwiftPay KRW order failed")

        if self.paymentwall.is_configured and wants_krw:
            import uuid as _uuid
            reference_id = external_id or f"paymentwall-{_uuid.uuid4().hex[:12]}"
            result = self.paymentwall.create_widget_url(
                user_id=user_id,
                amount=amount,
                currency="KRW",
                reference_id=reference_id,
                description=description,
            )
            if not result.get("success"):
                return result
            txn = await TransactionsService(db).create_transaction(
                user_id=user_id,
                transaction_type=transaction_type,
                amount=amount,
                currency="KRW",
                external_id=reference_id,
                gateway_id=reference_id,
                description=description,
                customer_name=customer_name,
                customer_email=customer_email,
                payment_url=result["payment_url"],
                qr_code_url=result.get("qr_code_url") or "",
                status="pending",
            )
            return {
                "success": True,
                "data": {
                    "payment_id": getattr(txn, "external_id", None) or getattr(txn, "id", None),
                    "transaction_id": getattr(txn, "id", None),
                    "payment_url": result["payment_url"],
                    "checkout_url": result["payment_url"],
                    "qr_code_url": result.get("qr_code_url"),
                    "bank_account": result.get("bank_account"),
                    "gateway": "paymentwall",
                    "raw": result["data"],
                },
            }
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
        if currency_is_explicit and currency == "CNY" and not magpie_configured:
            return {"success": False, "error": "Magpie is not configured for CNY collection"}
        if (not currency_is_explicit or currency == "CNY") and magpie_configured and transaction_type in ("invoice", "payment_link"):
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

        # 3. Prefer SwiftPay for all other methods when configured
        if (not currency_is_explicit or currency == "PHP") and self.swift.is_configured():
            # Build a reference_no using external_id when present
            import uuid as _uuid
            reference_no = external_id or f"swiftpay-{transaction_type}-{_uuid.uuid4().hex[:12]}"
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
            checkout_url = _pick(data, "checkoutUrl", "checkout_url", "customerRedirectUrl", "customer_redirect_url") or f"/checkout/{getattr(txn,'external_id','') if 'txn' in locals() else reference_no}"
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


        if currency_is_explicit and currency == "PHP":
            return {"success": False, "error": "SwiftPay is not configured for PHP collection"}
        # Fallback to internal processor
        processor = PaymentProcessor(db)
        created = await processor.create_payment(
            user_id=user_id,
            amount=amount,
            description=description or f"{transaction_type} payment",
            currency="PHP",
            metadata={
                "customer_name": customer_name,
                "customer_email": customer_email,
                "payment_methods": payment_methods or [],
            },
        )
        return {"success": True, "data": {**created, "gateway": "internal"}}


gateway = PaymentGateway()
