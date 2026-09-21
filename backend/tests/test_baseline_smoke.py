import pytest

from core.config import Settings, _get_env_file


def test_local_settings_get_safe_defaults(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "dev")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)

    settings = Settings()
    settings.validate_for_startup()

    assert settings.jwt_secret_key


def test_settings_use_root_env_file_when_backend_env_is_missing(monkeypatch, tmp_path):
    backend_dir = tmp_path / "backend"
    backend_dir.mkdir()
    project_env = tmp_path / ".env"
    project_env.write_text("APP_NAME=From root env\n", encoding="utf-8")

    import core.config as config

    monkeypatch.setattr(config, "_ENV_FILE", backend_dir / ".env")
    monkeypatch.setattr(config, "_PROJECT_ENV_FILE", project_env)

    assert _get_env_file() == str(project_env)


def test_public_and_magpie_settings_are_explicit(monkeypatch):
    monkeypatch.setenv("PUBLIC_CHECKOUT_HOST", "https://store.example.com")
    monkeypatch.setenv("MAGPIE_API_KEY", "magpie-key")
    monkeypatch.setenv("MAGPIE_SECRET_KEY", "magpie-secret")
    monkeypatch.setenv("MAGPIE_BASE_URL", "https://pay.magpie.im")

    settings = Settings()

    assert settings.public_checkout_host == "https://store.example.com"
    assert settings.magpie_api_key == "magpie-key"
    assert settings.magpie_secret_key == "magpie-secret"
    assert settings.magpie_base_url == "https://api.pay.magpie.im"


def test_production_settings_fail_for_missing_critical_secrets(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)

    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        Settings().validate_for_startup()
