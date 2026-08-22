from unittest.mock import patch

from routers.kyb import _send_merchant_credentials_email


def test_send_merchant_credentials_email_sends_credentials(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_FROM_EMAIL", "noreply@swiftpay.site")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USERNAME", "smtp-user")
    monkeypatch.setenv("SMTP_PASSWORD", "smtp-pass")
    monkeypatch.setenv("SMTP_FROM_NAME", "SwiftPay")
    monkeypatch.setenv("FRONTEND_URL", "https://merchant.swiftpay.site")

    sent_messages = []

    class FakeSMTP:
        def __init__(self, host, port):
            self.host = host
            self.port = port

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def ehlo(self):
            return None

        def starttls(self, context=None):
            return None

        def login(self, username, password):
            return None

        def sendmail(self, from_email, to_email, msg):
            sent_messages.append((from_email, to_email, msg))

    with patch("smtplib.SMTP", FakeSMTP), patch("ssl.create_default_context", return_value=object()):
                _send_merchant_credentials_email(
            "merchant@example.com",
            "SecretPass1!",
            "sk_test_abc123",
            "sk_live_def456",
            "Acme Services",
        )
    assert len(sent_messages) == 1
    from_email, to_email, msg = sent_messages[0]
    assert from_email == "noreply@swiftpay.site"
    assert to_email == "merchant@example.com"
    assert "Acme Services" in msg
    assert "merchant@example.com" in msg
    assert "SecretPass1!" in msg
    assert "sk_test_abc123" in msg
    assert "sk_live_def456" in msg
    assert "https://merchant.swiftpay.site/login" in msg
    assert "https://merchant.swiftpay.site/api-docs" in msg
    assert "Integration guide" in msg
