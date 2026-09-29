import json

import pytest


@pytest.mark.asyncio
async def test_legacy_wallet_amount_limits_are_ignored_for_all_currencies(monkeypatch):
    from services import app_settings

    legacy_limits = {
        currency: {
            "max_incoming": 100000,
            "minimum_balance": 200,
            "minimum_deposit": 50,
            "max_withdrawal_daily": 500,
            "max_withdrawal_monthly": 1000,
        }
        for currency in app_settings.WALLET_SETTING_CURRENCIES
    }

    async def fake_get_setting(_db, key):
        assert key == app_settings.WALLET_SETTINGS_KEY
        return json.dumps(legacy_limits)

    monkeypatch.setattr(app_settings, "_get_setting", fake_get_setting)

    limits = await app_settings.get_wallet_limits(object())

    assert all(
        value == 0
        for currency_limits in limits.values()
        for value in currency_limits.values()
    )


@pytest.mark.asyncio
async def test_wallet_amount_limits_cannot_be_reenabled(monkeypatch):
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

    with pytest.raises(ValueError, match="Wallet amount limits are disabled"):
        await app_settings.set_wallet_limits(object(), limits)
    assert saved == {}

    zero_limits = {
        currency: {key: 0 for key in app_settings.DEFAULT_WALLET_LIMITS}
        for currency in app_settings.WALLET_SETTING_CURRENCIES
    }
    result = await app_settings.set_wallet_limits(object(), zero_limits)
    assert all(value == 0 for row in result.values() for value in row.values())
    assert all(value == 0 for row in json.loads(saved["value"]).values() for value in row.values())
    assert saved["key"] == app_settings.WALLET_SETTINGS_KEY


@pytest.mark.asyncio
async def test_legacy_first_usdt_topup_amount_rule_is_disabled(monkeypatch):
    from services import app_settings

    async def fake_get_setting(_db, key):
        assert key == app_settings.DEPOSIT_RULES_KEY
        return json.dumps({
            "first_usdt_topup_amount": 600,
            "first_usdt_topup_rule_enabled": True,
        })

    monkeypatch.setattr(app_settings, "_get_setting", fake_get_setting)

    rules = await app_settings.get_deposit_rules(object())
    assert rules["first_usdt_topup_amount"] == 0
    assert rules["first_usdt_topup_rule_enabled"] is False


@pytest.mark.asyncio
async def test_first_usdt_topup_amount_rule_cannot_be_reenabled(monkeypatch):
    from services import app_settings

    saved = {}

    async def fake_get_setting(_db, key):
        assert key == app_settings.DEPOSIT_RULES_KEY
        return None

    async def fake_set_setting(_db, key, value):
        saved["key"] = key
        saved["value"] = value

    monkeypatch.setattr(app_settings, "_get_setting", fake_get_setting)
    monkeypatch.setattr(app_settings, "_set_setting", fake_set_setting)

    rules = await app_settings.set_deposit_rules(
        object(),
        {
            "first_usdt_topup_amount": 600,
            "first_usdt_topup_rule_enabled": True,
        },
    )

    assert rules["first_usdt_topup_amount"] == 0
    assert rules["first_usdt_topup_rule_enabled"] is False
    assert saved["key"] == app_settings.DEPOSIT_RULES_KEY
