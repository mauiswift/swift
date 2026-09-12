"""Telegram bot UX enhancements - improved messages, buttons, and formatting."""

import logging
from typing import Any, Dict, Optional

from services.telegram_service import TelegramService

logger = logging.getLogger(__name__)


class BotEnhancements:
    """Enhanced bot message formatting and user experience."""

    def __init__(self, telegram_service: Optional[TelegramService] = None):
        self.tg = telegram_service or TelegramService()

    async def send_welcome_message(self, chat_id: str, user_name: str = "User") -> Dict[str, Any]:
        """Send an improved welcome message with quick action buttons."""
        welcome_text = f"""
🚀 <b>Welcome to Swift Pay, {user_name}!</b>

<b>What would you like to do?</b>

💸 <b>Send Money</b> - Transfer to a contact
📥 <b>Receive Money</b> - Get paid via payment link
🔗 <b>Payment Link</b> - Generate instant payment link
💰 <b>Wallet</b> - Check balance and history
👥 <b>Downline</b> - Manage your team
⚙️ <b>Settings</b> - Configure preferences

<i>Tap a button or type a command (e.g., /wallet, /send, /receive)</i>
        """

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "💸 Send Money", "callback_data": "action:send"},
                    {"text": "📥 Receive", "callback_data": "action:receive"},
                ],
                [
                    {"text": "🔗 Payment Link", "callback_data": "action:payment_link"},
                    {"text": "💰 Wallet", "callback_data": "action:wallet"},
                ],
                [
                    {"text": "👥 Downline", "callback_data": "action:downline"},
                    {"text": "⚙️ Settings", "callback_data": "action:settings"},
                ],
                [
                    {"text": "❓ Help", "callback_data": "action:help"},
                    {"text": "🌐 Open App", "url": "https://api.swiftpay.site/mini-app"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=welcome_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )

    async def send_wallet_summary(
        self,
        chat_id: str,
        php_balance: float = 0,
        usd_balance: float = 0,
        pending_balance: float = 0,
    ) -> Dict[str, Any]:
        """Send an improved wallet summary with buttons."""
        wallet_text = f"""
💰 <b>Your Wallet</b>

<b>Available Balance:</b>
  PHP: <code>₱{php_balance:,.2f}</code>
  USD: <code>${usd_balance:,.2f}</code>

<b>Pending:</b>
  <code>₱{pending_balance:,.2f}</code>

<b>Quick Actions:</b>
        """

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "📤 Send Money", "callback_data": "action:send"},
                    {"text": "📥 Receive Money", "callback_data": "action:receive"},
                ],
                [
                    {"text": "💸 Withdraw", "callback_data": "action:withdraw"},
                    {"text": "📋 History", "callback_data": "action:history"},
                ],
                [
                    {"text": "🏠 Main Menu", "callback_data": "action:menu"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=wallet_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )

    async def send_payment_link_ready(
        self,
        chat_id: str,
        payment_link: str,
        amount: float = 0,
        currency: str = "PHP",
    ) -> Dict[str, Any]:
        """Send payment link with quick copy and share buttons."""
        link_text = f"""
🔗 <b>Payment Link Generated!</b>

<b>Amount:</b> <code>{amount:,.2f} {currency}</code>

<b>Link:</b>
<code>{payment_link}</code>

<b>Share this link to get paid instantly!</b>
        """

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "📋 Copy Link", "callback_data": f"copy_link:{payment_link}"},
                    {"text": "🔗 Open Link", "url": payment_link},
                ],
                [
                    {"text": "📤 Share via Telegram", "switch_inline_query": payment_link},
                ],
                [
                    {"text": "↩️ Back to Menu", "callback_data": "action:menu"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=link_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )

    async def send_transaction_status(
        self,
        chat_id: str,
        txn_id: str,
        amount: float,
        currency: str,
        status: str,
        from_user: str = "",
        to_user: str = "",
    ) -> Dict[str, Any]:
        """Send improved transaction status notification."""
        status_emoji = {
            "completed": "✅",
            "pending": "⏳",
            "failed": "❌",
            "processing": "🔄",
        }.get(status, "❓")

        status_text_map = {
            "completed": "Completed",
            "pending": "Pending",
            "failed": "Failed",
            "processing": "Processing",
        }

        txn_text = f"""
{status_emoji} <b>Transaction {status_text_map.get(status, status)}</b>

<b>Amount:</b> <code>{amount:,.2f} {currency}</code>
<b>Transaction ID:</b> <code>{txn_id}</code>
<b>Status:</b> <code>{status}</code>
        """

        if from_user:
            txn_text += f"\n<b>From:</b> <code>{from_user}</code>"
        if to_user:
            txn_text += f"\n<b>To:</b> <code>{to_user}</code>"

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "📊 View Details", "callback_data": f"txn_details:{txn_id}"},
                    {"text": "💰 Wallet", "callback_data": "action:wallet"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=txn_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )

    async def send_help_menu(self, chat_id: str) -> Dict[str, Any]:
        """Send comprehensive help menu."""
        help_text = """
<b>📚 Swift Pay Bot Help</b>

<b>🚀 Getting Started:</b>
  /start - Welcome & quick actions
  /help - This help menu

<b>💰 Wallet & Money:</b>
  /wallet - Check balance & history
  /send - Send money to contact
  /receive - Generate receive link
  /withdraw - Withdraw to bank

<b>🔗 Payment Links:</b>
  /payment_link - Create payment link
  /my_links - View your links
  /link_status - Check link status

<b>👥 Downline Management:</b>
  /downline - View your team
  /commissions - Check earnings
  /reports - Generate reports

<b>⚙️ Account:</b>
  /settings - Account settings
  /profile - Edit profile
  /security - Security settings
  /notifications - Notification settings

<b>🔐 Security:</b>
  /setpin - Set transaction PIN
  /2fa - Enable 2-factor auth

<b>🆘 Support:</b>
  /support - Contact support
  /status - Check system status
  /faq - Frequently asked questions

<i>👉 Tap any command or use the menu buttons for quick actions!</i>
        """

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "🏠 Main Menu", "callback_data": "action:menu"},
                    {"text": "🌐 Open Web App", "url": "https://api.swiftpay.site/mini-app"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=help_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )

    async def send_error_message(
        self,
        chat_id: str,
        error: str,
        suggestion: str = "",
    ) -> Dict[str, Any]:
        """Send user-friendly error message."""
        error_text = f"""
❌ <b>Something went wrong</b>

<b>Error:</b> {error}
        """

        if suggestion:
            error_text += f"\n<b>💡 Try:</b> {suggestion}"

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "🔄 Try Again", "callback_data": "action:retry"},
                    {"text": "🏠 Main Menu", "callback_data": "action:menu"},
                ],
                [
                    {"text": "🆘 Get Help", "callback_data": "action:help"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=error_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )

    async def send_success_message(
        self,
        chat_id: str,
        title: str,
        details: str,
        action_text: str = "Continue",
    ) -> Dict[str, Any]:
        """Send success confirmation message."""
        success_text = f"""
✅ <b>{title}</b>

{details}
        """

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": f"✓ {action_text}", "callback_data": "action:menu"},
                ],
            ]
        }

        return await self.tg.send_message(
            chat_id=chat_id,
            text=success_text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )
