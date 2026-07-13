import os
import time
import hashlib
import hmac
from fastapi.testclient import TestClient
from main import app

os.environ['ENVIRONMENT'] = 'test'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-for-ci'
os.environ['TELEGRAM_BOT_TOKEN'] = '123456:TEST_BOT_TOKEN'
os.environ['TELEGRAM_ADMIN_IDS'] = '123456789'
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_auth_repro.db'

client = TestClient(app)
payload = {
    'id': 123456789,
    'auth_date': int(time.time()),
    'first_name': 'Test',
    'username': 'test_admin',
}
data_check_string = '\n'.join(
    f"{key}={value}"
    for key, value in sorted(payload.items())
    if value is not None and value != ''
)
secret_key = hashlib.sha256(os.environ['TELEGRAM_BOT_TOKEN'].encode('utf-8')).digest()
payload['hash'] = hmac.new(secret_key, data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()

print('payload:', payload)
response = client.post('/api/v1/auth/telegram-login-widget', json=payload)
print('status', response.status_code)
print('headers', response.headers)
print('text', response.text)
try:
    print('json', response.json())
except Exception as exc:
    print('json parse error', exc)

# Now try with the exact same request using a freshly computed valid hash.
valid_payload = {
    'id': 123456789,
    'auth_date': int(time.time()),
    'first_name': 'Test',
    'username': 'test_admin',
}
valid_data_check_string = '\n'.join(
    f"{key}={value}"
    for key, value in sorted(valid_payload.items())
    if value is not None and value != ''
)
valid_payload['hash'] = hmac.new(secret_key, valid_data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()
print('valid_payload:', valid_payload)
valid_response = client.post('/api/v1/auth/telegram-login-widget', json=valid_payload)
print('valid status', valid_response.status_code)
print('valid text', valid_response.text)
try:
    print('valid json', valid_response.json())
except Exception as exc:
    print('valid json parse error', exc)
