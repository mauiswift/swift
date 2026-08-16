import os
import tempfile
from pathlib import Path

# Ensure background tasks are disabled during tests to avoid flakiness
os.environ.setdefault("DISABLE_BACKGROUND_TASKS", "1")

# Use a safe local test environment so production startup validation does not block pytest.
# Explicit assignments win over any inherited local/CI env values so the suite is deterministic.
_tmp_db_dir = Path(tempfile.gettempdir())
_os_db_path = _tmp_db_dir / f"test_paybot_{os.getpid()}.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_os_db_path.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-ci"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456:TEST_BOT_TOKEN"
os.environ["TELEGRAM_ADMIN_IDS"] = "123456789"
os.environ["INITIALIZE_DEMO_DATA"] = "1"

try:
    import pytest_asyncio  # noqa: F401
except ImportError:
    pytest_asyncio = None

pytest_plugins = ["pytest_asyncio"]
