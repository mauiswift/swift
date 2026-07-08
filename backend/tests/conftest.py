import os
import tempfile
from pathlib import Path

# Ensure background tasks are disabled during tests to avoid flakiness
os.environ.setdefault("DISABLE_BACKGROUND_TASKS", "1")

# Use a safe local test environment so production startup validation does not block pytest.
_tmp_db_dir = Path(tempfile.gettempdir())
_os_db_path = _tmp_db_dir / f"test_paybot_{os.getpid()}.db"
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_os_db_path.as_posix()}")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-ci")
os.environ.setdefault("TELEGRAM_BOT_TOKEN", "123456:TEST_BOT_TOKEN")
os.environ.setdefault("TELEGRAM_ADMIN_IDS", "123456789")
os.environ.setdefault("INITIALIZE_DEMO_DATA", "1")

try:
    import pytest_asyncio  # noqa: F401
except ImportError:
    pytest_asyncio = None

pytest_plugins = ["pytest_asyncio"]
