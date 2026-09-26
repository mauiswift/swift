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
# Enable legacy magpie compatibility within tests so older expectations pass.
os.environ.setdefault("ENABLE_LEGACY_MAGPIE", "1")
# Ensure Magpie appears configured in tests so magpie routing is exercised by the gateway
os.environ.setdefault("MAGPIE_API_KEY", "test-magpie-key")

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
        # Patch MagpieService defaults (keep provider fakes to avoid outbound HTTP when tests don't mock them)
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

        # Patch Magpie QR service used by Alipay/WeChat fallbacks
        try:
            from services.magpie_qr_service import MagpieQRService

            async def _fake_create_alipay_qr(self, amount: float, description: str = "", currency: str = "PHP", reference_id: Optional[str] = None, customer_name: Optional[str] = None, customer_email: Optional[str] = None, **kwargs):
                return {"success": True, "payment_url": "https://swiftpay.site/pay/fake", "qr_url": "https://swiftpay.site/pay/fake", "reference_id": reference_id}

            async def _fake_create_wechat_qr(self, amount: float, description: str = "", currency: str = "PHP", reference_id: Optional[str] = None, customer_name: Optional[str] = None, customer_email: Optional[str] = None, **kwargs):
                return {"success": True, "payment_url": "https://swiftpay.site/pay/fake", "qr_url": "https://swiftpay.site/pay/fake", "reference_id": reference_id}

            MagpieQRService.create_alipay_qr = _fake_create_alipay_qr  # type: ignore
            MagpieQRService.create_wechat_qr = _fake_create_wechat_qr  # type: ignore

            async def _fake_create_checkout_session(self, payment_method: str, amount: float, currency: str = "CNY", reference_id: Optional[str] = None, description: str = "", customer_name: Optional[str] = None, success_url: Optional[str] = None, cancel_url: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, **kwargs):
                return {"success": True, "checkout_url": "https://swiftpay.site/checkout/fake", "qr_url": "https://swiftpay.site/checkout/fake", "reference_id": reference_id}

            MagpieQRService.create_checkout_session = _fake_create_checkout_session  # type: ignore
        except Exception:
            pass

    except Exception:
        # If imports fail, tests will patch as needed; do not crash test collection
        pass

pytest_plugins = ["pytest_asyncio"]
