import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func, or_, case, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.transactions import Transactions
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from models.disbursements import Disbursements
from models.admin_users import AdminUser
from services.event_bus import payment_event_bus
from services.wallets import WalletsService
from services.app_settings import get_collection_fee_percent
from models.downline import Downline, DownlineCommission
from services.system_earnings import credit_system_earnings
from services.downline_fee_allocation import DownlineFeeAllocationService
from services.wallet_transaction_labeling import WalletTransactionLabelingService

from services.base import BaseService

logger = logging.getLogger(__name__)

PAYMENT_CREDIT_FEE_RATE = 0.004
APPROVABLE_PAYMENT_STATUSES = {
    "pending",
    "processing",
    "created",
    "unpaid",
    "awaiting_payment",
}
NON_CUSTOMER_PAYMENT_TYPES = {
    "disbursement",
    "swiftpay_disbursement",
    "withdrawal",
    "wallet_withdrawal",
    "topup",
    "wallet_topup",
    "crypto_topup",
    "bank_deposit",
    "refund",
    "fee",
    "commission",
    "settlement",
}


def is_customer_payment(txn: Transactions) -> bool:
    """Return whether a transaction represents money paid to a merchant."""
    return (
        str(txn.transaction_type or "") not in NON_CUSTOMER_PAYMENT_TYPES
        and not str(txn.transaction_type or "").endswith("_fee")
        and bool(txn.external_id)
        and float(txn.amount or 0) > 0
    )


