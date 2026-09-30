from core.config import Settings
from services.checkout_urls import build_checkout_url, canonicalize_checkout_url, checkout_host


def test_checkout_host_uses_currency_specific_hosts(monkeypatch):
    monkeypatch.setattr(
        "services.checkout_urls.settings",
        Settings(
            public_checkout_host="https://swiftpay.site",
            krw_checkout_host="https://kr.swiftpay.site",
        ),
    )

    assert checkout_host("KRW") == "https://kr.swiftpay.site"
    assert checkout_host("PHP") == "https://swiftpay.site"
    assert checkout_host("CNY") == "https://swiftpay.site"
    assert build_checkout_url("PUBLIC-PAY-123", "PHP") == (
        "https://swiftpay.site/checkout/PUBLIC-PAY-123"
    )
    assert build_checkout_url("KRW-PAY-123", "KRW") == (
        "https://kr.swiftpay.site/checkout/KRW-PAY-123"
    )


def test_checkout_host_defaults_to_site_domains(monkeypatch):
    monkeypatch.delenv("PUBLIC_CHECKOUT_HOST", raising=False)
    monkeypatch.delenv("KRW_CHECKOUT_HOST", raising=False)
    defaults = Settings(_env_file=None)
    monkeypatch.setattr("services.checkout_urls.settings", defaults)

    assert defaults.public_checkout_host == "https://swiftpay.site"
    assert defaults.krw_checkout_host == "https://kr.swiftpay.site"
    assert checkout_host("PHP") == "https://swiftpay.site"
    assert checkout_host("KRW") == "https://kr.swiftpay.site"


def test_canonicalize_checkout_url_preserves_provider_urls(monkeypatch):
    monkeypatch.setattr(
        "services.checkout_urls.settings",
        Settings(
            public_checkout_host="https://swiftpay.site",
            krw_checkout_host="https://kr.swiftpay.site",
        ),
    )

    assert canonicalize_checkout_url("/checkout/PUBLIC-PAY-123", "KRW") == (
        "https://kr.swiftpay.site/checkout/PUBLIC-PAY-123"
    )
    provider_url = "https://checkout.provider.example/session/abc"
    assert canonicalize_checkout_url(provider_url, "KRW") == provider_url
