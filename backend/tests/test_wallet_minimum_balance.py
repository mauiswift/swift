import json

import pytest


@pytest.mark.asyncio
async def test_php_minimum_balance_is_disabled_for_existing_settings(monkeypatch):
    from services import app_settings

    legacy_limits = {
        "PHP": {"minimum_balance": 5000},
        "KRW": {"minimum_balance": 200},
    }

    async def fake_get_setting(_db, key):
        assert key == app_settings.WALLET_SETTINGS_KEY
        return json.dumps(legacy_limits)

    monkeypatch.setattr(app_settings, "_get_setting", fake_get_setting)

    limits = await app_settings.get_wallet_limits(object())

    assert limits["PHP"]["minimum_balance"] == 0
    assert limits["KRW"]["minimum_balance"] == 200


@pytest.mark.asyncio
async def test_php_minimum_balance_is_not_saved(monkeypatch):
    from services import app_settings

    saved = {}

    async def fake_set_setting(_db, key, value):
        saved["key"] = key
        saved["value"] = value

    monkeypatch.setattr(app_settings, "_set_setting", fake_set_setting)
    limits = {
        currency: {
            "max_incoming": 0,
            "minimum_balance": 5000 if currency == "PHP" else 0,
            "minimum_deposit": 0,
            "max_withdrawal_daily": 0,
            "max_withdrawal_monthly": 0,
        }
        for currency in app_settings.WALLET_SETTING_CURRENCIES
    }

    result = await app_settings.set_wallet_limits(object(), limits)

    assert result["PHP"]["minimum_balance"] == 0
    assert json.loads(saved["value"])["PHP"]["minimum_balance"] == 0
    assert saved["key"] == app_settings.WALLET_SETTINGS_KEY
