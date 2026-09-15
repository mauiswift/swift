import logging
import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.wallets import Wallets
from models.currency_conversion import CurrencyConversion
from models.wallet_transactions import Wallet_transactions
from models.exchange_rate_history import ExchangeRateHistory
from models.exchange_rate_override import ExchangeRateOverride
from services import exchange_rate_service
from services.notification_service import SMSService
from services.system_earnings import credit_system_earnings
from services.app_settings import get_conversion_fee_percent
from core.constants import (
    LEDGER_CURRENCIES,
    SUPPORTED_CURRENCIES as PUBLIC_SUPPORTED_CURRENCIES,
    normalize_currency,
)

logger = logging.getLogger(__name__)

# Supported currencies
# USD remains an internal ledger alias for USDT. These are the public currencies.
SUPPORTED_CURRENCIES = list(LEDGER_CURRENCIES)


class CurrencyService:
    """Service for multi-currency wallet operations with exchange rate management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _normalize_currency_code(currency: str) -> str:
        """Canonicalize public crypto aliases to the ledger currency used internally."""
        return normalize_currency(currency, default="")

    @staticmethod
    def _validate_conversion_input(
        from_currency: str, to_currency: str, from_amount: float
    ) -> Tuple[str, str]:
        from_currency = CurrencyService._normalize_currency_code(from_currency)
        to_currency = CurrencyService._normalize_currency_code(to_currency)
        if from_currency not in SUPPORTED_CURRENCIES or to_currency not in SUPPORTED_CURRENCIES:
            raise ValueError("Unsupported currency")
        if from_amount <= 0:
            raise ValueError("Conversion amount must be greater than zero")
        return from_currency, to_currency

    @staticmethod
    def _calculate_conversion(from_amount: float, rate: float, fee_rate: float) -> Tuple[float, float]:
        pre_fee_amount = from_amount * rate
        fee_amount = pre_fee_amount * fee_rate
        return round(pre_fee_amount - fee_amount, 2), round(fee_amount, 2)

    async def get_conversion_quote(
        self,
        wallet_id: int,
        from_currency: str,
        to_currency: str,
        from_amount: float,
    ) -> Dict[str, float]:
        """Get a conversion quote with a locked rate (valid for 30 seconds).
        
        Args:
            wallet_id: Source wallet ID
            from_currency: Source currency (e.g., "USD")
            to_currency: Target currency (e.g., "PHP")
            from_amount: Amount to convert
        
        Returns:
            Dict with: from_amount, to_amount, rate, fee_amount, fee_rate, expires_at
        """
        from_currency, to_currency = self._validate_conversion_input(
            from_currency, to_currency, from_amount
        )

        if from_currency == to_currency:
            return {
                "from_amount": from_amount,
                "to_amount": from_amount,
                "rate": 1.0,
                "fee_amount": 0.0,
                "fee_rate": 0.0,
                "expires_at": datetime.now(timezone.utc).timestamp() + 30,
            }

        # Get current rate
        pair = f"{from_currency}_{to_currency}"

        # Check for admin override first so tests and manual overrides work even
        # when the live provider does not support the pair.
        override = await self._get_active_override(pair)
        if override:
            rate = override.override_rate
            logger.info(f"Using overridden rate for {pair}: {rate}")
        else:
            try:
                rate = await exchange_rate_service.get_rate(pair)
            except RuntimeError:
                raise ValueError(f"Cannot get rate for {pair}")

        # Calculate conversion
        fee_rate = (await get_conversion_fee_percent(self.db)) / 100.0
        to_amount, fee_amount = self._calculate_conversion(from_amount, rate, fee_rate)

        return {
            "from_amount": from_amount,
            "to_amount": round(to_amount, 2),
            "rate": round(rate, 6),
            "fee_amount": round(fee_amount, 2),
            "fee_rate": fee_rate,
            "expires_at": datetime.now(timezone.utc).timestamp() + 30,
        }

    async def convert_currency(
        self,
        from_wallet: Wallets,
        to_wallet: Wallets,
        from_amount: float,
        user_id: str,
        mobile_number: Optional[str] = None,
        *,
        rate: Optional[float] = None,
    ) -> CurrencyConversion:
        """Convert funds between two currency wallets (atomic operation).
        
        Args:
            from_wallet: Source wallet (already locked)
            to_wallet: Target wallet (already locked)
            from_amount: Amount to convert (from source currency)
            user_id: User ID for audit trail
            mobile_number: Optional phone number for SMS notification
        
        Returns:
            CurrencyConversion record
        
        Raises:
            ValueError: If wallets are same currency or insufficient balance
        """
        from_currency, to_currency = self._validate_conversion_input(
            from_wallet.currency, to_wallet.currency, from_amount
        )

        if not math.isfinite(from_amount):
            raise ValueError("Conversion amount must be finite")

        if from_currency == to_currency:
            raise ValueError("same currency: Source and target currencies must be different")

        if from_wallet.is_frozen:
            raise ValueError("Source wallet is frozen and cannot convert funds")
        if to_wallet.is_frozen:
            raise ValueError("Target wallet is frozen and cannot receive converted funds")

        if from_wallet.available_balance < from_amount:
            raise ValueError(
                f"Insufficient balance: {from_wallet.available_balance} < {from_amount}"
            )

        # Use the validated quote when supplied so the amount shown to the user
        # matches the amount committed to both wallets.
        pair = f"{from_currency}_{to_currency}"
        if rate is None:
            override = await self._get_active_override(pair)
            if override:
                rate = override.override_rate
            else:
                try:
                    rate = await exchange_rate_service.get_rate(pair)
                except RuntimeError as e:
                    raise ValueError(f"Cannot get exchange rate: {e}")
        if not math.isfinite(rate) or rate <= 0:
            raise ValueError("Exchange rate must be a positive finite number")

        # Calculate amounts
        fee_rate = (await get_conversion_fee_percent(self.db)) / 100.0
        to_amount, fee_amount = self._calculate_conversion(from_amount, rate, fee_rate)

        # Update source wallet
        from_wallet.balance = round(from_wallet.balance - from_amount, 2)
        from_wallet.available_balance = round(
            from_wallet.available_balance - from_amount, 2
        )
        from_wallet.total_debits = round(from_wallet.total_debits + from_amount, 2)
        from_wallet.transaction_count += 1
        from_wallet.conversion_count += 1
        from_wallet.last_activity = datetime.now(timezone.utc)

        # Update target wallet
        to_wallet.balance = round(to_wallet.balance + to_amount, 2)
        to_wallet.available_balance = round(to_wallet.available_balance + to_amount, 2)
        to_wallet.total_credits = round(to_wallet.total_credits + to_amount, 2)
        to_wallet.transaction_count += 1
        to_wallet.conversion_count += 1
        to_wallet.last_activity = datetime.now(timezone.utc)

        # Create conversion record
        now = datetime.now(timezone.utc)
        reference_id = f"conversion-{uuid.uuid4().hex}"
        conversion = CurrencyConversion(
            wallet_id=from_wallet.id,
            user_id=user_id,
            from_currency=from_currency,
            to_currency=to_currency,
            from_amount=from_amount,
            to_amount=round(to_amount, 2),
            rate_applied=round(rate, 6),
            conversion_fee_rate=fee_rate,
            conversion_fee_amount=round(fee_amount, 2),
            status="completed",
            reference_id=reference_id,
            created_at=now,
            updated_at=now,
        )

        self.db.add(conversion)
        self.db.add_all([
            Wallet_transactions(
                user_id=from_wallet.user_id,
                wallet_id=from_wallet.id,
                transaction_type="conversion_out",
                amount=-round(from_amount, 2),
                balance_before=round(from_wallet.balance + from_amount, 2),
                balance_after=from_wallet.balance,
                status="completed",
                reference_id=reference_id,
                note=f"Converted to {to_currency}",
                created_at=now,
            ),
            Wallet_transactions(
                user_id=to_wallet.user_id,
                wallet_id=to_wallet.id,
                transaction_type="conversion_in",
                amount=round(to_amount, 2),
                balance_before=round(to_wallet.balance - to_amount, 2),
                balance_after=to_wallet.balance,
                status="completed",
                reference_id=reference_id,
                note=f"Converted from {from_currency}",
                created_at=now,
            ),
        ])
        await self.db.flush()

        await credit_system_earnings(
            db=self.db,
            amount=fee_amount,
            currency=to_currency,
            reference_id=f"conversion-{conversion.id}-fee",
            note=f"Currency conversion earnings ({fee_rate * 100:.2f}%): {fee_amount:,.2f} {to_currency}",
        )

        # Track rate in history
        await self._record_rate_history(pair, rate, "system")

        # Send SMS notification
        if mobile_number:
            try:
                message = (
                    f"Currency conversion confirmed: {from_amount} {from_currency} → "
                    f"{to_amount} {to_currency} at rate {rate:.4f}. "
                    f"Fee: {fee_amount} {to_currency}."
                )
                await SMSService.send_sms(mobile_number, message)
            except Exception as e:
                logger.error(f"Failed to send conversion SMS: {e}")

        logger.info(
            f"Converted {from_amount} {from_currency} → {to_amount} "
            f"{to_currency} for user {user_id}"
        )

        return conversion

    async def set_rate_override(
        self,
        currency_pair: str,
        override_rate: float,
        reason: str,
        created_by: str,
        expires_at: Optional[datetime] = None,
    ) -> ExchangeRateOverride:
        """Set an admin override for an exchange rate.
        
        Args:
            currency_pair: Currency pair (e.g., "USDT_PHP")
            override_rate: Override rate to use
            reason: Reason for override
            created_by: Admin user ID
            expires_at: Optional expiration time
        
        Returns:
            ExchangeRateOverride record
        """
        # Backwards-compatibility: older callers passed signature
        # (from_currency, to_currency, rate, expires_at, created_by)
        # Detect that form when `currency_pair` looks like a single currency code
        # (no underscore) and the second arg is also a currency code string while
        # the third arg is numeric (the rate).
        now = datetime.now(timezone.utc)

        # Normalize inputs to new internal shape: currency_pair (X_Y), override_rate (float), created_by, expires_at
        # Heuristic detection for legacy positional signature
        is_legacy = (
            isinstance(currency_pair, str)
            and "_" not in currency_pair
            and isinstance(override_rate, str)
            and isinstance(reason, (int, float))
        )

        if is_legacy:
            from_currency = currency_pair
            to_currency = override_rate
            rate_val = float(reason)
            expires_val = created_by if isinstance(created_by, datetime) else None
            created_by_val = expires_at if isinstance(expires_at, str) else "admin"
            pair = f"{from_currency}_{to_currency}"
        else:
            pair = currency_pair
            try:
                rate_val = float(override_rate)
            except Exception:
                # If conversion fails, log and fallback to 0.0 to avoid crashing
                logger.warning(f"Invalid override_rate provided: {override_rate}; falling back to 0.0")
                rate_val = 0.0
            created_by_val = created_by
            expires_val = expires_at

        override = ExchangeRateOverride(
            currency_pair=pair,
            override_rate=rate_val,
            reason=reason if not isinstance(reason, (int, float)) else str(reason),
            created_by=created_by_val,
            expires_at=expires_val,
            created_at=now,
            updated_at=now,
        )
        self.db.add(override)
        await self.db.flush()

        logger.info(
            f"Rate override set for {currency_pair}: {override_rate} "
            f"(reason: {reason})"
        )

        # Record in history
        await self._record_rate_history(
            currency_pair, override_rate, f"admin_override:{reason}"
        )

        return override

    async def remove_rate_override(
        self, from_currency: str, to_currency: str
    ) -> bool:
        """Remove a rate override for a currency pair.
        
        Args:
            from_currency: Source currency
            to_currency: Target currency

        Returns:
            bool: True if removed, False if not found
        """
        pair = f"{from_currency}_{to_currency}"
        query = select(ExchangeRateOverride).where(
            ExchangeRateOverride.currency_pair == pair
        )
        result = await self.db.execute(query)
        override = result.scalar_one_or_none()

        if not override:
            return False

        await self.db.delete(override)
        logger.info(f"Removed rate override for {pair}")
        return True

    async def remove_rate_override_by_id(self, override_id: int) -> None:
        """Remove a rate override by ID.

        Args:
            override_id: Override record ID
        """
        query = select(ExchangeRateOverride).where(
            ExchangeRateOverride.id == override_id
        )
        result = await self.db.execute(query)
        override = result.scalar_one_or_none()

        if not override:
            raise ValueError(f"Override not found: {override_id}")

        await self.db.delete(override)
        logger.info(f"Removed rate override: {override_id}")

    async def get_rate_stats(
        self, currency_pair: str, days: int = 7
    ) -> Dict[str, float]:
        """Get exchange rate statistics for a currency pair.
        
        Args:
            currency_pair: Currency pair (e.g., "USDT_PHP")
            days: Number of days to analyze
        
        Returns:
            Dict with: current, min, max, avg, volatility (std dev)
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=days)

        query = select(ExchangeRateHistory).where(
            and_(
                ExchangeRateHistory.currency_pair == currency_pair,
                ExchangeRateHistory.recorded_at >= cutoff_time,
            )
        ).order_by(ExchangeRateHistory.recorded_at)

        result = await self.db.execute(query)
        records = result.scalars().all()

        if not records:
            try:
                current = await exchange_rate_service.get_rate(currency_pair)
            except RuntimeError:
                current = 0.0

            return {
                "current": current,
                "min": current,
                "max": current,
                "avg": current,
                "volatility": 0.0,
                "data_points": 0,
            }

        rates = [r.rate for r in records]
        current_rate = rates[-1] if rates else 0.0

        avg_rate = sum(rates) / len(rates) if rates else 0.0

        # Calculate standard deviation (volatility)
        variance = (
            sum((r - avg_rate) ** 2 for r in rates) / len(rates) if rates else 0.0
        )
        volatility = variance ** 0.5

        return {
            "current": round(current_rate, 6),
            "min": round(min(rates), 6),
            "max": round(max(rates), 6),
            "avg": round(avg_rate, 6),
            "volatility": round(volatility, 6),
            "data_points": len(rates),
        }

    async def get_supported_currencies(self) -> List[str]:
        """Get list of supported currencies."""
        return list(PUBLIC_SUPPORTED_CURRENCIES)

    async def _get_active_override(
        self, currency_pair: str
    ) -> Optional[ExchangeRateOverride]:
        """Get active (non-expired) override for a currency pair."""
        now = datetime.now(timezone.utc)
        query = select(ExchangeRateOverride).where(
            and_(
                ExchangeRateOverride.currency_pair == currency_pair,
                ExchangeRateOverride.expires_at > now,
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def _record_rate_history(
        self, currency_pair: str, rate: float, source: str
    ) -> None:
        """Record rate in history for analytics."""
        try:
            now = datetime.now(timezone.utc)
            # Ensure rate is numeric; coerce and fallback on error to avoid
            # causing DB-level exceptions that roll back the session.
            try:
                numeric_rate = float(rate)
            except Exception:
                logger.warning(f"Non-numeric rate recorded: {rate}; using 0.0")
                numeric_rate = 0.0

            history = ExchangeRateHistory(
                currency_pair=currency_pair,
                rate=numeric_rate,
                provider="system",
                source=source,
                recorded_at=now,
                created_at=now,
                updated_at=now,
            )
            self.db.add(history)
            await self.db.flush()
        except Exception as e:
            logger.error(f"Failed to record rate history: {e}")
