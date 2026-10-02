import logging

from core.config import settings
from routers.auth import _is_linked_telegram_account
from services.telegram_service import _TelegramTokenRedactionFilter


def test_backend_url_trims_deployment_whitespace(monkeypatch):
    monkeypatch.setenv("PYTHON_BACKEND_URL", "  https://api.example.com/  ")

    assert settings.backend_url == "https://api.example.com"


def test_telegram_http_log_redacts_bot_token_path():
    token = "123456:secret-token-value"
    record = logging.LogRecord(
        "httpx",
        logging.INFO,
        __file__,
        1,
        "HTTP Request: POST https://api.telegram.org/bot%s/setWebhook",
        (token,),
        None,
    )

    _TelegramTokenRedactionFilter().filter(record)

    assert token not in record.getMessage()
    assert "/bot[REDACTED]/setWebhook" in record.getMessage()


def test_real_telegram_ids_are_treated_as_linked():
    assert _is_linked_telegram_account("123456789") is True
    assert _is_linked_telegram_account(" 987654321 ") is True


def test_placeholder_and_blank_ids_are_not_linked():
    assert _is_linked_telegram_account(None) is False
    assert _is_linked_telegram_account("") is False
    assert _is_linked_telegram_account("web-abc123") is False
