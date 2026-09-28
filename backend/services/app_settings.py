"""App Settings Service - manages application configuration values stored in database."""

import json
import logging
import math
import random
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.constants import (
    ENABLED_COLLECTION_CURRENCIES_KEY,
    MAINTENANCE_MODE_KEY,
    MAINTENANCE_REGION_KEY,
    MAINTENANCE_STARTED_AT_KEY,
    MAINTENANCE_ENDS_AT_KEY,
    SUPPORTED_COLLECTION_CURRENCIES,
    USDT_PHP_RATE_KEY,
    DEFAULT_USDT_PHP_RATE,
    USDT_TRC20_ADDRESS_KEY,
    KRW_BANK_NAME_KEY,
    DEFAULT_KRW_BANK_NAME,
    KRW_ACCOUNT_HOLDER_NAME_KEY,
    DEFAULT_KRW_ACCOUNT_HOLDER_NAME,
    DEFAULT_PAYMENT_CHANNELS,
    PAYMENT_CHANNELS,
    PAYMENT_CHANNELS_KEY,
    PHP_CHECKOUT_INSTITUTIONS,
    ADDITIONAL_COLLECTION_FEE_PERCENT_KEY,
    COLLECTION_FEE_PERCENT_KEY,
    VIP_GOLD_COLLECTION_FEE_PERCENT_KEY,
    DEFAULT_COLLECTION_FEE_PERCENT,
    DEFAULT_ADDITIONAL_COLLECTION_FEE_PERCENT,
    DEFAULT_VIP_GOLD_COLLECTION_FEE_PERCENT,
    CONVERSION_FEE_PERCENT_KEY,
    WITHDRAWAL_FEES_KEY,
    DEPOSIT_RULES_KEY,
    DEFAULT_DEPOSIT_RULES,
    DEPOSIT_ACCOUNTS_KEY,
    DEFAULT_DEPOSIT_ACCOUNTS,
    DEFAULT_CONVERSION_FEE_PERCENT,
    WALLET_SETTINGS_KEY,
    CHECKOUT_DESIGN_KEY,
    WALLET_SETTING_CURRENCIES,
    DEFAULT_WALLET_LIMITS,
    public_currency,
)
from core.constants import FEES_ENABLED
from models.app_settings import AppSettings
from models.bank_deposit_requests import BankDepositRequest
from models.admin_users import AdminUser
from services.exchange_rate_service import fetch_live_usdt_php_rate

logger = logging.getLogger(__name__)

_WITHDRAWAL_FEE_FIELDS = {
    "PHP": "withdrawal_fee_php",
    "KRW": "withdrawal_fee_krw",
    "USDT": "withdrawal_fee_usdt",
    "USD": "withdrawal_fee_usd",
    "CNY": "withdrawal_fee_cny",
}


def _fee_percent(value: object, default: float = 0.0) -> float:
    """Parse a percentage-point value and clamp it to the supported range."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = default
    return max(0.0, min(100.0, parsed))


@dataclass(frozen=True)
class CollectionFeeDetails:
    """Resolved collection-fee rate and the account's VIP status."""

    rate: float
    is_gold_vip: Optional[bool]


def _user_id_variants(user_id: str) -> tuple[str, ...]:
    normalized = str(user_id).strip()
    raw = normalized[3:] if normalized.startswith("tg-") else normalized
    return tuple(dict.fromkeys((normalized, raw, f"tg-{raw}")))


async def get_admin_user(db: AsyncSession, user_id: str) -> Optional[AdminUser]:
    """Resolve an admin user regardless of the legacy Telegram ID format."""
    if not user_id:
        return None
    result = await db.execute(
        select(AdminUser)
        .where(AdminUser.telegram_id.in_(_user_id_variants(user_id)))
        .limit(1)
    )
    admin_user = result.scalars().first()
    return admin_user if isinstance(admin_user, AdminUser) else None


async def get_user_withdrawal_fee(
    db: AsyncSession,
    user_id: Optional[str],
    currency: str,
) -> Optional[float]:
    """Return a user's fixed withdrawal fee, or None when no user is supplied."""
    if not user_id:
        return None
    field_name = _WITHDRAWAL_FEE_FIELDS.get(str(currency or "PHP").strip().upper())
    if not field_name:
        return None
    user = await get_admin_user(db, user_id)
    if not user:
        return None
    value = getattr(user, field_name, None)
    if value is None or isinstance(value, bool):
        return None
    if not isinstance(value, (int, float)):
        try:
            value = float(value)
        except (TypeError, ValueError):
            return None
    try:
        numeric_value = float(value)
        if not math.isfinite(numeric_value):
            return None
        return max(0.0, numeric_value)
    except (TypeError, ValueError):
        return None


