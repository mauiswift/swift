from services.paymentwall_service import PaymentwallService


def configured_service(monkeypatch):
    service = PaymentwallService()
    service.app_key = "app-key"
    service.secret_key = "secret-key"
    service.widget_code = "w123"
    service.is_configured = True
    return service


def test_widget_url_uses_signed_krw_parameters(monkeypatch):
    service = configured_service(monkeypatch)

    result = service.create_widget_url(
        user_id="merchant-1",
        amount=1250,
        reference_id="order-123",
        description="Wallet top-up",
    )

    assert result["success"] is True
    assert "currencyCode=KRW" in result["payment_url"]
    assert result["data"]["sign"] == service.calculate_signature(result["data"], "secret-key", 3)


def test_widget_rejects_non_krw(monkeypatch):
    service = configured_service(monkeypatch)

    result = service.create_widget_url(
        user_id="merchant-1",
        amount=10,
        currency="PHP",
        reference_id="order-123",
    )

    assert result == {"success": False, "error": "Paymentwall collection is restricted to KRW"}


def test_pingback_signature_is_verified(monkeypatch):
    service = configured_service(monkeypatch)
    parameters = {"uid": "merchant-1", "goodsid": "order-123", "type": "0", "ref": "order-123", "sign_version": "2"}
    parameters["sig"] = service.calculate_signature(parameters, "secret-key", 2)

    assert service.validate_pingback(parameters) is True
    parameters["ref"] = "tampered"
    assert service.validate_pingback(parameters) is False