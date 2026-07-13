import hashlib
import hmac
import json
import os
import time
import urllib.request

base_url = "http://127.0.0.1:8000"

os.environ.setdefault("TELEGRAM_BOT_TOKEN", "123456:TEST_BOT_TOKEN")

payload = {
    "id": 123456789,
    "auth_date": int(time.time()),
    "first_name": "Test",
    "username": "test_admin",
}
data_check_string = "\n".join(
    f"{key}={payload[key]}" for key in sorted(payload) if payload[key] is not None and payload[key] != ""
)
secret_key = hashlib.sha256(os.environ["TELEGRAM_BOT_TOKEN"].encode("utf-8")).digest()
payload["hash"] = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

req = urllib.request.Request(
    f"{base_url}/api/v1/auth/telegram-login-widget",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req) as response:
    token_payload = json.loads(response.read().decode("utf-8"))
    token = token_payload["token"]

body = {
    "amount": 150,
    "description": "SwiftPay invoice",
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "external_id": "swiftpay-http-check",
}
req2 = urllib.request.Request(
    f"{base_url}/api/v1/xend/create-invoice",
    data=json.dumps(body).encode("utf-8"),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
)
with urllib.request.urlopen(req2) as response:
    print(response.read().decode("utf-8"))