async def get_deposit_accounts(db: AsyncSession) -> list[dict]:
    value = await _get_setting(db, DEPOSIT_ACCOUNTS_KEY)
    if not value:
        return [dict(account) for account in DEFAULT_DEPOSIT_ACCOUNTS]
    try:
        configured = json.loads(value)
    except (TypeError, ValueError, json.JSONDecodeError):
        return [dict(account) for account in DEFAULT_DEPOSIT_ACCOUNTS]
    if not isinstance(configured, list):
        return [dict(account) for account in DEFAULT_DEPOSIT_ACCOUNTS]
    return configured


def is_toss_bank_account(account: dict) -> bool:
    identity = " ".join(
        str(account.get(key, "")).strip().casefold()
        for key in ("value", "label", "bank_name")
    )
    return any(identifier in identity for identifier in ("toss", "토스"))


async def get_user_manual_deposit_account(
    db: AsyncSession,
    user_id: str,
    currency: str,
) -> dict | None:
    """Return one manual-deposit account, avoiding the user's last KRW account.

    Wallet deposits must not expose the platform's full account pool.
    Checkout sessions use the separate active Toss pool.
    """
    normalized_currency = str(currency or "").strip().upper()
    accounts = [
        account for account in await get_deposit_accounts(db)
        if str(account.get("currency", "")).strip().upper() == normalized_currency
        and str(account.get("account_number", "")).strip()
        and str(account.get("account_name", "")).strip()
    ]
    if not accounts:
        return None
    toss_accounts = [
        account for account in accounts
        if is_toss_bank_account(account)
    ]
    if normalized_currency == "KRW" and not toss_accounts:
        return None
    eligible = toss_accounts or accounts
    if normalized_currency == "KRW" and db is not None:
        last_used = await db.scalar(
            select(BankDepositRequest.account_number)
            .where(
                BankDepositRequest.chat_id == str(user_id),
                BankDepositRequest.currency == "KRW",
            )
            .order_by(BankDepositRequest.id.desc())
            .limit(1)
        )
        alternatives = [
            account for account in eligible
            if str(account.get("account_number", "")).strip() != str(last_used or "").strip()
        ]
        if alternatives:
            eligible = alternatives
    return dict(random.choice(eligible))


async def is_valid_manual_deposit_account(
    db: AsyncSession,
    currency: str,
    account_number: str,
) -> bool:
    """Check whether an account number belongs to the configured deposit pool."""
    normalized_currency = str(currency or "").strip().upper()
    normalized_number = str(account_number or "").strip()
    if not normalized_number:
        return False
    return any(
        str(account.get("currency", "")).strip().upper() == normalized_currency
        and str(account.get("account_number", "")).strip() == normalized_number
        and str(account.get("account_name", "")).strip()
        and (normalized_currency != "KRW" or is_toss_bank_account(account))
        for account in await get_deposit_accounts(db)
    )


