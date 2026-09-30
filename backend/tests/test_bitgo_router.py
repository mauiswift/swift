import hashlib
import hmac
import os
import time

import pytest
from fastapi.testclient import TestClient

from main import app
from dependencies.webhook_auth import get_telegram_webhook_secret


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        c.headers["X-Telegram-Bot-Api-Secret-Token"] = get_telegram_webhook_secret()
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    bot_token = os.environ["TELEGRAM_BOT_TOKEN"]
    auth_date = int(time.time())
    payload = {
        "id": 123456789,
        "auth_date": auth_date,
        "first_name": "Test",
        "username": "test_admin",
    }
    data_check_string = "\n".join(
        f"{key}={value}"
        for key, value in sorted(payload.items())
        if value is not None and value != ""
    )
    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    payload["hash"] = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    response = client.post("/api/v1/auth/telegram-login-widget", json=payload)
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_my_address_falls_back_to_platform_usdt_when_bitgo_disabled(client, auth_headers):
    response = client.get("/api/v1/bitgo/my-address", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("source") == "usdt_trc20_address"
    assert data.get("network") == "trc20"
    assert data.get("id") is None
    assert isinstance(data.get("address"), str)
    assert data["address"].strip()