# ------------------ Service Layer ------------------
class TransactionsService(BaseService[Transactions]):
    """Service layer for Transactions operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Transactions)

    async def _find_existing_transaction(
        self,
        external_id: str = "",
        gateway_id: str = "",
        idempotency_key: Optional[str] = None
    ) -> Optional[Transactions]:
        """Find an existing transaction for idempotent creation."""
        conditions = []
        if idempotency_key:
            conditions.append(Transactions.external_id == idempotency_key)
            conditions.append(Transactions.xendit_id == idempotency_key)
        if external_id:
            conditions.append(Transactions.external_id == external_id)
            conditions.append(Transactions.xendit_id == external_id)
        if gateway_id:
            conditions.append(Transactions.external_id == gateway_id)
            conditions.append(Transactions.xendit_id == gateway_id)

        if not conditions:
            return None

        stmt = (
            select(Transactions)
            .where(or_(*conditions))
            .order_by(Transactions.id.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_transaction(
        self,
        user_id: str,
        transaction_type: str,
        amount: float,
        external_id: str = "",
        gateway_id: str = "",
        description: str = "",
        customer_name: str = "",
        customer_email: str = "",
        payment_url: str = "",
        receipt_file_id: Optional[str] = None,
        status: str = "pending",
        currency: str = "PHP",
        original_amount: Optional[float] = None,
        original_currency: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
        qr_code_url: Optional[str] = None,
    ) -> Transactions:
        """Create a new transaction record with consistent defaults.

        If an existing transaction exists for the given external/gateway identifiers
        or idempotency key, return it instead of creating a duplicate.
        """
        existing = await self._find_existing_transaction(external_id, gateway_id, idempotency_key)
        if existing:
            logger.info(
                "Idempotent create_transaction hit: returning existing transaction %s",
                existing.id,
            )
            return existing

        now = datetime.now(timezone.utc)
        txn = Transactions(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            currency=currency,
            original_amount=original_amount,
            original_currency=original_currency,
            external_id=external_id,
            xendit_id=gateway_id,  # Using xendit_id column for gateway reference
            status=status,
            description=description,
            customer_name=customer_name,
            customer_email=customer_email,
            payment_url=payment_url,
            receipt_file_id=receipt_file_id,
            qr_code_url=qr_code_url,
            created_at=now,
            updated_at=now,
        )
        if is_customer_payment(txn):
            txn.approval_status = "pending"
        # Handle metadata if we ever add a metadata column to Transactions
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(txn)
        return txn

    async def get_or_create_wallet(self, user_id: str, currency: str = "PHP", lock: bool = False) -> Wallets:
        """Helper to get or create a user wallet with optional row locking."""
        query = select(Wallets).where(Wallets.user_id == user_id, Wallets.currency == currency)
        if lock:
            query = query.with_for_update()

        result = await self.db.execute(query)
        wallet = result.scalar_one_or_none()
        if wallet is None:
            now = datetime.now(timezone.utc)
            wallet = Wallets(user_id=user_id, currency=currency, balance=0.0, created_at=now, updated_at=now)
            self.db.add(wallet)
            await self.db.flush()
            if lock:
                # Re-fetch with lock
                return await self.get_or_create_wallet(user_id, currency, lock=True)
        return wallet

    async def credit_wallet_from_transaction(
        self,
        txn: Transactions,
        gateway_label: str = "Gateway",
        wallet_note: Optional[str] = None,
    ) -> Wallets:
        """Credit the user's wallet (Maximizing automated T+0/T+1 logic)."""
        from services.wallets import WalletsService
        wallet_service = WalletsService(self.db)
        settlement_currency = str(txn.currency or "PHP").strip().upper()
        wallet = await wallet_service.get_or_create_wallet(txn.user_id, settlement_currency, lock=True)
        reference_id = txn.external_id or txn.xendit_id or f"txn-{txn.id}"

        # Check for duplicate wallet transaction (idempotency)
        existing_wtxn = await self.db.execute(
            select(Wallet_transactions)
            .where(Wallet_transactions.reference_id == reference_id)
            .limit(1)
        )
        existing_wtxn = existing_wtxn.scalars().first()
        if existing_wtxn:
            logger.info(
                "Duplicate wallet transaction detected for reference_id %s, skipping crediting",
                reference_id,
            )
            return wallet

        gross_amount = float(txn.amount or 0.0)

        # Check if user is Gold VIP - if so, they don't pay system base fee for THEIR OWN payments
        user_result = await self.db.execute(
            select(AdminUser).where(AdminUser.telegram_id == str(txn.user_id)).limit(1)
        )
        user = user_result.scalars().first()
        is_gold_vip = user and user.vip_gold

        # Gold VIP users pay the configured VIP Gold collection fee on their own payments.
        base_fee_rate = await get_collection_fee_percent(self.db, str(txn.user_id))

        # Logic for Automated Clearing:
        # Instant methods (QR, E-Wallet) go to available_balance (T+0)
        # Card payments often require T+1 clearing.
        normalized_gateway = str(gateway_label or "").strip().lower()
        is_instant = (
            txn.transaction_type in ["qr_code", "ewallet", "qrph_payment", "swiftpay_qr", "swiftpay_order", "zip_checkout", "alipay_qr", "wechat_qr"]
            or str(txn.currency or "").upper() == "KRW"
            or gateway_label == "admin-manual"
            or normalized_gateway == "swiftpay"
        )

        # Credit the gross amount to the wallet (available or pending depending on method)
        amount = round(gross_amount, 2)
        balance_before = float(wallet.balance or 0.0)

        if is_instant:
            wallet.available_balance = round((wallet.available_balance or 0.0) + amount, 2)
        else:
            wallet.pending_balance = round((wallet.pending_balance or 0.0) + amount, 2)

        wallet.balance = round(balance_before + amount, 2)
        wallet.total_credits = (wallet.total_credits or 0.0) + amount
        wallet.transaction_count = (wallet.transaction_count or 0) + 1
        wallet.last_activity = datetime.now(timezone.utc)
        wallet.updated_at = datetime.now(timezone.utc)

        # Create wallet transaction for the gross credit
        credit_note = WalletTransactionLabelingService.generate_credit_note(
            gateway_label=gateway_label,
            gross_amount=gross_amount,
            description=txn.description or "",
            transaction_type=txn.transaction_type,
            reference_id=reference_id,
            approval_note=wallet_note,
            currency=settlement_currency,
        )

        wtxn = Wallet_transactions(
            user_id=wallet.user_id,
            wallet_id=wallet.id,
            transaction_type="receive",
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            note=credit_note,
            status="completed",
            reference_id=reference_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(wtxn)
        await self.db.flush()

        # Allocate service fees to downline uplines
        fee_allocation_service = DownlineFeeAllocationService(self.db)
        fee_allocation = await fee_allocation_service.calculate_and_allocate_fees(
            downline_user_id=str(txn.user_id),
            gross_amount=gross_amount,
            base_fee_rate=base_fee_rate,
            currency=settlement_currency,
            reference_id=reference_id,
        )

        fee_amount = fee_allocation["total_fee"]

        # Apply the payment processing fee as a separate deduction transaction
        if fee_amount > 0:
            fee_balance_before = float(wallet.balance or 0.0)
            fee_rate = fee_allocation["total_fee_rate"]

            # Deduct from available or pending depending on where funds were credited
            if is_instant:
                wallet.available_balance = round((wallet.available_balance or 0.0) - fee_amount, 2)
            else:
                wallet.pending_balance = round((wallet.pending_balance or 0.0) - fee_amount, 2)

            wallet.balance = round((wallet.balance or 0.0) - fee_amount, 2)
            wallet.updated_at = datetime.now(timezone.utc)

            fee_breakdown = f"Service Fee : {fee_amount:,.2f}{settlement_currency} {fee_rate * 100:.2f}%"

            fee_wtxn = Wallet_transactions(
                user_id=wallet.user_id,
                wallet_id=wallet.id,
                transaction_type="fee",
                amount=-fee_amount,
                balance_before=fee_balance_before,
                balance_after=wallet.balance,
                note=fee_breakdown,
                status="completed",
                reference_id=f"{reference_id}-fee",
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(fee_wtxn)
            await self.db.flush()

        try:
            payment_event_bus.publish({
                "event_type": "wallet_update",
                "user_id": txn.user_id,
                "wallet_id": wallet.id,
                "balance": wallet.balance,
                "currency": txn.currency or "PHP",
                "transaction_type": "receive",
                "amount": amount,
                "transaction_id": wtxn.id,
                "note": "Payment received",
            })
        except Exception as e:
            logger.warning(f"Failed to publish wallet update event: {e}")

        return wallet

    async def calculate_expected_fees(self, user_id: str, gross_amount: float) -> Dict[str, Any]:
        """Calculate expected fees and deductions based on per-user configuration."""
        # Check if user is Gold VIP
        user_result = await self.db.execute(
            select(AdminUser).where(AdminUser.telegram_id == str(user_id)).limit(1)
        )
        user = user_result.scalars().first()
        is_gold_vip = user and user.vip_gold

        # Expected fees must match the configured VIP Gold fee used during settlement.
        base_fee_rate = await get_collection_fee_percent(self.db, str(user_id))

        # Check if this user is Gold VIP to determine upline fee structure
        is_downline_gold_vip = is_gold_vip

        upline_result = await self.db.execute(
            select(Downline)
            .where(
                Downline.downline_user_id == str(user_id),
                Downline.status == "active",
            )
            .order_by(Downline.level.asc(), Downline.id.asc())
        )
        # All uplines included, using their individual service fee settings + additional per-downline fees
        upline_commissions: list[tuple[str, int, float]] = []
        seen_uplines: set[str] = set()
        for relationship in upline_result.scalars().all():
            upline_id = str(relationship.upline_user_id)
            if upline_id in seen_uplines or upline_id == str(user_id):
                continue
            seen_uplines.add(upline_id)

            # Fetch the upline's individual service fee from AdminUser table
            upline_user_result = await self.db.execute(
                select(AdminUser).where(AdminUser.telegram_id == upline_id).limit(1)
            )
            upline_user = upline_user_result.scalars().first()

            # The upline's VIP status determines the service rate for the whole downline.
            upline_service_fee = DownlineFeeAllocationService.get_effective_service_fee_percent(upline_user)

            # Add any additional fee set on this specific downline relationship
            additional_fee = float(relationship.service_fee_percent or 0.0)

            # Total fee is upline's base fee + additional fee for this downline
            total_upline_fee = upline_service_fee + additional_fee
            service_fee_rate = max(0.0, min(100.0, total_upline_fee)) / 100.0

            upline_commissions.append((upline_id, int(relationship.level or 1), service_fee_rate))

        total_fee_rate = base_fee_rate + sum(rate for _, _, rate in upline_commissions)
        total_fee_amount = round(gross_amount * total_fee_rate, 2)
        system_fee = round(gross_amount * base_fee_rate, 2)

        upline_fees = []
        for upline_id, level, rate in upline_commissions:
            commission = round(gross_amount * rate, 2)
            upline_fees.append({
                "upline_id": upline_id,
                "level": level,
                "rate": round(rate * 100, 2),
                "amount": commission,
            })

        net_amount = round(gross_amount - total_fee_amount, 2)

        return {
            "gross_amount": gross_amount,
            "net_amount": net_amount,
            "total_fee_rate": round(total_fee_rate * 100, 2),
            "total_fee_amount": total_fee_amount,
            "system_fee_rate": round(base_fee_rate * 100, 2),
            "system_fee_amount": system_fee,
            "upline_fees": upline_fees,
            "is_gold_vip": is_gold_vip,
            "vip_note": "Gold VIP configured collection fee applies" if is_gold_vip else None,
            "downline_vip_note": "Relationship-specific upline fee only" if not is_downline_gold_vip else "Super Admin configured VIP fee applies",
        }

    async def validate_manual_payment_fees(
        self,
        txn: Transactions,
        deducted_amount: float
    ) -> Dict[str, Any]:
        """
        Validate that deducted fees match expected fees for manual payments.
        Used by super admins to verify accuracy before approval.
        """
        gross_amount = float(txn.amount or 0)
        expected_fees = await self.calculate_expected_fees(str(txn.user_id), gross_amount)

        # Calculate accuracy (what percentage of expected fees were actually deducted)
        expected_total_fee = expected_fees["total_fee_amount"]

        if expected_total_fee == 0:
            accuracy = 100.0 if deducted_amount == 0 else 0.0
        else:
            accuracy = round((deducted_amount / expected_total_fee) * 100, 2)
            accuracy = min(100.0, max(0.0, accuracy))  # Clamp between 0-100

        is_accurate = abs(deducted_amount - expected_total_fee) <= 0.01  # Allow 0.01 rounding difference

        return {
            "expected_fees": expected_fees,
            "deducted_amount": deducted_amount,
            "accuracy_percent": accuracy,
            "is_accurate": is_accurate,
            "deviation": round(deducted_amount - expected_total_fee, 2),
            "status": "OK" if is_accurate else "WARNING",
        }

    async def mark_as_paid(
        self,
        txn: Transactions,
        gateway_label: str = "Gateway",
        approved_by: Optional[str] = None,
        approval_note: Optional[str] = None,
    ) -> bool:
        """Mark a transaction as paid and credit the wallet (for incoming) or complete (for outgoing)."""
        if txn.status == "paid" or txn.status == "completed":
            return True
        if txn.status == "expired":
            logger.warning("Attempted to mark expired transaction %s as paid", txn.id)
            return False

        transaction_id = txn.id
        transaction_external_id = txn.external_id
        transaction_amount = txn.amount
        transaction_description = txn.description or ""
        transaction_type = txn.transaction_type
        transaction_user_id = txn.user_id
        old_status = txn.status
        is_disbursement = transaction_type == "disbursement" or transaction_type == "swiftpay_disbursement"

        normalized_gateway_label = gateway_label.strip().lower() if isinstance(gateway_label, str) else ""
        provider_callback = normalized_gateway_label in {
            "swiftpay",
            "magpie",
            "paymentwall",
            "photonpay",
            "payment gateway",
        }
        is_swiftpay_callback = normalized_gateway_label == "swiftpay"
        currency = (txn.currency or "").upper()
        amount = float(transaction_amount or 0)
        if is_customer_payment(txn) and txn.approval_status != "approved" and approved_by is None:
            txn.approval_status = "pending"
            txn.status = "pending"
            txn.updated_at = datetime.now(timezone.utc)
            await self.db.commit()
            logger.info(
                "Customer payment %s completed through %s and is awaiting super-admin approval",
                transaction_external_id,
                gateway_label,
            )
            return True

        if is_disbursement:
            # For outgoing disbursements, we just mark as completed.
            # Wallet was already deducted when the request was created.
            txn.status = "completed"
        else:
            # For incoming payments, we mark as paid and credit the wallet
            txn.status = "paid"

        now = datetime.now(timezone.utc)
        if approved_by is not None:
            txn.approval_status = "approved"
            txn.approved_by = str(approved_by)
            txn.approved_at = now

        txn.paid_at = now
        txn.updated_at = now

        try:
            if not is_disbursement:
                await self.credit_wallet_from_transaction(txn, gateway_label, approval_note)

            # Sync status with disbursements table if applicable
            if is_disbursement:
                disbursement_result = await self.db.execute(
                    update(Disbursements)
                    .where(or_(Disbursements.external_id == txn.external_id, Disbursements.xendit_id == txn.xendit_id))
                    .values(status="completed", updated_at=datetime.now(timezone.utc))
                    .returning(Disbursements.id)
                )
                disbursement_id = disbursement_result.scalar_one_or_none()
                if disbursement_id:
                    disb = await self.db.get(Disbursements, disbursement_id)
                    if disb and disb.processing_fee:
                        fee_result = await self.db.execute(
                            select(Wallet_transactions.status).where(
                                Wallet_transactions.reference_id == f"{disb.external_id}-fee"
                            ).limit(1)
                        )
                        fee_status = fee_result.scalar_one_or_none()
                        if fee_status != "completed":
                            await credit_system_earnings(
                                db=self.db,
                                amount=disb.processing_fee,
                                currency=disb.currency or txn.currency or "PHP",
                                reference_id=f"{disb.external_id}-system-fee",
                                note=f"Disbursement earnings: {disb.processing_fee:,.2f} {disb.currency or txn.currency or 'PHP'}",
                            )
                            await self.db.execute(
                                update(Wallet_transactions)
                                .where(Wallet_transactions.reference_id == f"{disb.external_id}-fee")
                                .values(status="completed")
                            )

            await self.db.commit()
        except Exception as exc:
            await self.db.rollback()
            failure_message = f"Transaction update failed: {str(exc)}"
            txn.status = "failed"
            txn.updated_at = datetime.now(timezone.utc)
            txn.description = (
                f"{transaction_description.strip()} | {failure_message}"
                if transaction_description.strip()
                else failure_message
            )
            self.db.add(txn)
            await self.db.commit()
            logger.error(
                "Failed to update transaction %s status: %s",
                transaction_id,
                exc,
                exc_info=True,
            )
            return False

        try:
            payment_event_bus.publish({
                "event_type": "status_change",
                "transaction_id": transaction_id,
                "external_id": transaction_external_id,
                "old_status": old_status,
                "new_status": "completed" if is_disbursement else "paid",
                "amount": transaction_amount,
                "description": transaction_description,
                "transaction_type": transaction_type,
                "user_id": transaction_user_id,
            })
        except Exception as e:
            logger.warning(f"Failed to publish status change event: {e}")

        return True

    async def approve_payment_link(
        self,
        txn: Transactions,
        approved_by: str,
        note: Optional[str] = None,
    ) -> bool:
        """Approve a payment link and credit its wallet exactly once."""
        if not is_customer_payment(txn):
            logger.warning("Attempted to approve non-customer transaction %s", txn.id)
            return False
        approval_pending = txn.approval_status in {None, "pending"}
        if txn.status in {"paid", "completed"}:
            if not approval_pending:
                return False
            now = datetime.now(timezone.utc)
            txn.approval_status = "approved"
            txn.approved_by = str(approved_by)
            txn.approved_at = now
            txn.updated_at = now
            await self.credit_wallet_from_transaction(
                txn,
                gateway_label="admin-manual",
                wallet_note=note,
            )
            await self.db.commit()
            return True
        if txn.status == "failed" and txn.approval_status == "approved":
            # A previous manual approval may have failed during wallet settlement.
            # Keep the request retryable without allowing provider-failed payments through.
            txn.status = "pending"
            txn.approval_status = "pending"
            txn.approved_by = None
            txn.approved_at = None
            txn.updated_at = datetime.now(timezone.utc)
        if txn.status not in APPROVABLE_PAYMENT_STATUSES:
            return False
        if txn.approval_status == "approved":
            return False

        return await self.mark_as_paid(
            txn,
            gateway_label="admin-manual",
            approved_by=approved_by,
            approval_note=note,
        )

    async def mark_as_expired(self, txn: Transactions) -> bool:
        """Mark a transaction as expired."""
        if txn.status != "pending":
            return False

        old_status = txn.status
        txn.status = "expired"
        txn.updated_at = datetime.now(timezone.utc)

        # Publish status change event
        try:
            payment_event_bus.publish({
                "event_type": "status_change",
                "transaction_id": txn.id,
                "external_id": txn.external_id,
                "old_status": old_status,
                "new_status": txn.status,
                "amount": txn.amount,
                "description": txn.description or "",
                "transaction_type": txn.transaction_type,
                "user_id": txn.user_id,
            })
        except Exception as e:
            logger.warning(f"Failed to publish status change event: {e}")

        await self.db.commit()
        return True

    async def find_by_external_or_gateway_id(self, identifier: str) -> Optional[Transactions]:
        """Find a transaction by external_id or xendit_id."""
        # Return the most recent matching transaction to avoid exceptions when
        # duplicate records exist (tests or demo data may create duplicates).
        stmt = (
            select(Transactions)
            .where(or_(Transactions.xendit_id == identifier, Transactions.external_id == identifier))
            .order_by(Transactions.id.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        # Use scalars().first() which is tolerant of zero-or-one rows and
        # doesn't raise MultipleResultsFound.
        return result.scalars().first()

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Fetch transaction statistics for a user."""
        candidate_ids = self._candidate_user_ids(user_id)

        # Total counts by status
        async def get_count(status: Optional[str] = None):
            stmt = select(func.count(Transactions.id)).where(Transactions.user_id.in_(candidate_ids))
            if status:
                stmt = stmt.where(Transactions.status == status)
            res = await self.db.execute(stmt)
            return res.scalar() or 0

        # Total amounts by status
        async def get_sum(status: Optional[str] = None):
            stmt = select(func.sum(Transactions.amount)).where(Transactions.user_id.in_(candidate_ids))
            if status:
                stmt = stmt.where(Transactions.status == status)
            res = await self.db.execute(stmt)
            return res.scalar() or 0.0

        total_count = await get_count()
        paid_count = await get_count("paid")
        pending_count = await get_count("pending")
        expired_count = await get_count("expired")

        total_amount = await get_sum()
        paid_amount = await get_sum("paid")
        pending_amount = await get_sum("pending")

        return {
            "total_count": total_count,
            "paid_count": paid_count,
            "pending_count": pending_count,
            "expired_count": expired_count,
            "total_amount": float(total_amount),
            "paid_amount": float(paid_amount),
            "pending_amount": float(pending_amount),
            "currency": "PHP"
        }

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Transactions]:
        """Get transactions by any field"""
        try:
            if not hasattr(Transactions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Transactions")
            result = await self.db.execute(
                select(Transactions).where(getattr(Transactions, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching transactions by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Transactions]:
        """Get list of transactionss filtered by field"""
        try:
            if not hasattr(Transactions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Transactions")
            result = await self.db.execute(
                select(Transactions)
                .where(getattr(Transactions, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Transactions.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching transactionss by {field_name}: {str(e)}")
            raise