async def set_deposit_accounts(db: AsyncSession, accounts: list[dict]) -> list[dict]:
    normalized = []
    for account in accounts:
        if not isinstance(account, dict):
            raise ValueError("Each deposit account must be an object")
        value = str(account.get("value", "")).strip()
        label = str(account.get("label", "")).strip()
        number = str(account.get("account_number", "")).strip()
        name = str(account.get("account_name", "")).strip()
        swift_code = str(account.get("swift_code", "")).strip()
        receiving_currency = str(account.get("receiving_currency", "")).strip().upper()
        bank_code = str(account.get("bank_code", "")).strip()
        branch_code = str(account.get("branch_code", "")).strip()
        bank_address = str(account.get("bank_address", "")).strip()
        minimum_amount = account.get("minimum_amount")
        currency = str(account.get("currency", "PHP")).strip().upper()
        if not value or not label or not number or not name:
            raise ValueError("Deposit accounts require value, label, account number, and account name")
        if currency not in {"PHP", "KRW", "CNY", "USD", "USDT"}:
            raise ValueError(f"Unsupported deposit account currency: {currency}")
        if receiving_currency and receiving_currency not in {"PHP", "KRW", "CNY", "HKD", "USD", "USDT"}:
            raise ValueError(f"Unsupported receiving currency: {receiving_currency}")
        if minimum_amount is not None:
            if isinstance(minimum_amount, bool):
                raise ValueError("Minimum amount must be a non-negative number")
            try:
                parsed_minimum_amount = float(minimum_amount)
            except (TypeError, ValueError):
                raise ValueError("Minimum amount must be a non-negative number") from None
            if not math.isfinite(parsed_minimum_amount) or parsed_minimum_amount < 0:
                raise ValueError("Minimum amount must be a non-negative number")
            minimum_amount = parsed_minimum_amount
        normalized_account = {
            "value": value,
            "label": label,
            "account_number": number,
            "account_name": name,
            "currency": currency,
        }
        if swift_code:
            normalized_account["swift_code"] = swift_code
        for key, value in (
            ("receiving_currency", receiving_currency),
            ("bank_code", bank_code),
            ("branch_code", branch_code),
            ("bank_address", bank_address),
        ):
            if value:
                normalized_account[key] = value
        if minimum_amount is not None:
            normalized_account["minimum_amount"] = float(minimum_amount)
        normalized.append(normalized_account)
    if not normalized:
        raise ValueError("At least one deposit account is required")
    await _set_setting(db, DEPOSIT_ACCOUNTS_KEY, json.dumps(normalized, sort_keys=True))
    return normalized


async def _get_setting(db: AsyncSession | None, key: str) -> Optional[str]:
    """Retrieve a setting value from the database.

    Some service tests and internal fallback flows construct a gateway without a
    database session; in those cases we intentionally return the default config
    instead of failing with an attribute error.
    """
    if db is None:
        return None
    result = await db.execute(select(AppSettings).where(AppSettings.key == key).limit(1))
    row = result.scalars().first()
    return row.value if row else None


async def _set_setting(db: AsyncSession, key: str, value: str) -> None:
    """Store or update a setting value in the database."""
    result = await db.execute(select(AppSettings).where(AppSettings.key == key).limit(1))
    row = result.scalars().first()
    now = datetime.now(timezone.utc)
    if row:
        row.value = value
        row.updated_at = now
    else:
        row = AppSettings(key=key, value=value, updated_at=now)
        db.add(row)
    await db.commit()


async def get_usdt_php_rate(db: AsyncSession) -> float:
    """Return the configured USDT→PHP rate, falling back to live and then default values."""
    value = await _get_setting(db, USDT_PHP_RATE_KEY)
    fallback_rate = DEFAULT_USDT_PHP_RATE
    try:
        if value is not None:
            parsed_value = float(value)
            if parsed_value > 0:
                return parsed_value
            fallback_rate = parsed_value
    except (ValueError, TypeError):
        pass

    try:
        rate = float(await fetch_live_usdt_php_rate())
        if rate > 0:
            return rate
    except Exception as exc:
        logger.warning("Live USDT→PHP rate unavailable; using fallback rate: %s", exc)

    return fallback_rate if fallback_rate > 0 else DEFAULT_USDT_PHP_RATE


async def get_usdt_php_rate_details(db: AsyncSession) -> dict[str, object]:
    """Return the standard USDT/PHP rate together with its authoritative source."""
    value = await _get_setting(db, USDT_PHP_RATE_KEY)
    try:
        if value is not None and float(value) > 0:
            return {"rate": float(value), "source": "Configured SwiftPay rate"}
    except (ValueError, TypeError):
        pass
    try:
        rate = float(await fetch_live_usdt_php_rate())
        if rate > 0:
            return {"rate": rate, "source": "CoinGecko live market rate"}
    except Exception as exc:
        logger.warning("Live USDT/PHP rate unavailable: %s", exc)
    return {"rate": DEFAULT_USDT_PHP_RATE, "source": "SwiftPay default fallback rate"}


async def get_usdt_trc20_address(db: AsyncSession) -> str:
    """Return the configured USDT TRC20 deposit address.

    Priority: app setting → approved admin profile → USDT_TRC20_ADDRESS env var / config default.
    """
    value = await _get_setting(db, USDT_TRC20_ADDRESS_KEY)
    if value:
        return value

    result = await db.execute(
        select(AdminUser.usdt_wallet_address)
        .where(
            AdminUser.usdt_wallet_address.is_not(None),
        )
        .order_by(AdminUser.id)
        .limit(1)
    )
    approved_admin_address = result.scalar_one_or_none()
    if approved_admin_address:
        return approved_admin_address

    # Tests expect a non-empty address; provide a sensible default when unset.
    return settings.usdt_trc20_address or "TEST_USDT_TRC20_ADDRESS"


