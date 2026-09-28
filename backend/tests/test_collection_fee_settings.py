import asyncio
from types import SimpleNamespace

from services import app_settings


def test_collection_fee_details_resolve_system_and_user_surcharges(monkeypatch):
    admin = SimpleNamespace(
        vip_gold=False,
        service_fee_percent=0.5,
        collection_fee_percent=0.25,
    )
    monkeypatch.setattr(app_settings, "FEES_ENABLED", True)
    monkeypatch.setattr(app_settings, "get_admin_user", _async_result(admin))
    monkeypatch.setattr(app_settings, "get_system_collection_fee_percent", _async_result(0.015))

    details = asyncio.run(app_settings.get_collection_fee_details(object(), "merchant"))

    assert details.rate == 0.0225
    assert details.is_gold_vip is False


def test_collection_fee_details_use_vip_rate_and_clamp_total(monkeypatch):
    admin = SimpleNamespace(
        vip_gold=True,
        service_fee_percent=100,
        collection_fee_percent=100,
    )
    monkeypatch.setattr(app_settings, "FEES_ENABLED", True)
    monkeypatch.setattr(app_settings, "get_admin_user", _async_result(admin))
    monkeypatch.setattr(app_settings, "get_system_collection_fee_percent", _async_result(0.015))
    monkeypatch.setattr(app_settings, "get_vip_gold_collection_fee_percent", _async_result(2.5))

    details = asyncio.run(app_settings.get_collection_fee_details(object(), "merchant"))

    assert details.rate == 1.0
    assert details.is_gold_vip is True


def test_collection_fee_percent_wrapper_preserves_disabled_behavior(monkeypatch):
    monkeypatch.setattr(app_settings, "FEES_ENABLED", False)

    assert asyncio.run(app_settings.get_collection_fee_percent(object(), "merchant")) == 0.0


def test_collection_fee_percent_wrapper_uses_resolved_rate(monkeypatch):
    admin = SimpleNamespace(vip_gold=False, service_fee_percent=0, collection_fee_percent=0)
    monkeypatch.setattr(app_settings, "FEES_ENABLED", True)
    monkeypatch.setattr(app_settings, "get_admin_user", _async_result(admin))
    monkeypatch.setattr(app_settings, "get_system_collection_fee_percent", _async_result(0.015))

    assert asyncio.run(app_settings.get_collection_fee_percent(object(), "merchant")) == 0.015


def test_conversion_fee_is_system_wide_not_account_specific(monkeypatch):
    async def get_setting(_db, key):
        assert key == app_settings.CONVERSION_FEE_PERCENT_KEY
        return "2.5"

    async def unexpected_admin_lookup(*_args, **_kwargs):
        raise AssertionError("Conversion fee must not look up an account-specific surcharge")

    monkeypatch.setattr(app_settings, "_get_setting", get_setting)
    monkeypatch.setattr(app_settings, "get_admin_user", unexpected_admin_lookup)

    fee_percent = asyncio.run(app_settings.get_conversion_fee_percent(object()))

    assert fee_percent == 2.5


def _async_result(value):
    async def resolve(*args, **kwargs):
        _ = args, kwargs
        return value

    return resolve
