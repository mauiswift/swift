import urllib.request

from services.email_service import EmailService


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