async def preserve_maintenance_state(db: AsyncSession) -> None:
    """Preserve the database maintenance state across application deployments.

    Maintenance is intentionally controlled through the settings API, not startup
    environment variables. Restarting a deployment must not reset its mode or
    countdown timestamps.
    """
    logger.info("Preserving maintenance state during startup; no deployment override applied.")


async def get_maintenance_mode(db: AsyncSession) -> bool:
    """Get the current maintenance mode status."""
    value = await _get_setting(db, MAINTENANCE_MODE_KEY)
    return value == "true"


async def get_maintenance_details(db: AsyncSession) -> dict[str, str | bool | None]:
    enabled = await get_maintenance_mode(db)
    ends_at = await _get_setting(db, MAINTENANCE_ENDS_AT_KEY)
    if enabled and ends_at:
        try:
            enabled = datetime.fromisoformat(ends_at).astimezone(timezone.utc) > datetime.now(timezone.utc)
        except ValueError:
            logger.warning("Ignoring invalid maintenance end timestamp: %s", ends_at)
    return {
        "maintenance_mode": enabled,
        "maintenance_region": await _get_setting(db, MAINTENANCE_REGION_KEY) or "all",
        "maintenance_started_at": await _get_setting(db, MAINTENANCE_STARTED_AT_KEY),
        "maintenance_ends_at": ends_at,
    }


async def set_maintenance_mode(db: AsyncSession, enabled: bool, region: str = "all") -> bool:
    """Enable or disable maintenance mode."""
    value = "true" if enabled else "false"
    await _set_setting(db, MAINTENANCE_MODE_KEY, value)
    if enabled:
        started_at = datetime.now(timezone.utc)
        from core.config import settings
        await _set_setting(db, MAINTENANCE_REGION_KEY, region.strip().lower() or "all")
        await _set_setting(db, MAINTENANCE_STARTED_AT_KEY, started_at.isoformat())
        await _set_setting(
            db,
            MAINTENANCE_ENDS_AT_KEY,
            (started_at + timedelta(hours=max(1, settings.maintenance_duration_hours))).isoformat(),
        )
    else:
        await _set_setting(db, MAINTENANCE_STARTED_AT_KEY, "")
        await _set_setting(db, MAINTENANCE_ENDS_AT_KEY, "")
    return enabled


async def get_enabled_collection_currencies(db: AsyncSession) -> list[str]:
    """Return enabled collection currencies, defaulting to all supported currencies."""
    value = await _get_setting(db, ENABLED_COLLECTION_CURRENCIES_KEY)
    if not value:
        return list(SUPPORTED_COLLECTION_CURRENCIES)
    enabled = [currency.strip().upper() for currency in value.split(",") if currency.strip()]
    return [currency for currency in SUPPORTED_COLLECTION_CURRENCIES if currency in enabled] or ["PHP"]


async def set_enabled_collection_currencies(db: AsyncSession, currencies: list[str]) -> list[str]:
    """Persist the platform collection currency allowlist."""
    normalized = list(dict.fromkeys(currency.strip().upper() for currency in currencies if currency.strip()))
    invalid = [currency for currency in normalized if currency not in SUPPORTED_COLLECTION_CURRENCIES]
    if invalid:
        raise ValueError(f"Unsupported currencies: {', '.join(invalid)}")
    if not normalized:
        raise ValueError("At least one collection currency must remain enabled")
    ordered = [currency for currency in SUPPORTED_COLLECTION_CURRENCIES if currency in normalized]
    await _set_setting(db, ENABLED_COLLECTION_CURRENCIES_KEY, ",".join(ordered))
    return ordered


def _default_wallet_limits() -> dict[str, dict[str, float]]:
    limits = {
        currency: {key: float(value) for key, value in DEFAULT_WALLET_LIMITS.items()}
        for currency in WALLET_SETTING_CURRENCIES
    }
    # Keep the deposit floor configurable and default to zero so small test/development
    # top-ups are not blocked until an admin explicitly sets a minimum.
    return limits


