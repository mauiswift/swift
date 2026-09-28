import pytest

from routers import app_settings


@pytest.mark.asyncio
async def test_public_rates_apply_configured_conversion_fee(monkeypatch):
    market_rates = {
        "USDT_PHP": 60.0,
        "USDT_USD": 1.0,
        "USDT_EUR": 1.2,
        "USDT_KRW": 1200.0,
        "USDT_CNY": 8.0,
    }

    async def get_rate(pair):
        return market_rates[pair]

    async def get_conversion_fee_percent(_db):
        return 2.5

    monkeypatch.setattr(app_settings, "get_rate", get_rate)
    monkeypatch.setattr(app_settings, "get_conversion_fee_percent", get_conversion_fee_percent)

    response = await app_settings.get_public_exchange_rates(db=object())

    assert response["system_fee_percent"] == 2.5
    assert response["market_rates"]["KRW"] == pytest.approx(0.05)
    assert response["rates"]["KRW"] == pytest.approx(0.04875)
    assert response["rates"]["USDT"] == pytest.approx(58.5)


@pytest.mark.asyncio
async def test_live_usdt_php_rate_includes_effective_rate_and_fee(monkeypatch):
    async def fetch_rate():
        return 60.0

    async def get_conversion_fee_percent(_db):
        return 1.5

    monkeypatch.setattr(app_settings, "fetch_live_usdt_php_rate", fetch_rate)
    monkeypatch.setattr(app_settings, "_get_exchange_rate_cache_status", lambda: (60.0, True))
    monkeypatch.setattr(app_settings, "get_conversion_fee_percent", get_conversion_fee_percent)

    response = await app_settings.get_live_usdt_php_rate(db=object())

    assert response.rate == 60.0
    assert response.effective_rate == pytest.approx(59.1)
    assert response.system_fee_percent == 1.5
    assert response.cached is True
