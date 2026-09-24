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


def test_settings_prefer_environment_specific_env_file(monkeypatch, tmp_path):
    backend_dir = tmp_path / "backend"
    backend_dir.mkdir()
    production_env = backend_dir / ".env.production"
    production_env.write_text("ENVIRONMENT=production\n", encoding="utf-8")

    import core.config as config

    monkeypatch.delenv("SWIFTPAY_ENV_FILE", raising=False)
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setattr(config, "_BACKEND_DIR", backend_dir)
    monkeypatch.setattr(config, "_ENV_FILE", backend_dir / ".env")
    monkeypatch.setattr(config, "_PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(config, "_PROJECT_ENV_FILE", tmp_path / ".env")

    assert _get_env_file() == str(production_env)


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


def test_production_settings_auto_generate_missing_jwt_secret(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///./paybot.db")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123:token")

    settings = Settings()
    settings.validate_for_startup()

    assert settings.jwt_secret_key
    assert len(settings.jwt_secret_key) >= 32


def test_production_settings_auto_generate_short_jwt_secret(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///./paybot.db")
    monkeypatch.setenv("JWT_SECRET_KEY", "too-short")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "123:token")

    settings = Settings()
    settings.validate_for_startup()

    assert settings.jwt_secret_key
    assert len(settings.jwt_secret_key) >= 32