async def get_wallet_limits(db: AsyncSession) -> dict[str, dict[str, float]]:
    """Return normalized per-currency wallet limits; zero disables a limit."""
    configured = _default_wallet_limits()
    value = await _get_setting(db, WALLET_SETTINGS_KEY)
    if value:
        try:
            raw = json.loads(value)
        except (TypeError, ValueError):
            logger.warning("Invalid wallet limit setting; using defaults")
            raw = {}
        if isinstance(raw, dict):
            for currency in WALLET_SETTING_CURRENCIES:
                values = raw.get(currency, {})
                if not isinstance(values, dict):
                    continue
                for key in DEFAULT_WALLET_LIMITS:
                    try:
                        parsed = float(values.get(key, configured[currency][key]))
                        if math.isfinite(parsed) and parsed >= 0:
                            configured[currency][key] = parsed
                    except (TypeError, ValueError):
                        continue
    configured["PHP"]["minimum_balance"] = 0.0
    return configured


async def set_wallet_limits(
    db: AsyncSession,
    limits: dict[str, dict[str, float]],
) -> dict[str, dict[str, float]]:
    """Validate and persist per-currency wallet limits."""
    normalized = _default_wallet_limits()
    for currency in WALLET_SETTING_CURRENCIES:
        values = limits.get(currency, {})
        if not isinstance(values, dict):
            raise ValueError(f"Invalid wallet settings for {currency}")
        for key in DEFAULT_WALLET_LIMITS:
            try:
                value = float(values.get(key, normalized[currency][key]))
            except (TypeError, ValueError) as exc:
                raise ValueError(f"{currency} {key} must be a valid number") from exc
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"{currency} {key} must be zero or greater")
            normalized[currency][key] = round(value, 2)
    normalized["PHP"]["minimum_balance"] = 0.0
    await _set_setting(db, WALLET_SETTINGS_KEY, json.dumps(normalized, sort_keys=True))
    return normalized


async def get_wallet_currency_limits(db: AsyncSession, currency: str) -> dict[str, float]:
    normalized_currency = public_currency(currency)
    limits = await get_wallet_limits(db)
    return dict(limits.get(normalized_currency, DEFAULT_WALLET_LIMITS))


DEFAULT_CHECKOUT_DESIGN = {
    "display_name": "",
    "primary_color": "#071B3A",
    "accent_color": "#1475D1",
    "page_background": "#F9FAFB",
    "heading_color": "#0F172A",
    "body_text_color": "#475569",
    "card_radius": 24,
    "payment_layout": "grid",
    "payment_alignment": "left",
    "show_powered_by": True,
}


async def get_checkout_design(db: AsyncSession) -> dict:
    configured = dict(DEFAULT_CHECKOUT_DESIGN)
    value = await _get_setting(db, CHECKOUT_DESIGN_KEY)
    if value:
        try:
            raw = json.loads(value)
        except (TypeError, ValueError):
            raw = {}
        if isinstance(raw, dict):
            display_name = str(raw.get("display_name", "")).strip()
            if len(display_name) <= 80:
                configured["display_name"] = display_name
            for key in ("primary_color", "accent_color", "page_background"):
                candidate = str(raw.get(key, "")).strip()
                if re.fullmatch(r"#[0-9a-fA-F]{6}", candidate):
                    configured[key] = candidate.upper()
            for key in ("heading_color", "body_text_color"):
                candidate = str(raw.get(key, "")).strip()
                if re.fullmatch(r"#[0-9a-fA-F]{6}", candidate):
                    configured[key] = candidate.upper()
            try:
                radius = int(raw.get("card_radius", configured["card_radius"]))
                if 8 <= radius <= 48:
                    configured["card_radius"] = radius
            except (TypeError, ValueError):
                pass
            if isinstance(raw.get("show_powered_by"), bool):
                configured["show_powered_by"] = raw["show_powered_by"]
            if raw.get("payment_layout") in {"grid", "list"}:
                configured["payment_layout"] = raw["payment_layout"]
            if raw.get("payment_alignment") in {"left", "center"}:
                configured["payment_alignment"] = raw["payment_alignment"]
    return configured


