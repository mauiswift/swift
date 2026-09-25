import urllib.request

from core.config import settings
from services.email_service import EmailService
from routers.team_invitations import _invitation_link


class _Headers(dict):
    def get(self, key, default=None):
        return super().get(key.lower(), default)


class _FakeRequest:
    def __init__(self, headers):
        self.headers = _Headers(headers)


def test_gmail_app_password_removes_display_spaces(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setenv("SMTP_PASSWORD", "abcd efgh ijkl mnop")

    config = EmailService._resolve_smtp_config()

    assert config["password"] == "abcdefghijklmnop"


def test_send_html_email_uses_bearer_token_for_resend(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "test-api-key")
    monkeypatch.setenv("RESEND_FROM_EMAIL", "noreply@example.com")

    captured = {}

    class DummyResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return b"ok"

    def fake_urlopen(request, timeout=15):
        captured["headers"] = request.headers
        return DummyResponse()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    EmailService.send_html_email("user@example.com", "Invitation", "<p>Hello</p>")

    assert captured["headers"]["Authorization"] == "Bearer test-api-key"


def test_invitation_link_uses_request_host_when_frontend_url_is_missing(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    settings.frontend_url = ""
    request = _FakeRequest({
        "x-forwarded-proto": "https",
        "x-forwarded-host": "app.swiftpay.site",
    })

    link = _invitation_link("abc123", request=request)

    assert link == "https://app.swiftpay.site/accept-invitation?token=abc123"
