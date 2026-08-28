import logging
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Centralized outbound email integration for merchant and team notifications."""

    @staticmethod
    def _resolve_smtp_config() -> dict:
        return {
            "host": (os.getenv("SMTP_HOST") or getattr(settings, "smtp_host", "") or "").strip(),
            "port": int((os.getenv("SMTP_PORT") or getattr(settings, "smtp_port", 587) or 587)),
            "username": (os.getenv("SMTP_USERNAME") or getattr(settings, "smtp_username", "") or "").strip(),
            "password": (os.getenv("SMTP_PASSWORD") or getattr(settings, "smtp_password", "") or "").strip(),
            "from_email": (os.getenv("SMTP_FROM_EMAIL") or getattr(settings, "smtp_from_email", "") or "").strip(),
            "from_name": (os.getenv("SMTP_FROM_NAME") or getattr(settings, "smtp_from_name", "SwiftPay") or "SwiftPay").strip() or "SwiftPay",
            "frontend_url": (os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").rstrip("/"),
        }

    @staticmethod
    def send_html_email(to_email: str, subject: str, html_body: str, from_name: Optional[str] = None) -> None:
        config = EmailService._resolve_smtp_config()
        smtp_host = config["host"]
        smtp_from = config["from_email"]
        if not smtp_host or not smtp_from:
            logger.warning(
                "SMTP is not configured for email delivery to %s; subject=%s",
                to_email,
                subject,
            )
            raise RuntimeError("Email sending is not configured on this server")

        try:
            from_name = (from_name or config["from_name"]).strip() or "SwiftPay"
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{smtp_from}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            context = ssl.create_default_context()
            if config["port"] == 465:
                server_connection = smtplib.SMTP_SSL(smtp_host, config["port"], context=context)
            else:
                server_connection = smtplib.SMTP(smtp_host, config["port"])

            with server_connection as server:
                server.ehlo()
                if config["port"] != 465:
                    server.starttls(context=context)
                    server.ehlo()
                if config["username"] and config["password"]:
                    server.login(config["username"], config["password"])
                server.sendmail(smtp_from, to_email, msg.as_string())

            logger.info("Email sent to %s subject=%s", to_email, subject)
        except Exception:
            logger.exception("Failed to send email to %s subject=%s", to_email, subject)
            raise

    @staticmethod
    def send_merchant_credentials_email(
        email: str,
        password: str,
        test_access_key: str,
        live_access_key: str,
        merchant_name: Optional[str] = None,
        login_url: Optional[str] = None,
        integration_guide_url: Optional[str] = None,
    ) -> None:
        if not email:
            return
        config = EmailService._resolve_smtp_config()
        frontend_url = config["frontend_url"]
        login_url = login_url or (f"{frontend_url}/login" if frontend_url else "/login")
        integration_guide_url = integration_guide_url or (f"{frontend_url}/api-docs" if frontend_url else "/api-docs")
        friendly_name = (merchant_name or "Merchant").strip() or "Merchant"

        body_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
            <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
              <h2 style="margin: 0 0 16px; color: #0f172a;">Your SwiftPay merchant access is ready</h2>
              <p style="margin: 0 0 14px;">Hi {friendly_name},</p>
              <p style="margin: 0 0 18px;">Your registration has been approved and your merchant dashboard credentials are below. Use the login page below to access the platform and begin integrating SwiftPay for your app or store.</p>
              <p style="margin: 0 0 6px;"><strong>Login URL:</strong> <a href="{login_url}">{login_url}</a></p>
              <p style="margin: 0 0 6px;"><strong>Email:</strong> {email}</p>
              <p style="margin: 0 0 6px;"><strong>Password:</strong> {password}</p>
              <p style="margin: 0 0 18px;"><strong>Important:</strong> Please change this password after your first login.</p>
              <h3 style="margin: 0 0 10px; color: #0f172a;">Integration guide</h3>
              <p style="margin: 0 0 18px;">Follow the integration steps here to connect your app or store to SwiftPay: <a href="{integration_guide_url}">{integration_guide_url}</a></p>
              <h3 style="margin: 0 0 10px; color: #0f172a;">Integration credentials</h3>
              <p style="margin: 0 0 6px;"><strong>Test Access Key:</strong> {test_access_key}</p>
              <p style="margin: 0 0 20px;"><strong>Live Access Key:</strong> {live_access_key}</p>
              <p style="margin: 0; color: #475569; font-size: 13px;">If you did not expect this email, please contact the SwiftPay administrator immediately.</p>
            </div>
          </body>
        </html>
        """
        EmailService.send_html_email(email, "Your SwiftPay merchant dashboard access is ready", body_html)

    @staticmethod
    def send_invitation_email(to_email: str, token: str, role: str, inviter_name: str = "") -> None:
        config = EmailService._resolve_smtp_config()
        frontend_url = config["frontend_url"]
        accept_url = f"{frontend_url}/accept-invitation?token={token}" if frontend_url else f"/accept-invitation?token={token}"
        body_html = f"""
        <html>
            <body>
                <p>You have been invited to join as <strong>{role}</strong>.</p>
                <p>Click the link below to accept your invitation (expires in 7 days):</p>
                <p><a href="{accept_url}">{accept_url}</a></p>
                <p>If you did not expect this invitation, you can ignore this email.</p>
            </body>
        </html>
        """
        EmailService.send_html_email(to_email, "You've been invited to PayBot", body_html)