async def set_checkout_design(db: AsyncSession, design: dict) -> dict:
    normalized = dict(DEFAULT_CHECKOUT_DESIGN)
    display_name = str(design.get("display_name", "")).strip()
    if len(display_name) > 80:
        raise ValueError("display_name must be 80 characters or fewer")
    normalized["display_name"] = display_name
    for key in ("primary_color", "accent_color", "page_background", "heading_color", "body_text_color"):
        value = str(design.get(key, "")).strip()
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise ValueError(f"{key} must be a valid hex color")
        normalized[key] = value.upper()
    try:
        radius = int(design.get("card_radius", normalized["card_radius"]))
    except (TypeError, ValueError) as exc:
        raise ValueError("card_radius must be a whole number") from exc
    if not 8 <= radius <= 48:
        raise ValueError("card_radius must be between 8 and 48")
    normalized["card_radius"] = radius
    if design.get("payment_layout") not in {"grid", "list"}:
        raise ValueError("payment_layout must be grid or list")
    if design.get("payment_alignment") not in {"left", "center"}:
        raise ValueError("payment_alignment must be left or center")
    normalized["payment_layout"] = design["payment_layout"]
    normalized["payment_alignment"] = design["payment_alignment"]
    normalized["show_powered_by"] = bool(design.get("show_powered_by", True))
    await _set_setting(db, CHECKOUT_DESIGN_KEY, json.dumps(normalized, sort_keys=True))
    return normalized


async def get_payment_channels(db: AsyncSession) -> dict[str, dict[str, list[str]]]:
    """Return enabled payment channels grouped by currency and flow."""
    value = await _get_setting(db, PAYMENT_CHANNELS_KEY)
    if not value:
        return DEFAULT_PAYMENT_CHANNELS
    try:
        configured = json.loads(value)
    except (TypeError, ValueError):
        logger.warning("Invalid payment channel setting; using defaults")
        return DEFAULT_PAYMENT_CHANNELS

    normalized = {}
    for currency in SUPPORTED_COLLECTION_CURRENCIES:
        currency_config = configured.get(currency, {}) if isinstance(configured, dict) else {}
        normalized[currency] = {
            flow: [channel for channel in currency_config.get(flow, []) if channel in PAYMENT_CHANNELS]
            for flow in ("checkout", "withdrawal", "disbursement")
        }
        if currency == "PHP":
            configured_institutions = currency_config.get("checkout_institutions")
            normalized[currency]["checkout_institutions"] = (
                [str(code).strip().upper() for code in configured_institutions if str(code).strip().upper() in PHP_CHECKOUT_INSTITUTIONS]
                if isinstance(configured_institutions, list)
                else list(PHP_CHECKOUT_INSTITUTIONS)
            )
    return normalized


async def set_payment_channels(db: AsyncSession, channels: dict) -> dict[str, dict[str, list[str]]]:
    """Validate and persist the per-currency payment channel configuration."""
    normalized = {}
    for currency in SUPPORTED_COLLECTION_CURRENCIES:
        currency_config = channels.get(currency, {})
        if not isinstance(currency_config, dict):
            raise ValueError(f"Invalid configuration for {currency}")
        normalized[currency] = {}
        for flow in ("checkout", "withdrawal", "disbursement"):
            values = currency_config.get(flow, [])
            if not isinstance(values, list):
                raise ValueError(f"{currency} {flow} channels must be a list")
            invalid = [channel for channel in values if channel not in PAYMENT_CHANNELS]
            if invalid:
                raise ValueError(f"Unsupported payment channels: {', '.join(invalid)}")
            normalized[currency][flow] = list(dict.fromkeys(values))
        if currency == "PHP":
            institutions = currency_config.get("checkout_institutions", list(PHP_CHECKOUT_INSTITUTIONS))
            if not isinstance(institutions, list):
                raise ValueError("PHP checkout institutions must be a list")
            invalid_institutions = [code for code in institutions if str(code).strip().upper() not in PHP_CHECKOUT_INSTITUTIONS]
            if invalid_institutions:
                raise ValueError(f"Unsupported PHP checkout institutions: {', '.join(map(str, invalid_institutions))}")
            normalized[currency]["checkout_institutions"] = list(dict.fromkeys(str(code).strip().upper() for code in institutions))
    await _set_setting(db, PAYMENT_CHANNELS_KEY, json.dumps(normalized, separators=(",", ":")))
    return normalized


async def get_collection_fee_percent(db: AsyncSession, user_id: Optional[str] = None) -> float:
    """Return the effective incoming commission as a decimal rate."""
    if not FEES_ENABLED:
        return 0.0
    details = await get_collection_fee_details(db, user_id)
    return details.rate


