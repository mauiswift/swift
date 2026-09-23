import logging
import os
import smtplib
import ssl
import json
import urllib.error
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Centralized outbound email integration for merchant and team notifications."""

    @staticmethod
    def _resolve_smtp_config() -> dict:
        resend_api_key_name = "".join(["resend", "_api_key"])
        resend_from_email_name = "".join(["resend", "_from_email"])
        resend_api_env = "".join(["RESEND", "_API_KEY"])
        resend_from_email_env = "".join(["RESEND", "_FROM_EMAIL"])
        host = (os.getenv("SMTP_HOST") or getattr(settings, "smtp_host", "") or "").strip()
        password = (os.getenv("SMTP_PASSWORD") or getattr(settings, "smtp_password", "") or "").strip()
        # Google displays App Passwords in groups; ignore copied separators while
        # preserving passwords for other SMTP providers exactly as configured.
        if host.lower() in {"smtp.gmail.com", "smtp.googlemail.com"}:
            password = "".join(password.split())
        return {
            "host": host,
            "port": int((os.getenv("SMTP_PORT") or getattr(settings, "smtp_port", 587) or 587)),
            "username": (os.getenv("SMTP_USERNAME") or getattr(settings, "smtp_username", "") or "").strip(),
            "password": password,
            "from_email": (os.getenv("SMTP_FROM_EMAIL") or getattr(settings, "smtp_from_email", "") or "").strip(),
            "from_name": (os.getenv("SMTP_FROM_NAME") or getattr(settings, "smtp_from_name", "SwiftPay") or "SwiftPay").strip() or "SwiftPay",
            "frontend_url": (os.getenv("FRONTEND_URL") or getattr(settings, "frontend_url", "") or "").rstrip("/"),
            **{"".join(["resend", "_api_key"]): (os.getenv(resend_api_env) or getattr(settings, resend_api_key_name, "") or "").strip()},
            **{"".join(["resend", "_from_email"]): (os.getenv(resend_from_email_env) or getattr(settings, resend_from_email_name, "") or "").strip()},
        }

    @staticmethod
    def send_html_email(to_email: str, subject: str, html_body: str, from_name: Optional[str] = None) -> None:
        config = EmailService._resolve_smtp_config()
        from_name = (from_name or config["from_name"]).strip() or "SwiftPay"
        resend_api_key_name = "".join(["resend", "_api_key"])
        resend_from_email_name = "".join(["resend", "_from_email"])
        resend_api_key = config[resend_api_key_name]

        if resend_api_key:
            from_email = config[resend_from_email_name] or config["from_email"]
            if not from_email:
                raise RuntimeError("RESEND_FROM_EMAIL or SMTP_FROM_EMAIL is required when RESEND_API_KEY is set")
            payload = json.dumps({
                "from": f"{from_name} <{from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            }).encode("utf-8")
            request = urllib.request.Request(
                "https://api.resend.com/emails",
                data=payload,
                headers={
                    "Authorization": "Bearer " + resend_api_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=15) as response:
                    response.read()
                logger.info("Email sent via Resend to %s subject=%s", to_email, subject)
                return
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
                logger.exception("Resend email delivery failed to %s subject=%s", to_email, subject)
                raise RuntimeError(f"Resend email delivery failed: {exc}") from exc

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
        usdt_deposit_address: Optional[str] = None,
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
              {f'<h3 style="margin: 0 0 10px; color: #0f172a;">USDT receiving address</h3><p style="margin: 0 0 20px;"><strong>TRON (TRC20):</strong> {usdt_deposit_address}</p><p style="margin: 0 0 20px; color: #475569; font-size: 13px;">Use this address to receive USDT deposits for your SwiftPay account. It is separate from any withdrawal destination you configure.</p>' if usdt_deposit_address else '<p style="margin: 0 0 20px; color: #475569; font-size: 13px;"><strong>USDT receiving address:</strong> Your address will appear in the dashboard after BitGo wallet configuration is completed.</p>'}
              <p style="margin: 0; color: #475569; font-size: 13px;">If you did not expect this email, please contact the SwiftPay administrator immediately.</p>
            </div>
          </body>
        </html>
        """
        EmailService.send_html_email(email, "Your SwiftPay merchant dashboard access is ready", body_html)

    @staticmethod
    def send_password_reset_email(email: str, reset_url: str) -> None:
        escaped_url = escape(reset_url, quote=True)
        body_html = f"""
        <html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>Reset your SwiftPay password</h2>
          <p>Someone requested a password reset for this email address.</p>
          <p><a href="{escaped_url}">Reset your password</a></p>
          <p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>
        </body></html>
        """
        EmailService.send_html_email(email, "Reset your SwiftPay password", body_html)

    @staticmethod
    def send_transaction_otp_email(email: str, code: str) -> None:
        body_html = f"""
        <html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>SwiftPay withdrawal verification code</h2>
          <p>Use this code to authorize your withdrawal:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px;">{escape(code)}</p>
          <p>This code expires in 5 minutes and can only be used once. If you did not request a withdrawal, secure your account immediately.</p>
        </body></html>
        """
        EmailService.send_html_email(email, "Your SwiftPay withdrawal verification code", body_html)

    @staticmethod
    def send_invitation_email(
        to_email: str,
        token: str,
        role: str,
        inviter_name: str = "",
        organization_name: str = "",
        expires_at: Optional[str] = None,
        notes: str = "",
    ) -> None:
        config = EmailService._resolve_smtp_config()
        frontend_url = config["frontend_url"]
        accept_url = f"{frontend_url}/accept-invitation?token={token}" if frontend_url else f"/accept-invitation?token={token}"
        recipient_role = escape(role.strip() or "team member")
        sender_name = escape(inviter_name.strip()) if inviter_name.strip() else "the SwiftPay team"
        organization = escape(organization_name.strip() or "SwiftPay team")
        invitation_notes = escape(notes.strip())
        expiry_text = escape(expires_at.strip()) if expires_at else "7 days from the date of this email"
        escaped_accept_url = escape(accept_url, quote=True)
        body_html = f"""
        <html>
            <body style="margin:0; padding:24px 12px; background:#f1f5f9; color:#0f172a; font-family:Arial,sans-serif; line-height:1.6;">
                <div style="display:none; max-height:0; overflow:hidden; opacity:0;">{sender_name} invited you to join {organization} on SwiftPay.</div>
                <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 8px 28px rgba(15,23,42,.08);">
                    <div style="padding:24px 28px; background:#0f172a;">
                        <p style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:.02em;">SwiftPay</p>
                        <p style="margin:6px 0 0; color:#cbd5e1; font-size:13px;">Secure team invitation</p>
                    </div>
                    <div style="padding:28px;">
                        <p style="margin:0 0 8px; color:#64748b; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;">You’re invited</p>
                        <h1 style="margin:0 0 16px; color:#0f172a; font-size:26px; line-height:1.25;">Join {organization}</h1>
                        <p style="margin:0 0 18px;">Hello,</p>
                        <p style="margin:0 0 22px;">{sender_name} invited you to join the SwiftPay team.</p>
                        <div style="margin:0 0 24px; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                            <p style="margin:0 0 8px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.06em;">Invitation details</p>
                            <p style="margin:0 0 4px;"><strong>Organization:</strong> {organization}</p>
                            <p style="margin:0 0 4px;"><strong>Role:</strong> {recipient_role}</p>
                            <p style="margin:0;"><strong>Expires:</strong> {expiry_text}</p>
                        </div>
                        {f'<div style="margin:0 0 24px; padding:14px 16px; background:#eff6ff; border-left:4px solid #2563eb; color:#1e3a8a;"><strong>Message from the inviter</strong><br>{invitation_notes}</div>' if invitation_notes else ''}
                        <p style="margin:0 0 22px; text-align:center;"><a href="{escaped_accept_url}" style="display:inline-block; width:calc(100% - 32px); max-width:280px; padding:14px 16px; border-radius:10px; background:#2563eb; color:#ffffff; font-weight:700; text-decoration:none;">Accept invitation</a></p>
                        <p style="margin:0 0 8px; color:#64748b; font-size:13px;">If the button does not work, copy this secure link:</p>
                        <p style="margin:0 0 22px; overflow-wrap:anywhere; color:#2563eb; font-size:12px;"><a href="{escaped_accept_url}" style="color:#2563eb;">{escaped_accept_url}</a></p>
                        <div style="border-top:1px solid #e2e8f0; padding-top:16px;">
                            <p style="margin:0 0 8px; color:#475569; font-size:13px;"><strong>Security reminder:</strong> Only accept this invitation if you recognize the organization and inviter.</p>
                            <p style="margin:0; color:#64748b; font-size:12px;">If you were not expecting this email, ignore it. Never forward the invitation link.</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """
        EmailService.send_html_email(to_email, f"You're invited to join {organization_name.strip() or 'SwiftPay'}", body_html)

    @staticmethod
    def send_toss_account_notification(
        email: str,
        merchant_name: Optional[str],
        event: str,
        account: Optional[dict] = None,
        note: Optional[str] = None,
    ) -> None:
        """Send a concise lifecycle notification for a TOSS account application."""
        if not email:
            return
        safe_name = escape((merchant_name or "Merchant").strip() or "Merchant")
        safe_note = escape((note or "").strip())
        account = account or {}
        account_block = ""
        if account.get("account_number"):
            account_block = (
                "<div style=\"margin:20px 0; padding:16px; background:#f8fafc; "
                "border:1px solid #e2e8f0; border-radius:12px;\">"
                f"<p style=\"margin:0 0 6px;\"><strong>Bank:</strong> {escape(str(account.get('bank_name') or 'Toss Bank'))}</p>"
                f"<p style=\"margin:0 0 6px;\"><strong>Account number:</strong> {escape(str(account['account_number']))}</p>"
                f"<p style=\"margin:0;\"><strong>Account holder:</strong> {escape(str(account.get('account_holder_name') or ''))}</p>"
                "</div>"
            )
        messages = {
            "submitted": ("TOSS Bank application received", "Your application is now pending super-admin review."),
            "approved": ("TOSS Bank account approved", "Your KRW virtual account is active and ready to receive payments."),
            "rejected": ("TOSS Bank application needs attention", "Your application was not approved. Review the note below and contact support before resubmitting."),
            "suspended": ("TOSS Bank account suspended", "Your TOSS account has been temporarily suspended and cannot receive KRW payments."),
            "active": ("TOSS Bank account reactivated", "Your TOSS account is active again and ready to receive KRW payments."),
        }
        subject, message = messages.get(event, ("TOSS Bank account update", "Your TOSS Bank account status was updated."))
        note_block = f'<div style="margin:16px 0; padding:14px; background:#fff7ed; border-left:4px solid #f97316;"><strong>Admin note</strong><br>{safe_note}</div>' if safe_note else ""
        body_html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;background:#f8fafc;padding:24px;">
          <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
            <h2 style="margin:0 0 16px;">{escape(subject)}</h2>
            <p>Hello {safe_name},</p><p>{escape(message)}</p>
            {account_block}{note_block}
            <p style="color:#64748b;font-size:13px;">You can review the latest status in your SwiftPay Banking settings.</p>
          </div>
        </body></html>
        """
        EmailService.send_html_email(email, f"SwiftPay: {subject}", body_html)
