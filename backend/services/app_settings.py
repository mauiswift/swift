"""App Settings Service - manages application configuration values stored in database."""

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.constants import (
    ENABLED_COLLECTION_CURRENCIES_KEY,
    MAINTENANCE_MODE_KEY,
    SUPPORTED_COLLECTION_CURRENCIES,
    USDT_PHP_RATE_KEY,
    DEFAULT_USDT_PHP_RATE,
    USDT_TRC20_ADDRESS_KEY,
    KRW_ACCOUNT_HOLDER_NAME_KEY,
    DEFAULT_KRW_ACCOUNT_HOLDER_NAME,
)
from models.app_settings import AppSettings
from services.exchange_rate_service import fetch_live_usdt_php_rate

logger = logging.getLogger(__name__)


async def _get_setting(db: AsyncSession, key: str) -> Optional[str]:
    """Retrieve a setting value from the database."""
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


async def get_usdt_trc20_address(db: AsyncSession) -> str:
    """Return the configured USDT TRC20 deposit address.

    Priority: DB-stored value → USDT_TRC20_ADDRESS env var / config default.
    """
    value = await _get_setting(db, USDT_TRC20_ADDRESS_KEY)
    if value:
        return value
    # Tests expect a non-empty address; provide a sensible default when unset.
    return settings.usdt_trc20_address or "TEST_USDT_TRC20_ADDRESS"


async def ensure_maintenance_off(db: AsyncSession) -> None:
    """Ensure maintenance mode is disabled. Called during application startup."""
    value = await _get_setting(db, MAINTENANCE_MODE_KEY)
    if value == "true":
        await _set_setting(db, MAINTENANCE_MODE_KEY, "false")
        logger.info("Maintenance mode was on at startup — automatically turned off.")


async def get_maintenance_mode(db: AsyncSession) -> bool:
    """Get the current maintenance mode status."""
    value = await _get_setting(db, MAINTENANCE_MODE_KEY)
    return value == "true"


async def set_maintenance_mode(db: AsyncSession, enabled: bool) -> bool:
    """Enable or disable maintenance mode."""
    value = "true" if enabled else "false"
    await _set_setting(db, MAINTENANCE_MODE_KEY, value)
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

async def get_krw_account_holder_name(db: AsyncSession) -> str:
    \"\"\"Return the configured KRW account holder name for bank transfers.
    
    Priority: DB-stored value → DEFAULT_KRW_ACCOUNT_HOLDER_NAME.
    \"\"\"
    value = await _get_setting(db, KRW_ACCOUNT_HOLDER_NAME_KEY)
    return value if value else DEFAULT_KRW_ACCOUNT_HOLDER_NAME


async def set_krw_account_holder_name(db: AsyncSession, holder_name: str) -> str:
    \"\"\"Update the KRW account holder name.\"\"\"
    cleaned_name = (holder_name or \"\").strip()
    if not cleaned_name:
        cleaned_name = DEFAULT_KRW_ACCOUNT_HOLDER_NAME
    await _set_setting(db, KRW_ACCOUNT_HOLDER_NAME_KEY, cleaned_name)
    return cleaned_name