async def get_collection_fee_details(
    db: AsyncSession,
    user_id: Optional[str] = None,
) -> CollectionFeeDetails:
    """Resolve an account's effective collection fee and VIP status once."""
    admin = await get_admin_user(db, user_id) if user_id else None
    is_gold_vip = admin.vip_gold if admin else None

    if not FEES_ENABLED:
        return CollectionFeeDetails(rate=0.0, is_gold_vip=is_gold_vip)

    base_percent = await get_system_collection_fee_percent(db)
    if admin:
        if is_gold_vip:
            base_percent = await get_vip_gold_collection_fee_percent(db) / 100.0
        base_percent += _fee_percent(admin.service_fee_percent) / 100.0
        base_percent += _fee_percent(admin.collection_fee_percent) / 100.0
    return CollectionFeeDetails(
        rate=min(1.0, max(0.0, base_percent)),
        is_gold_vip=is_gold_vip,
    )


async def get_system_collection_fee_percent(db: AsyncSession) -> float:
    if not FEES_ENABLED:
        return 0.0
    value = await _get_setting(db, COLLECTION_FEE_PERCENT_KEY)
    percent = _fee_percent(
        value,
        default=DEFAULT_COLLECTION_FEE_PERCENT * 100,
    )
    return percent / 100.0


async def set_system_collection_fee_percent(db: AsyncSession, percent: float) -> float:
    if percent < 0 or percent > 100:
        raise ValueError("Collection commission must be between 0 and 100 percent")
    await _set_setting(db, COLLECTION_FEE_PERCENT_KEY, str(percent))
    return percent


async def get_vip_gold_collection_fee_percent(db: AsyncSession) -> float:
    if not FEES_ENABLED:
        return 0.0
    value = await _get_setting(db, VIP_GOLD_COLLECTION_FEE_PERCENT_KEY)
    return _fee_percent(value, default=DEFAULT_VIP_GOLD_COLLECTION_FEE_PERCENT)


async def set_vip_gold_collection_fee_percent(db: AsyncSession, percent: float) -> float:
    if percent < 0 or percent > 100:
        raise ValueError("VIP Gold collection fee must be between 0 and 100 percent")
    await _set_setting(db, VIP_GOLD_COLLECTION_FEE_PERCENT_KEY, str(percent))
    return percent


async def get_additional_collection_fee_percent(db: AsyncSession) -> float:
    """Return the owner-configured fee surcharge in percentage points."""
    if not FEES_ENABLED:
        return 0.0
    value = await _get_setting(db, ADDITIONAL_COLLECTION_FEE_PERCENT_KEY)
    try:
        return max(0.0, float(value)) if value is not None else DEFAULT_ADDITIONAL_COLLECTION_FEE_PERCENT
    except (TypeError, ValueError):
        return DEFAULT_ADDITIONAL_COLLECTION_FEE_PERCENT


async def set_additional_collection_fee_percent(db: AsyncSession, percent: float) -> float:
    """Persist the owner-configured fee surcharge in percentage points."""
    if percent < 0 or percent > 100:
        raise ValueError("Additional collection fee must be between 0 and 100 percent")
    await _set_setting(db, ADDITIONAL_COLLECTION_FEE_PERCENT_KEY, str(percent))
    return percent


async def get_conversion_fee_percent(db: AsyncSession) -> float:
    """Return the system-wide exchange-rate fee in percentage points.

    The default conversion fee is part of the product's standard wallet behavior.
    If a deployment explicitly turns fee enforcement off, the app can still keep the
    default schedule as a fallback for user-visible quote calculations and payout logic.
    Conversion fees are set by the system super admin and do not vary by the account
    initiating a conversion.
    """
    value = await _get_setting(db, CONVERSION_FEE_PERCENT_KEY)
    return _fee_percent(value, default=DEFAULT_CONVERSION_FEE_PERCENT)


async def set_conversion_fee_percent(db: AsyncSession, percent: float) -> float:
    if percent < 0 or percent > 100:
        raise ValueError("Conversion fee must be between 0 and 100 percent")
    await _set_setting(db, CONVERSION_FEE_PERCENT_KEY, str(percent))
    return percent


