import logging
import uuid
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple

from sqlalchemy import select, func, case, update, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.crypto_topup import CryptoTopupRequest
from models.topup_requests import TopupRequest

from services.base import BaseService

logger = logging.getLogger(__name__)

# Credit/debit type categories for USD balance computation
_USD_CREDIT_TYPES = ("crypto_topup", "usd_receive", "admin_credit")
_USD_DEBIT_TYPES = ("usdt_send", "usd_send", "admin_debit")
PHP_SECURITY_DEPOSIT_MIN = 50000.0

class WalletsService(BaseService[Wallets]):
    """Enhanced service layer for Wallets operations with integrated business logic."""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Wallets)

    @staticmethod
    def _normalize_user_id(user_id: Any, currency: str = "PHP") -> str:
        """Standardize identifiers for wallet lookup."""
        if user_id is None:
            raise ValueError("user_id is required")
        normalized = str(user_id).strip()
        if not normalized:
            raise ValueError("user_id is required")
        return normalized

    async def _resolve_effective_wallet_owner(self, user_id: str) -> Tuple[str, Optional[str]]:
        """Resolve the effective wallet owner (Org ID vs User ID).

        Returns: (owner_id, organization_id)
        """
        user_id = self._normalize_user_id(user_id)
        # If user_id already looks like an org-prefixed ID, extract it
        if user_id.startswith("org:"):
            return user_id, user_id[4:]

        # Lookup user to see if they belong to an organization
        admin_res = await self.db.execute(select(AdminUser).where(AdminUser.telegram_id == user_id))
        admin_user = admin_res.scalar_one_or_none()

        if admin_user and admin_user.organization_id:
            org_id = admin_user.organization_id
            return f"org:{org_id}", org_id

        return user_id, None

    async def _resolve_effective_wallet_user_id(self, user_id: str, currency: str = "PHP") -> str:
        """Compatibility shim for legacy callers. Use _resolve_effective_wallet_owner instead."""
        owner_id, _ = await self._resolve_effective_wallet_owner(user_id)
        return owner_id

    async def _ensure_wallet_active(self, wallet: Wallets, action: str) -> None:
        """Prevent balance mutations on wallets frozen by an administrator."""
        if wallet.is_frozen:
            reason = wallet.freeze_reason or "No reason provided"
            raise ValueError(f"Wallet is frozen and cannot {action}: {reason}")

    async def get_or_create_wallet(self, user_id: str, currency: str = "PHP", lock: bool = False) -> Wallets:
        """Get user's wallet (Org-scoped if member)."""
        currency_upper = currency.upper()
        effective_owner_id, org_id = await self._resolve_effective_wallet_owner(user_id)

        query = select(Wallets).where(
            Wallets.user_id == effective_owner_id,
            Wallets.currency == currency_upper,
        )
        if lock:
            query = query.with_for_update()

        result = await self.db.execute(query)
        wallet = result.scalar_one_or_none()

        if not wallet:
            now = datetime.now(timezone.utc)
            wallet = Wallets(
                user_id=effective_owner_id,
                organization_id=org_id,
                balance=0.0,
                currency=currency_upper,
                created_at=now,
                updated_at=now,
            )
            self.db.add(wallet)
            await self.db.flush()
            if lock:
                # Re-fetch with lock to be absolutely sure
                return await self.get_or_create_wallet(effective_owner_id, currency_upper, lock=True)
            logger.info(f"Created new {currency_upper} wallet for owner {effective_owner_id}")

        return wallet

    async def get_or_create_organization_wallet(
        self, organization_id: str, currency: str = "PHP", lock: bool = False
    ) -> Wallets:
        """Get or create the dedicated organization wallet row."""
        if not organization_id:
            raise ValueError("organization_id is required")

        normalized_org_id = organization_id.strip()
        currency_upper = currency.upper()
        org_wallet_user_id = f"org:{normalized_org_id}"

        query = select(Wallets).where(
            Wallets.user_id == org_wallet_user_id,
            Wallets.currency == currency_upper,
        )
        if lock:
            query = query.with_for_update()

        result = await self.db.execute(query)
        wallet = result.scalar_one_or_none()
        if wallet:
            return wallet

        now = datetime.now(timezone.utc)
        wallet = Wallets(
            user_id=org_wallet_user_id,
            organization_id=normalized_org_id,
            balance=0.0,
            available_balance=0.0,
            pending_balance=0.0,
            currency=currency_upper,
            created_at=now,
            updated_at=now,
        )
        self.db.add(wallet)
        await self.db.flush()
        if lock:
            return await self.get_or_create_organization_wallet(normalized_org_id, currency_upper, lock=True)
        return wallet

    async def credit_wallet(
        self,
        user_id: str,
        amount: float,
        currency: str,
        transaction_type: str,
        reference_id: str,
        note: str = "",
        is_available: bool = True
    ) -> Wallets:
        """Atomic credit to wallet with transaction logging."""
        if amount <= 0:
            raise ValueError("Credit amount must be positive")

        wallet = await self.get_or_create_wallet(user_id, currency, lock=True)
        await self._ensure_wallet_active(wallet, "receive credits")

        balance_before = wallet.balance
        amount = round(amount, 2)

        # Update balance fields
        wallet.balance = round(wallet.balance + amount, 2)
        if is_available:
            wallet.available_balance = round(wallet.available_balance + amount, 2)
        else:
            wallet.pending_balance = round(wallet.pending_balance + amount, 2)

        # Update metadata
        wallet.total_credits = round((wallet.total_credits or 0.0) + amount, 2)
        wallet.transaction_count = (wallet.transaction_count or 0) + 1
        wallet.last_activity = datetime.now(timezone.utc)
        wallet.updated_at = datetime.now(timezone.utc)

        # Log transaction
        txn = Wallet_transactions(
            user_id=wallet.user_id,
            wallet_id=wallet.id,
            transaction_type=transaction_type,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            status="completed",
            reference_id=reference_id,
            note=note,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(txn)

        await self.db.flush()
        return wallet

    async def debit_wallet(
        self,
        user_id: str,
        amount: float,
        currency: str,
        transaction_type: str,
        reference_id: str,
        note: str = "",
        check_liquidity: bool = True
    ) -> Wallets:
        """Atomic debit from wallet with liquidity check."""
        if amount <= 0:
            raise ValueError("Debit amount must be positive")

        wallet = await self.get_or_create_wallet(user_id, currency, lock=True)
        await self._ensure_wallet_active(wallet, "perform withdrawals/payments")

        amount = round(amount, 2)

        if check_liquidity and wallet.available_balance < amount:
            raise ValueError(f"Insufficient available balance (Available: {currency} {wallet.available_balance:,.2f})")

        balance_before = wallet.balance

        # Update balance fields
        wallet.balance = round(wallet.balance - amount, 2)
        wallet.available_balance = round(wallet.available_balance - amount, 2)

        # Update metadata
        wallet.total_debits = round((wallet.total_debits or 0.0) + amount, 2)
        wallet.transaction_count = (wallet.transaction_count or 0) + 1
        wallet.last_activity = datetime.now(timezone.utc)
        wallet.updated_at = datetime.now(timezone.utc)

        # Log transaction
        txn = Wallet_transactions(
            user_id=wallet.user_id,
            wallet_id=wallet.id,
            transaction_type=transaction_type,
            amount=-amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            status="completed",
            reference_id=reference_id,
            note=note,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(txn)

        await self.db.flush()
        return wallet

    async def get_balance(self, user_id: str, currency: str = "PHP") -> Dict[str, Any]:
        """Get wallet balance. For USD, it ensures the balance field is synced with history."""
        currency_upper = currency.upper()
        effective_user_id = await self._resolve_effective_wallet_user_id(user_id, currency_upper)

        if currency_upper == "USD":
            computed = await self.compute_usd_balance(effective_user_id)
            wallet = await self.get_or_create_wallet(effective_user_id, "USD")

            if abs(computed - wallet.balance) > 0.001:
                wallet.balance = computed
                wallet.updated_at = datetime.now(timezone.utc)
                await self.db.commit()
                await self.db.refresh(wallet)

            return {
                "wallet_id": wallet.id,
                "balance": wallet.balance,
                "available_balance": wallet.available_balance,
                "pending_balance": wallet.pending_balance,
                "currency": "USD"
            }

        wallet = await self.get_or_create_wallet(effective_user_id, currency_upper)
        return {
            "wallet_id": wallet.id,
            "balance": wallet.balance,
            "available_balance": wallet.available_balance,
            "pending_balance": wallet.pending_balance,
            "currency": currency_upper
        }

    async def compute_usd_balance(self, user_id: Any) -> float:
        """Compute completed USD balance from the wallet transaction ledger."""
        effective_user_id = await self._resolve_effective_wallet_user_id(
            self._normalize_user_id(user_id), "USD"
        )
        result = await self.db.execute(
            select(func.coalesce(func.sum(Wallet_transactions.amount), 0.0))
            .join(Wallets, Wallets.id == Wallet_transactions.wallet_id)
            .where(
                Wallet_transactions.user_id == effective_user_id,
                Wallets.currency == "USD",
                Wallet_transactions.status == "completed",
                Wallet_transactions.transaction_type.in_(_USD_CREDIT_TYPES + _USD_DEBIT_TYPES),
            )
        )
        return round(float(result.scalar() or 0.0), 2)

    async def transfer(self, sender_user_id: str, recipient_identifier: str, amount: float, note: str = "", currency: str = "PHP") -> Dict[str, Any]:
        """Perform an internal transfer between users using available liquidity."""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        currency_upper = currency.upper()

        # 1. Resolve recipient
        recipient_identifier = recipient_identifier.strip().lstrip("@")
        res = await self.db.execute(
            select(AdminUser).where(
                (func.lower(AdminUser.telegram_username) == recipient_identifier.lower()) |
                (AdminUser.telegram_id == recipient_identifier)
            )
        )
        recipient_admin = res.scalar_one_or_none()
        if not recipient_admin:
            raise ValueError(f"Recipient '{recipient_identifier}' not found.")

        recipient_id = str(recipient_admin.telegram_id)

        # 2. Resolve effective owners
        sender_effective, _ = await self._resolve_effective_wallet_owner(sender_user_id)
        recipient_effective, _ = await self._resolve_effective_wallet_owner(recipient_id)

        if sender_effective == recipient_effective:
            raise ValueError("Cannot send money to yourself or within the same organization")

        # 3. Perform atomic operations
        ref_id = f"trf-{uuid.uuid4().hex[:8]}"

        # Debit sender
        await self.debit_wallet(
            user_id=sender_user_id,
            amount=amount,
            currency=currency_upper,
            transaction_type="send" if currency_upper == "PHP" else "usd_send",
            reference_id=ref_id,
            note=note or f"Transfer to {recipient_identifier}",
            check_liquidity=True
        )

        # Credit recipient
        await self.credit_wallet(
            user_id=recipient_id,
            amount=amount,
            currency=currency_upper,
            transaction_type="receive" if currency_upper == "PHP" else "usd_receive",
            reference_id=ref_id,
            note=note or f"Transfer from {sender_user_id}",
            is_available=True
        )

        await self.db.commit()

        # 4. Notify both parties
        # (Wallet events are emitted via publish_wallet_event)
        
        return {
            "success": True,
            "reference_id": ref_id,
            "recipient_name": recipient_admin.name or recipient_identifier
        }

    async def withdraw_request(self, user_id: str, amount: float, bank_name: str, account_number: str, account_name: str, note: str = "") -> Dict[str, Any]:
        """Submit a withdrawal request against available liquidity."""
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Lock wallet for withdrawal processing
        effective_user_id = await self._resolve_effective_wallet_user_id(user_id, "PHP")
        wallet = await self.get_or_create_wallet(effective_user_id, "PHP", lock=True)
        await self._ensure_wallet_active(wallet, "submit a withdrawal request")

        current_balance = float(wallet.balance or 0.0)
        if current_balance < PHP_SECURITY_DEPOSIT_MIN:
            raise ValueError(
                "Withdrawal/disbursement denied: account balance is below the required "
                f"security deposit of PHP {PHP_SECURITY_DEPOSIT_MIN:,.2f}."
            )

        max_withdrawable_by_deposit = max(0.0, round(current_balance - PHP_SECURITY_DEPOSIT_MIN, 2))
        if amount > max_withdrawable_by_deposit:
            raise ValueError(
                "Withdrawal/disbursement denied: only the excess above the PHP 50,000.00 "
                f"security deposit is withdrawable (max available: PHP {max_withdrawable_by_deposit:,.2f})."
            )

        # Ensure liquidity check against available_balance
        if wallet.available_balance < amount:
             if wallet.available_balance == 0 and wallet.balance >= amount:
                 wallet.available_balance = wallet.balance
             else:
                 raise ValueError(f"Insufficient available liquidity (Available: ₱{wallet.available_balance:,.2f})")

        now = datetime.now(timezone.utc)
        balance_before = wallet.balance
        ext_id = f"wd-db-{uuid.uuid4().hex[:12]}"

        # 1. Create a pending Disbursement record
        disb = Disbursements(
            user_id=user_id,
            external_id=ext_id,
            amount=amount,
            currency="PHP",
            bank_code=bank_name or "Manual",
            account_number=account_number or "Manual",
            account_name=account_name or user_id,
            description=note or "Withdrawal request via Dashboard",
            status="pending",
            disbursement_type="single",
            created_at=now,
            updated_at=now,
        )
        self.db.add(disb)

        # 2. Deduct from wallet immediately (hold funds from available)
        wallet.available_balance = round(wallet.available_balance - amount, 2)
        wallet.balance = round(wallet.balance - amount, 2)
        wallet.total_debits = (wallet.total_debits or 0.0) + amount
        wallet.transaction_count = (wallet.transaction_count or 0) + 1
        wallet.last_activity = now
        wallet.updated_at = now

        txn = Wallet_transactions(
            user_id=wallet.user_id,
            wallet_id=wallet.id,
            transaction_type="withdraw",
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            recipient=f"{bank_name} {account_number}".strip() or "Bank withdrawal",
            note=note or "Bank withdrawal request",
            status="pending",
            reference_id=ext_id,
            created_at=now,
        )
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(txn)

        # 4. Notify via event bus
        await self.publish_wallet_event(user_id, wallet, "withdraw", amount, txn.id, note, skip_bot_notify=True)

        # 5. Send SMS notification (async, non-blocking)
        try:
            from services.notification_service import SMSService
            from models.admin_users import AdminUser
            
            admin_result = await self.db.execute(select(AdminUser).where(AdminUser.telegram_id == user_id))
            admin_user = admin_result.scalar_one_or_none()
            if admin_user and admin_user.mobile_number:
                asyncio.create_task(SMSService.notify_user_of_disbursement(
                    admin_user.mobile_number, amount, bank_name or "Bank", 
                    account_name or "Account", ext_id, "pending"
                ))
        except Exception as e:
            logger.warning(f"Could not send SMS notification for withdrawal: {str(e)}")

        return {
            "success": True,
            "balance": wallet.balance,
            "transaction_id": txn.id,
            "reference_id": ext_id
        }

    async def adjust_balance(self, target_user_id: str, amount: float, admin_id: str, note: str = "", currency: str = "PHP") -> Dict[str, Any]:
        """Admin credit/debit adjustment (Maximizing Manual control)."""
        if amount == 0:
            raise ValueError("Amount must be non-zero")

        currency_upper = currency.upper()

        if amount > 0:
            wallet = await self.credit_wallet(
                user_id=target_user_id,
                amount=amount,
                currency=currency_upper,
                transaction_type="admin_credit",
                reference_id=f"admin-adj-{uuid.uuid4().hex[:8]}",
                note=note or f"Admin credit by {admin_id}"
            )
            action = "credited"
        else:
            wallet = await self.debit_wallet(
                user_id=target_user_id,
                amount=abs(amount),
                currency=currency_upper,
                transaction_type="admin_debit",
                reference_id=f"admin-adj-{uuid.uuid4().hex[:8]}",
                note=note or f"Admin debit by {admin_id}",
                check_liquidity=True
            )
            action = "debited"

        await self.db.commit()
        await self.publish_wallet_event(wallet.user_id, wallet, f"admin_{action}", abs(amount), 0, note)

        return {
            "success": True,
            "balance": wallet.balance,
            "action": action
        }

    async def publish_wallet_event(self, user_id: str, wallet: Wallets, transaction_type: str, amount: float, txn_id: int, note: str = "", skip_bot_notify: bool = False):
        """Publish a wallet event to the event bus for real-time updates and notifications."""
        from services.event_bus import event_bus
        await event_bus.emit("wallet_update", {
            "user_id": user_id,
            "wallet_id": wallet.id,
            "balance": wallet.balance,
            "currency": wallet.currency or "PHP",
            "transaction_type": transaction_type,
            "amount": amount,
            "transaction_id": txn_id,
            "note": note,
            "skip_bot_notify": skip_bot_notify,
        })

    async def get_admin_username(self, wallet_user_id: str) -> Optional[str]:
        tg_id = wallet_user_id[3:] if wallet_user_id.startswith("tg-") else wallet_user_id
        result = await self.db.execute(select(AdminUser).where(AdminUser.telegram_id == tg_id))
        admin = result.scalar_one_or_none()
        return admin.telegram_username if admin else None

    async def get_usdt_stats(self) -> Dict[str, Any]:
        """Aggregate USDT settlement statistics."""

        now = datetime.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_yesterday = start_of_day - timedelta(days=1)

        # Incoming USDT today
        res_php = await self.db.execute(
            select(func.coalesce(func.sum(TopupRequest.amount_usdt), 0.0), func.count(TopupRequest.id))
            .where(TopupRequest.status == "approved", TopupRequest.created_at >= start_of_day)
        )
        row_php = res_php.one()

        res_usd = await self.db.execute(
            select(func.coalesce(func.sum(CryptoTopupRequest.amount_usdt), 0.0), func.count(CryptoTopupRequest.id))
            .where(CryptoTopupRequest.status == "approved", CryptoTopupRequest.created_at >= start_of_day)
        )
        row_usd = res_usd.one()

        settlement = float(row_php[0] or 0.0) + float(row_usd[0] or 0.0)
        txn_count = int(row_php[1] or 0) + int(row_usd[1] or 0)

        # Incoming USDT yesterday
        res_php_y = await self.db.execute(
            select(func.coalesce(func.sum(TopupRequest.amount_usdt), 0.0))
            .where(TopupRequest.status == "approved", TopupRequest.created_at >= start_of_yesterday, TopupRequest.created_at < start_of_day)
        )
        res_usd_y = await self.db.execute(
            select(func.coalesce(func.sum(CryptoTopupRequest.amount_usdt), 0.0))
            .where(CryptoTopupRequest.status == "approved", CryptoTopupRequest.created_at >= start_of_yesterday, CryptoTopupRequest.created_at < start_of_day)
        )
        yest_settlement = float(res_php_y.scalar() or 0.0) + float(res_usd_y.scalar() or 0.0)

        # Pending requests
        res_p_php = await self.db.execute(
            select(func.coalesce(func.sum(TopupRequest.amount_usdt), 0.0))
            .where(TopupRequest.status == "pending")
        )
        res_p_usd = await self.db.execute(
            select(func.coalesce(func.sum(CryptoTopupRequest.amount_usdt), 0.0))
            .where(CryptoTopupRequest.status == "pending")
        )
        pending = float(res_p_php.scalar() or 0.0) + float(res_p_usd.scalar() or 0.0)

        change = 0.0
        if yest_settlement > 0:
            change = ((settlement - yest_settlement) / yest_settlement) * 100

        return {
            "settlement": settlement,
            "txnCount": txn_count,
            "change": change,
            "pending": pending
        }

    async def freeze_wallet(self, user_id: str, reason: str = "") -> Dict[str, Any]:
        """Super admin: Freeze a user's wallet to prevent transactions."""
        wallet_php = await self.get_or_create_wallet(user_id, "PHP")
        wallet_php.is_frozen = True
        wallet_php.freeze_reason = reason or "Frozen by super admin"
        wallet_php.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        
        logger.info(f"Wallet for user {user_id} frozen: {reason}")
        return {"success": True, "wallet_id": wallet_php.id, "status": "frozen"}

    async def unfreeze_wallet(self, user_id: str) -> Dict[str, Any]:
        """Super admin: Unfreeze a user's wallet."""
        wallet_php = await self.get_or_create_wallet(user_id, "PHP")
        wallet_php.is_frozen = False
        wallet_php.freeze_reason = None
        wallet_php.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        
        logger.info(f"Wallet for user {user_id} unfrozen")
        return {"success": True, "wallet_id": wallet_php.id, "status": "active"}

    async def get_wallet_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get detailed analytics for a user's wallet(s)."""
        wallets = []
        for currency in ["PHP", "USD"]:
            try:
                wallet = await self.get_or_create_wallet(user_id, currency)
                wallets.append({
                    "id": wallet.id,
                    "currency": wallet.currency,
                    "balance": wallet.balance,
                    "available_balance": wallet.available_balance,
                    "pending_balance": wallet.pending_balance,
                    "total_credits": wallet.total_credits or 0.0,
                    "total_debits": wallet.total_debits or 0.0,
                    "transaction_count": wallet.transaction_count or 0,
                    "is_frozen": wallet.is_frozen or False,
                    "freeze_reason": wallet.freeze_reason,
                    "last_activity": wallet.last_activity,
                    "created_at": wallet.created_at,
                    "updated_at": wallet.updated_at,
                })
            except Exception as e:
                logger.error(f"Error fetching {currency} wallet analytics: {str(e)}")

        effective_user_id = await self._resolve_effective_wallet_user_id(user_id, "PHP")
        # Get recent transactions
        recent_txns = await self.db.execute(
            select(Wallet_transactions)
            .where(Wallet_transactions.user_id == effective_user_id)
            .order_by(Wallet_transactions.created_at.desc())
            .limit(10)
        )
        recent = recent_txns.scalars().all()

        return {
            "user_id": user_id,
            "wallets": wallets,
            "recent_transactions": [
                {
                    "id": txn.id,
                    "type": txn.transaction_type,
                    "amount": txn.amount,
                    "status": txn.status,
                    "created_at": txn.created_at,
                }
                for txn in recent
            ],
        }

    async def reconcile_wallet(self, user_id: str, currency: str = "PHP") -> Dict[str, Any]:
        """Super admin: Reconcile wallet balance from transaction history."""
        wallet = await self.get_or_create_wallet(user_id, currency.upper())
        
        # Recompute balance from all completed transactions
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(
                    case(
                        (Wallet_transactions.transaction_type.in_(("receive", "admin_credit", "deposit")), 
                         Wallet_transactions.amount),
                        else_=0.0,
                    )
                ), 0.0),
                func.coalesce(func.sum(
                    case(
                        (Wallet_transactions.transaction_type.in_(("send", "admin_debit", "withdraw", "payment")), 
                         Wallet_transactions.amount),
                        else_=0.0,
                    )
                ), 0.0),
            ).where(
                Wallet_transactions.wallet_id == wallet.id,
                Wallet_transactions.status == "completed",
            )
        )
        
        row = result.one()
        computed_balance = float(row[0] or 0.0) - float(row[1] or 0.0)
        difference = round(wallet.balance - computed_balance, 2)

        if abs(difference) > 0.01:
            logger.warning(f"Wallet reconciliation mismatch for {user_id}: recorded={wallet.balance}, computed={computed_balance}, diff={difference}")
            wallet.balance = round(computed_balance, 2)
            wallet.available_balance = round(computed_balance, 2)
            wallet.updated_at = datetime.now(timezone.utc)
            await self.db.commit()

        return {
            "success": True,
            "user_id": user_id,
            "currency": currency.upper(),
            "recorded_balance": wallet.balance,
            "computed_balance": computed_balance,
            "difference": difference,
            "reconciled": abs(difference) > 0.01,
        }

    async def batch_credit_wallets(self, credits: List[Dict[str, Any]], admin_id: str) -> Dict[str, Any]:
        """Super admin: Bulk credit multiple wallets."""
        results = []
        for credit in credits:
            try:
                result = await self.adjust_balance(
                    target_user_id=credit["user_id"],
                    amount=credit["amount"],
                    admin_id=admin_id,
                    note=credit.get("note", "Batch credit"),
                    currency=credit.get("currency", "PHP"),
                )
                results.append({"user_id": credit["user_id"], "success": True, **result})
            except Exception as e:
                logger.error(f"Error crediting user {credit['user_id']}: {str(e)}")
                results.append({"user_id": credit["user_id"], "success": False, "error": str(e)})

        successful = sum(1 for r in results if r["success"])
        return {
            "total": len(credits),
            "successful": successful,
            "failed": len(credits) - successful,
            "results": results,
        }

    async def update_wallet_analytics(self, wallet_id: int, transaction_amount: float, is_credit: bool):
        """Update wallet analytics after a transaction."""
        wallet = await self.db.get(Wallets, wallet_id)
        if not wallet:
            return

        wallet.total_credits = (wallet.total_credits or 0.0) + (transaction_amount if is_credit else 0.0)
        wallet.total_debits = (wallet.total_debits or 0.0) + (transaction_amount if not is_credit else 0.0)
        wallet.transaction_count = (wallet.transaction_count or 0) + 1
        wallet.last_activity = datetime.now(timezone.utc)
        wallet.updated_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def get_wallet_reconciliation_summary(self, top_limit: int = 10) -> Dict[str, Any]:
        """Produce a reconciliation summary across all wallets for admin review."""
        txn_subq = (
            select(
                Wallet_transactions.wallet_id.label("wallet_id"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                Wallet_transactions.transaction_type.in_(
                                    ("receive", "admin_credit", "deposit", "usd_receive", "crypto_topup")
                                ),
                                Wallet_transactions.amount,
                            ),
                            else_=0.0,
                        )
                    ),
                    0.0,
                ).label("credits"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                Wallet_transactions.transaction_type.in_(
                                    ("send", "admin_debit", "withdraw", "payment", "usd_send", "usdt_send")
                                ),
                                Wallet_transactions.amount,
                            ),
                            else_=0.0,
                        )
                    ),
                    0.0,
                ).label("debits"),
            )
            .where(Wallet_transactions.status == "completed")
            .group_by(Wallet_transactions.wallet_id)
            .subquery()
        )

        stmt = (
            select(
                Wallets.id,
                Wallets.user_id,
                Wallets.currency,
                Wallets.balance,
                Wallets.available_balance,
                Wallets.pending_balance,
                Wallets.is_frozen,
                Wallets.freeze_reason,
                func.coalesce(txn_subq.c.credits, 0.0).label("credits"),
                func.coalesce(txn_subq.c.debits, 0.0).label("debits"),
            )
            .outerjoin(txn_subq, Wallets.id == txn_subq.c.wallet_id)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        total_wallets = len(rows)
        mismatches = []
        for row in rows:
            wallet_id, user_id, currency, recorded, available, pending, is_frozen, freeze_reason, credits, debits = row
            computed = round(float(credits or 0.0) - float(debits or 0.0), 2)
            difference = round(float(recorded or 0.0) - computed, 2)
            if abs(difference) > 0.01:
                mismatches.append({
                    "user_id": user_id,
                    "wallet_id": wallet_id,
                    "currency": currency,
                    "recorded_balance": float(recorded or 0.0),
                    "computed_balance": computed,
                    "difference": difference,
                    "is_frozen": bool(is_frozen),
                    "freeze_reason": freeze_reason,
                })

        total_difference = round(sum(abs(item["difference"]) for item in mismatches), 2)
        average_difference = round(total_difference / len(mismatches), 2) if mismatches else 0.0
        largest_difference = round(max((abs(item["difference"]) for item in mismatches), default=0.0), 2)
        top_mismatches = sorted(mismatches, key=lambda item: abs(item["difference"]), reverse=True)[:top_limit]

        return {
            "total_wallets": total_wallets,
            "wallets_with_mismatch": len(mismatches),
            "total_difference": total_difference,
            "average_difference": average_difference,
            "largest_difference": largest_difference,
            "mismatches": top_mismatches,
        }
