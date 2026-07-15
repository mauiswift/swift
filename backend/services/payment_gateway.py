import logging
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from services.swiftpay_service import SwiftPayService
from services.payment_processing import PaymentProcessor
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)


class PaymentGateway:
    """Unified gateway wrapper used by the dashboard and bot.

    Behavior:
    - If SwiftPay is configured, use it to create an order and persist a transaction.
    - Otherwise, fall back to the internal PaymentProcessor (create_payment).
    Returns a canonical dict with keys: success, data (payment_url, checkout_url, gateway, payment_id, reference_no)
    """

    def __init__(self):
        self.swift = SwiftPayService()

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
    ) -> Dict[str, Any]:
        # Prefer SwiftPay when configured
        if self.swift.is_configured():
            # Build a reference_no using external_id when present
            reference_no = external_id or f"swiftpay-{transaction_type}-{__import__('uuid').uuid4().hex[:12]}"
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
                currency="PHP",
                generate_customer_redirect_url=True,
            )
            if not res.get("success"):
                logger.warning("SwiftPay create_order failed: %s", res)
                return {"success": False, "error": res.get("error")}

            data = res.get("data") or {}
            payment_url = data.get("customerRedirectUrl") or data.get("customer_redirect_url") or res.get("reference_no") or ""

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
                gateway_id=data.get("paymentId") or data.get("payment_id") or "",
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
                    "checkout_url": data.get("checkout_url") or f"/checkout/{getattr(txn,'external_id', '')}",
                    "gateway": "swiftpay",
                    "raw": data,
                },
            }

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
