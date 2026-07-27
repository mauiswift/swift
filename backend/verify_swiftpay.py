import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
os.chdir(backend_dir)

os.environ.setdefault('ENVIRONMENT', 'test')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-ci')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', '123456:TEST_BOT_TOKEN')
os.environ.setdefault('TELEGRAM_ADMIN_IDS', '123456789')
os.environ.setdefault('SWIFTPAY_ACCESS_KEY', 'ABC123')
os.environ.setdefault('SWIFTPAY_SECRET_KEY', 'SECRET')
os.environ.setdefault('SWIFTPAY_BASE_URL', 'http://127.0.0.1:8765')
os.environ.setdefault('SWIFTPAY_MODE', 'sandbox')

import pytest

sys.exit(pytest.main(['tests/test_bot.py::TestSwiftPayEndpointCompatibility', '-q']))