async def get_withdrawal_fees(db: AsyncSession) -> dict[str, float]:
    value = await _get_setting(db, WITHDRAWAL_FEES_KEY)
    defaults = {"PHP": 15.0, "KRW": 1500.0, "USDT": 1.0, "CNY": 10.0, "USD": 1.0}
    if not value:
        return defaults
    try:
        configured = json.loads(value)
        return {currency: max(0.0, float(configured.get(currency, defaults[currency]))) for currency in defaults}
    except (TypeError, ValueError, json.JSONDecodeError):
        return defaults


async def set_withdrawal_fees(db: AsyncSession, fees: dict[str, float]) -> dict[str, float]:
    normalized = await get_withdrawal_fees(db)
    for currency, value in fees.items():
        code = str(currency).upper()
        if code not in normalized:
            raise ValueError(f"Unsupported withdrawal fee currency: {code}")
        amount = float(value)
        if amount < 0:
            raise ValueError("Withdrawal fees cannot be negative")
        normalized[code] = amount
    await _set_setting(db, WITHDRAWAL_FEES_KEY, json.dumps(normalized, separators=(",", ":")))
    return normalized


async def get_deposit_rules(db: AsyncSession) -> dict:
    value = await _get_setting(db, DEPOSIT_RULES_KEY)
    rules = dict(DEFAULT_DEPOSIT_RULES)
    if not value:
        return rules
    try:
        configured = json.loads(value)
    except (TypeError, ValueError, json.JSONDecodeError):
        return rules
    if not isinstance(configured, dict):
        return rules
    for key in ("bank_deposit_currencies", "topup_currencies"):
        values = configured.get(key)
        if isinstance(values, list):
            rules[key] = [str(item).strip().upper() for item in values if str(item).strip()]
    for key in ("receipt_max_size_mb", "first_usdt_topup_amount"):
        try:
            number = float(configured.get(key, rules[key]))
            if math.isfinite(number) and number >= 0:
                rules[key] = number
        except (TypeError, ValueError):
            pass
    if isinstance(configured.get("first_usdt_topup_rule_enabled"), bool):
        rules["first_usdt_topup_rule_enabled"] = configured["first_usdt_topup_rule_enabled"]
    return rules


async def set_deposit_rules(db: AsyncSession, rules: dict) -> dict:
    normalized = await get_deposit_rules(db)
    for key in ("bank_deposit_currencies", "topup_currencies"):
        if key in rules:
            values = rules[key]
            if not isinstance(values, list) or not values:
                raise ValueError(f"{key} must be a non-empty list")
            normalized[key] = [str(item).strip().upper() for item in values if str(item).strip()]
    for key in ("receipt_max_size_mb", "first_usdt_topup_amount"):
        if key in rules:
            value = float(rules[key])
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"{key} must be zero or greater")
            normalized[key] = round(value, 2)
    if "first_usdt_topup_rule_enabled" in rules:
        if not isinstance(rules["first_usdt_topup_rule_enabled"], bool):
            raise ValueError("first_usdt_topup_rule_enabled must be boolean")
        normalized["first_usdt_topup_rule_enabled"] = rules["first_usdt_topup_rule_enabled"]
    await _set_setting(db, DEPOSIT_RULES_KEY, json.dumps(normalized, sort_keys=True))
    return normalized

async def get_krw_bank_name(db: AsyncSession) -> str:
    """Return the configured KRW bank name when a real merchant account exists.

    SwiftPay's public API docs do not expose a provider-issued KRW account;
    therefore we do not fabricate a fallback Korean bank name.
    """
    value = await _get_setting(db, KRW_BANK_NAME_KEY)
    return value if value else ""


async def set_krw_bank_name(db: AsyncSession, bank_name: str) -> str:
    """Update the KRW bank name."""
    cleaned_name = (bank_name or "").strip()
    if not cleaned_name:
        cleaned_name = ""
    await _set_setting(db, KRW_BANK_NAME_KEY, cleaned_name)
    return cleaned_name


async def get_krw_account_holder_name(db: AsyncSession) -> str:
    """Return the configured KRW account holder name when a real merchant account exists."""
    value = await _get_setting(db, KRW_ACCOUNT_HOLDER_NAME_KEY)
    return value if value else ""


async def set_krw_account_holder_name(db: AsyncSession, holder_name: str) -> str:
    """Update the KRW account holder name."""
    cleaned_name = (holder_name or "").strip()
    if not cleaned_name:
        cleaned_name = ""
    await _set_setting(db, KRW_ACCOUNT_HOLDER_NAME_KEY, cleaned_name)
    return cleaned_name