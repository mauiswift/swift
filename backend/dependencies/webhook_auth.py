import hashlib
import hmac

from fastapi import HTTPException, Request

from core.config import settings


def get_telegram_webhook_secret() -> str:
    configured_secret = str(settings.telegram_webhook_secret or "").strip()
    if configured_secret:
        return configured_secret

    bot_token = str(settings.telegram_bot_token or "").strip()
    if not bot_token:
        return ""

    return hmac.new(
        bot_token.encode("utf-8"),
        b"swiftpay:telegram-webhook",
        hashlib.sha256,
    ).hexdigest()


def require_telegram_webhook_secret(request: Request) -> None:
    expected = get_telegram_webhook_secret()
    if not expected:
        raise HTTPException(status_code=503, detail="Telegram webhook is not configured")

    provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=403, detail="Invalid Telegram webhook secret")