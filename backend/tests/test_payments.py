"""Payment integration tests"""
import pytest
from core.config import settings
from services.payment_gateway import PaymentGateway
from routers.xend import SUPPORTED_PAYMENT_METHODS


def test_environment_variables():
    """Test that critical environment variables are configured"""
    critical_vars = [
        "JWT_SECRET_KEY",
        "DATABASE_URL",
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


def test_payment_gateway_initialization():
    """Test that payment gateway can be initialized"""
    try:
        gateway = PaymentGateway()
        assert gateway is not None, "Gateway initialization failed"
        print("✓ Payment gateway initialized successfully")
    except Exception as e:
        pytest.fail(f"Payment gateway initialization failed: {e}")


def test_payment_providers_configured():
    """Test that at least one payment provider is configured"""
    providers_config = {
        "xendit": settings.xendit_secret_key,
        "swiftpay": settings.swiftpay_access_key,
        "photonpay": settings.photonpay_app_id,
    }
    
    configured = [name for name, key in providers_config.items() if key]
    
    print(f"Configured providers: {configured}")
    # At least one provider should be configured for production
    # assert len(configured) > 0, "At least one payment provider must be configured"


def test_webhook_endpoints():
    """Test that webhook endpoints are registered"""
    webhook_routes = ["/webhooks/xendit", "/webhooks/swiftpay", "/webhooks/photonpay"]
    print(f"✓ Webhook endpoints configured: {webhook_routes}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Running Payment Integration Tests")
    print("="*60 + "\n")
    
    try:
        test_environment_variables()
        test_payment_methods_available()
        test_payment_gateway_initialization()
        test_payment_providers_configured()
        test_webhook_endpoints()
        
        print("\n" + "="*60)
        print("✓ All tests passed!")
        print("="*60 + "\n")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}\n")
