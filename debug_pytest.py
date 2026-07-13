import os
import sys
import pytest

os.environ.setdefault('ENVIRONMENT', 'test')
os.environ.setdefault('DATABASE_URL', 'sqlite+aiosqlite:///./test_paybot.db')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-ci')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', '123456:TEST_BOT_TOKEN')
os.environ.setdefault('TELEGRAM_ADMIN_IDS', '123456789')

sys.path.insert(0, 'backend')

result = pytest.main(['backend/tests/test_bot.py', '-vv', '--maxfail=1', '--tb=long'])
print('PYTEST EXIT CODE', result)
