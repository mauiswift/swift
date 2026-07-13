import os
import time
import hashlib
import hmac
from schemas.auth import TelegramWidgetLoginRequest
from routers.auth import _verify_telegram_widget_payload

os.environ['ENVIRONMENT'] = 'test'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-for-ci'
os.environ['TELEGRAM_BOT_TOKEN'] = '123456:TEST_BOT_TOKEN'
os.environ['TELEGRAM_ADMIN_IDS'] = '123456789'

bot_token = os.environ['TELEGRAM_BOT_TOKEN']
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
secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()
payload['hash'] = hmac.new(secret_key, data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()
print('data_check_string:', repr(data_check_string))
print('hash:', payload['hash'])
req = TelegramWidgetLoginRequest(**payload)
valid, reason = _verify_telegram_widget_payload(req, bot_token)
print('valid', valid, 'reason', reason)
