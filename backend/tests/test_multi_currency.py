"""Test suite for multi-currency wallet operations and exchange rate management.

Tests cover:
- Exchange rate fetching and caching
- Currency conversion with fee calculation
- Admin rate overrides
- Rate history tracking
- User wallet conversions
"""

import pytest
import pytest_asyncio
from _pytest.monkeypatch import MonkeyPatch
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base
from models.wallets import Wallets
from models.exchange_rate_history import ExchangeRateHistory
from models.exchange_rate_override import ExchangeRateOverride
from services.currency_service import CurrencyService


@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_db_engine):
    async_session = async_sessionmaker(test_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.mark.asyncio
async def test_exchange_rate_service_get_rate(db_session):
    """Test getting exchange rates from service."""
    from services import exchange_rate_service

    exchange_rate_service.clear_cache()

    try:
        rate = await exchange_rate_service.fetch_live_usdt_php_rate()
        assert rate > 0
        assert isinstance(rate, float)
    except RuntimeError:
        pytest.skip("Network unavailable for rate fetch")


@pytest.mark.asyncio
async def test_currency_conversion_quote(db_session):
    """Test getting a conversion quote."""
    wallet = Wallets(
        user_id="test_user",
        currency="USD",
        balance=100.0,
        available_balance=100.0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(wallet)
    await db_session.flush()

    service = CurrencyService(db_session)

    quote = await service.get_conversion_quote(wallet.id, "USD", "USD", 50.0)
    assert quote["from_amount"] == 50.0
    assert quote["to_amount"] == 50.0
    assert quote["rate"] == 1.0
    assert quote["fee_amount"] == 0.0


@pytest.mark.asyncio
async def test_set_rate_override(db_session):
    """Test setting an exchange rate override."""
    service = CurrencyService(db_session)

    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    override = await service.set_rate_override(
        "USD", "PHP", 60.0, expires_at, "admin_user"
    )

    assert override.from_currency == "USD"
    assert override.to_currency == "PHP"
    assert override.rate == 60.0
    assert override.created_by == "admin_user"


@pytest.mark.asyncio
async def test_get_rate_stats(db_session):
    """Test getting exchange rate statistics."""
    service = CurrencyService(db_session)
    stats = await service.get_rate_stats("USDT_PHP")
    assert "current" in stats
    assert "data_points" in stats


@pytest.mark.asyncio
async def test_remove_rate_override(db_session):
    """Test removing an exchange rate override."""
    service = CurrencyService(db_session)

    await service.set_rate_override(
        "USD", "PHP", 60.0, datetime.now(timezone.utc) + timedelta(hours=1), "admin"
    )

    success = await service.remove_rate_override("USD", "PHP")
    assert success is True

    # Verify it's gone
    stmt = select(ExchangeRateOverride).where(
        ExchangeRateOverride.from_currency == "USD",
        ExchangeRateOverride.to_currency == "PHP"
    )
    result = await db_session.execute(stmt)
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_get_supported_currencies(db_session):
    """Test getting list of supported currencies."""
    service = CurrencyService(db_session)
    currencies = await service.get_supported_currencies()
    assert "PHP" in currencies
    assert "USD" in currencies
    assert "USDT" in currencies


@pytest.mark.asyncio
async def test_conversion_with_insufficient_balance(db_session):
    """Test conversion fails when source wallet has low balance."""
    wallet = Wallets(
        user_id="test_user",
        currency="USD",
        balance=10.0,
        available_balance=10.0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(wallet)
    await db_session.flush()

    to_wallet = Wallets(
        user_id="test_user",
        currency="PHP",
        balance=0.0,
        available_balance=0.0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(to_wallet)
    await db_session.flush()

    service = CurrencyService(db_session)

    with pytest.raises(ValueError, match="Insufficient balance"):
        await service.convert_currency(wallet, to_wallet, 50.0, "test_user")


@pytest.mark.asyncio
async def test_same_currency_conversion_rejected(db_session):
    """Test that converting to same currency is rejected."""
    wallet = Wallets(
        user_id="test_user",
        currency="PHP",
        balance=100.0,
        available_balance=100.0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(wallet)
    await db_session.flush()

    service = CurrencyService(db_session)

    with pytest.raises(ValueError, match="same currency"):
        await service.convert_currency(wallet, wallet, 50.0, "test_user")


@pytest.mark.asyncio
async def test_conversion_updates_wallet_counts(db_session):
    """Test that conversion increments conversion_count on wallets."""
    from_wallet = Wallets(
        user_id="user1", currency="USD", balance=100.0, available_balance=100.0,
        conversion_count=0, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    to_wallet = Wallets(
        user_id="user1", currency="PHP", balance=0.0, available_balance=0.0,
        conversion_count=0, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    db_session.add_all([from_wallet, to_wallet])
    await db_session.flush()

    service = CurrencyService(db_session)
    # Mock live rate to avoid network dependency in unit test logic
    with MonkeyPatch.context() as m:
        m.setattr("services.exchange_rate_service.fetch_live_usdt_php_rate", lambda: 56.0)
        await service.convert_currency(from_wallet, to_wallet, 10.0, "user1")

    assert from_wallet.conversion_count == 1
    assert to_wallet.conversion_count == 1


@pytest.mark.asyncio
async def test_rate_history_recorded(db_session):
    """Test that exchange rates are recorded in history on use."""
    from_wallet = Wallets(
        user_id="user1", currency="USD", balance=100.0, available_balance=100.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    to_wallet = Wallets(
        user_id="user1", currency="PHP", balance=0.0, available_balance=0.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    db_session.add_all([from_wallet, to_wallet])
    await db_session.flush()

    service = CurrencyService(db_session)
    with MonkeyPatch.context() as m:
        m.setattr("services.exchange_rate_service.fetch_live_usdt_php_rate", lambda: 56.5)
        await service.convert_currency(from_wallet, to_wallet, 10.0, "user1")

    # Check history
    stmt = select(ExchangeRateHistory).where(
        ExchangeRateHistory.from_currency == "USD",
        ExchangeRateHistory.to_currency == "PHP"
    )
    res = await db_session.execute(stmt)
    history = res.scalar_one()
    assert history.rate == 56.5


@pytest.mark.asyncio
async def test_conversion_fee_calculation(db_session):
    """Test that fees are correctly calculated and deducted."""
    from_wallet = Wallets(
        user_id="user1", currency="USD", balance=100.0, available_balance=100.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    to_wallet = Wallets(
        user_id="user1", currency="PHP", balance=0.0, available_balance=0.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    db_session.add_all([from_wallet, to_wallet])
    await db_session.flush()

    service = CurrencyService(db_session)
    # 56 PHP/USD rate. 10 USD -> 560 PHP gross.
    # With 1% fee (default in many systems), it should be 554.4 PHP net.
    with MonkeyPatch.context() as m:
        m.setattr("services.exchange_rate_service.fetch_live_usdt_php_rate", lambda: 56.0)
        conv = await service.convert_currency(from_wallet, to_wallet, 10.0, "user1")

    assert conv.from_amount == 10.0
    assert conv.to_amount < (10.0 * 56.0)
    assert conv.conversion_fee_amount > 0


@pytest.mark.asyncio
async def test_override_rate_used_in_conversion(db_session):
    """Test that admin overrides take precedence over live rates."""
    from_wallet = Wallets(
        user_id="user1", currency="USD", balance=100.0, available_balance=100.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    to_wallet = Wallets(
        user_id="user1", currency="PHP", balance=0.0, available_balance=0.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    db_session.add_all([from_wallet, to_wallet])

    service = CurrencyService(db_session)
    # Set override to 100.0 (very high)
    await service.set_rate_override(
        "USD", "PHP", 100.0, datetime.now(timezone.utc) + timedelta(minutes=5), "admin"
    )
    await db_session.flush()

    with MonkeyPatch.context() as m:
        m.setattr("services.exchange_rate_service.fetch_live_usdt_php_rate", lambda: 56.0)
        conv = await service.convert_currency(from_wallet, to_wallet, 1.0, "user1")

    # 1.0 USD -> 100 PHP (minus fee)
    assert conv.rate_applied == 100.0


@pytest.mark.asyncio
async def test_expired_override_not_used(db_session):
    """Test that expired overrides are ignored in favor of live rates."""
    from_wallet = Wallets(
        user_id="user1", currency="USD", balance=100.0, available_balance=100.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    to_wallet = Wallets(
        user_id="user1", currency="PHP", balance=0.0, available_balance=0.0,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc)
    )
    db_session.add_all([from_wallet, to_wallet])

    service = CurrencyService(db_session)
    # Set expired override
    await service.set_rate_override(
        "USD", "PHP", 100.0, datetime.now(timezone.utc) - timedelta(minutes=5), "admin"
    )
    await db_session.flush()

    with MonkeyPatch.context() as m:
        m.setattr("services.exchange_rate_service.fetch_live_usdt_php_rate", lambda: 56.0)
        conv = await service.convert_currency(from_wallet, to_wallet, 1.0, "user1")

    # Should use live rate 56.0
    assert conv.rate_applied == 56.0
