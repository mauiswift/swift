import pytest

from core.config import Settings


def test_local_settings_get_safe_defaults(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "dev")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)

    settings = Settings()
    settings.validate_for_startup()

    assert settings.jwt_secret_key


def test_production_settings_fail_for_missing_critical_secrets(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)

    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        Settings().validate_for_startup()
