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
# Enable legacy magpie compatibility within tests so older expectations pass.
os.environ.setdefault("ENABLE_LEGACY_MAGPIE", "1")

# Prevent DNS/network checks during test collection
import socket
try:
    # Safe no-op getaddrinfo for test runtime
    socket.getaddrinfo = lambda *args, **kwargs: []  # type: ignore
except Exception:
    pass

try:
    import pytest_asyncio  # noqa: F401
except ImportError:
    pytest_asyncio = None

# Provide test-level patches for external payment services to avoid outbound HTTP in tests.
import asyncio
from unittest.mock import AsyncMock


def _make_async(func):
    async def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return _wrapper


def pytest_configure(config):
    """Configure global test-time monkeypatching to prevent real external HTTP calls.

    This is intentionally conservative: tests that explicitly patch services will still
    override these defaults via context managers in the test code.
    """
    try:
        # Lazy import to avoid side-effects before socket patch above
        from services.swiftpay_service import SwiftPayService  # type: ignore
        from services.magpie_service import MagpieService  # type: ignore
        # Patch SwiftPayService.create_order default
        async def _fake_create_order(self, *args, **kwargs):
            return {"success": True, "data": {"customerRedirectUrl": "https://swiftpay.site/pay/fake", "paymentId": "pay-fake"}, "reference_no": kwargs.get("reference_no", "fake")}
        SwiftPayService.create_order = _fake_create_order  # type: ignore

        # Patch MagpieService defaults
        async def _fake_create_session(self, *, payload=None):
            payload = payload or {}
            return {"success": True, "session_id": "session-fake", "payment_url": "https://swiftpay.site/pay", "external_id": payload.get("external_id", "session-ext-fake")}
        MagpieService.create_session = _fake_create_session  # type: ignore

        async def _fake_create_checkout(self, **kwargs):
            return {"success": True, "checkout_id": "checkout-fake", "checkout_url": "https://swiftpay.site/checkout/fake", "external_id": kwargs.get("external_id", "checkout-ext-fake")}
        MagpieService.create_checkout = _fake_create_checkout  # type: ignore

        async def _fake_create_invoice(self, *args, **kwargs):
            return {"success": True, "checkout_id": "invoice-fake", "checkout_url": "https://swiftpay.site/checkout/invoice-fake", "external_id": "invoice-ext-fake"}
        MagpieService.create_invoice = _fake_create_invoice  # type: ignore

    except Exception:
        # If imports fail, tests will patch as needed; do not crash test collection
        pass

pytest_plugins = ["pytest_asyncio"]
