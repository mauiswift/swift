from core.config import Settings
from services.checkout_urls import build_checkout_url, canonicalize_checkout_url, checkout_host


def test_checkout_host_is_shared_by_all_currencies(monkeypatch):
    monkeypatch.setattr(
        "services.checkout_urls.settings",
        Settings(public_checkout_host="https://swiftpay.site"),
    )

    assert checkout_host("KRW") == "https://kr.swiftpay.site"
    assert checkout_host("PHP") == "https://kr.swiftpay.site"
    assert checkout_host("CNY") == "https://kr.swiftpay.site"
    assert build_checkout_url("PUBLIC-PAY-123", "PHP") == (
        "https://kr.swiftpay.site/checkout/PUBLIC-PAY-123"
    )


def test_canonicalize_checkout_url_preserves_provider_urls(monkeypatch):
    monkeypatch.setattr(
        "services.checkout_urls.settings",
        Settings(public_checkout_host="https://swiftpay.site"),
    )

    assert canonicalize_checkout_url("/checkout/PUBLIC-PAY-123", "KRW") == (
        "https://kr.swiftpay.site/checkout/PUBLIC-PAY-123"
    )
    provider_url = "https://checkout.provider.example/session/abc"
    assert canonicalize_checkout_url(provider_url, "KRW") == provider_url
