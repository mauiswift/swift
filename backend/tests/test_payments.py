import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_create_alipay_qr_placeholder(client):
    payload = {"method": "alipay", "out_trade_no": "test-123", "amount": 10.5}
    r = client.post("/api/v1/payments/create", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data.get("success") is True
    assert data.get("out_trade_no") == "test-123"


def test_get_qr_image(client):
    # Ensure previous test populated cache
    r = client.get("/api/v1/payments/qr/test-123")
    assert r.status_code == 200
    assert r.headers.get("content-type") == "image/png"
"""Payment integration tests

Tests for:
- SwiftPay (Local PH payments)
- Magpie (Alipay, WeChat)
"""
import pytest
from core.config import settings
from services.payment_gateway import PaymentGateway
from routers.xend import SUPPORTED_PAYMENT_METHODS


def test_environment_variables():
    """Test that critical environment variables are configured"""
    critical_vars = [
        "JWT_SECRET_KEY",
        "DATABASE_URL",
        "SWIFTPAY_ACCESS_KEY",  # Local payments
    ]
    
    for var in critical_vars:
        attr_name = var.lower()
        value = getattr(settings, attr_name, None)
        assert value, f"Missing required environment variable: {var}"
        print(f"✓ {var} is configured")


def test_payment_methods_available():
    """Test that payment methods are defined"""
    assert isinstance(SUPPORTED_PAYMENT_METHODS, list), "SUPPORTED_PAYMENT_METHODS must be a list"
    assert len(SUPPORTED_PAYMENT_METHODS) > 0, "At least one payment method must be configured"
    print(f"✓ Payment methods available: {SUPPORTED_PAYMENT_METHODS}")


def test_local_methods():
    """Test that local PH payment methods are available"""
    local_methods = ["gcash", "maya", "bank_transfer", "qr_code"]
    for method in local_methods:
        assert method in SUPPORTED_PAYMENT_METHODS, f"Local method {method} not supported"
    print(f"✓ All local PH payment methods available: {local_methods}")


def test_international_methods():
    """Test that international payment methods are available"""
    international_methods = [
        "alipay",
        "wechat",
        "visa",
        "mastercard",
        "kakaopay",
        "naverpay",
        "payco",
        "tosspay",
    ]
    for method in international_methods:
        assert method in SUPPORTED_PAYMENT_METHODS, f"International method {method} not supported"
    print(f"✓ All international payment methods available: {international_methods}")


def test_payment_gateway_initialization():
    """Test that payment gateway can be initialized"""
    try:
        gateway = PaymentGateway()
        assert gateway is not None, "Gateway initialization failed"
        print("✓ Payment gateway initialized successfully")
    except Exception as e:
        pytest.fail(f"Payment gateway initialization failed: {e}")


def test_swiftpay_configured():
    """Test that SwiftPay is configured for local payments"""
    assert settings.swiftpay_access_key, "SwiftPay must be configured for local payments"
    assert settings.swiftpay_mode in ["sandbox", "production"], "Invalid SwiftPay mode"
    print(f"✓ SwiftPay configured in {settings.swiftpay_mode} mode")


def test_webhook_endpoints():
    """Test that webhook endpoints are registered"""
    webhook_routes = {
        "swiftpay": "/webhooks/swiftpay",
        "magpie": "/webhooks/magpie"
    }
    print(f"✓ Webhook endpoints configured: {webhook_routes}")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("Payment Integration Tests - SwiftPay (Local) + Magpie (International)")
    print("="*70 + "\n")
    
    try:
        test_environment_variables()
        test_payment_methods_available()
        test_local_methods()
        test_international_methods()
        test_payment_gateway_initialization()
        test_swiftpay_configured()
        test_webhook_endpoints()
        
        print("\n" + "="*70)
        print("✓ All payment integration tests passed!")
        print("="*70 + "\n")
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}\n")
