"""Service for sending admin notifications via Telegram bot with approval buttons."""

import logging
from typing import Any, Dict, Optional
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.admin_users import AdminUser
from services.telegram_service import TelegramService

logger = logging.getLogger(__name__)


class AdminNotificationsService:
    """Send notifications to super admins via Telegram with inline approval buttons."""

    def __init__(self, db: AsyncSession, telegram_service: Optional[TelegramService] = None):
        self.db = db
        self.telegram = telegram_service or TelegramService()

    async def get_super_admin_telegram_ids(self) -> list[str]:
        """Get all super admin Telegram IDs."""
        try:
            result = await self.db.execute(
                select(AdminUser.telegram_id).where(
                    AdminUser.is_super_admin == True,
                    AdminUser.telegram_id.isnot(None)
                )
            )
            return [row[0] for row in result.all() if row[0]]
        except Exception as e:
            logger.error(f"Error fetching super admin telegram IDs: {e}")
            return []

    async def notify_payment_approval_pending(
        self,
        payment_id: str,
        amount: float,
        currency: str = "PHP",
        customer_name: str = "Unknown",
        description: str = "",
        external_id: str = "",
    ) -> Dict[str, Any]:
        """Notify super admins about pending payment approval."""
        try:
            admin_ids = await self.get_super_admin_telegram_ids()
            if not admin_ids:
                logger.warning("No super admin telegram IDs found")
                return {"success": False, "error": "No super admins configured"}

            # Format message
            title = "💳 Payment Awaiting Approval"
            message = f"""
<b>{title}</b>

<b>Payment ID:</b> <code>{external_id or payment_id}</code>
<b>Amount:</b> {amount:,.2f} {currency}
<b>Customer:</b> {customer_name}
<b>Description:</b> {description or "N/A"}
<b>Received:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC

Please review and approve or reject this payment.
"""

            # Inline buttons for approval/rejection
            reply_markup = {
                "inline_keyboard": [
                    [
                        {
                            "text": "✅ Approve",
                            "callback_data": f"approve_payment:{payment_id}",
                        },
                        {
                            "text": "❌ Reject",
                            "callback_data": f"reject_payment:{payment_id}",
                        },
                    ],
                    [
                        {
                            "text": "📋 View Details",
                            "url": f"https://app.swiftpay.site/payment-approvals",
                        },
                    ],
                ]
            }

            # Send to all super admins
            results = []
            for admin_id in admin_ids:
                result = await self.telegram.send_message(
                    chat_id=admin_id,
                    text=message,
                    parse_mode="HTML",
                    reply_markup=reply_markup,
                )
                results.append(result)
                if result.get("success"):
                    logger.info(f"Sent payment approval notification to admin {admin_id}")
                else:
                    logger.error(f"Failed to notify admin {admin_id}: {result.get('error')}")

            return {
                "success": all(r.get("success") for r in results),
                "notified_count": sum(1 for r in results if r.get("success")),
            }

        except Exception as e:
            logger.error(f"Error notifying payment approval: {e}")
            return {"success": False, "error": str(e)}

    async def notify_topup_request(
        self,
        topup_id: str,
        user_id: str,
        amount: float,
        currency: str = "PHP",
        reference: str = "",
    ) -> Dict[str, Any]:
        """Notify super admins about pending topup request."""
        try:
            admin_ids = await self.get_super_admin_telegram_ids()
            if not admin_ids:
                return {"success": False, "error": "No super admins configured"}

            title = "📤 Top-up Request Received"
            message = f"""
<b>{title}</b>

<b>Top-up ID:</b> <code>{topup_id}</code>
<b>User ID:</b> <code>{user_id}</code>
<b>Amount:</b> {amount:,.2f} {currency}
<b>Reference:</b> {reference or "N/A"}
<b>Received:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC

Please verify and approve or reject this top-up request.
"""

            reply_markup = {
                "inline_keyboard": [
                    [
                        {
                            "text": "✅ Approve",
                            "callback_data": f"approve_topup:{topup_id}",
                        },
                        {
                            "text": "❌ Reject",
                            "callback_data": f"reject_topup:{topup_id}",
                        },
                    ],
                    [
                        {
                            "text": "📋 View Details",
                            "url": f"https://app.swiftpay.site/topup-requests",
                        },
                    ],
                ]
            }

            results = []
            for admin_id in admin_ids:
                result = await self.telegram.send_message(
                    chat_id=admin_id,
                    text=message,
                    parse_mode="HTML",
                    reply_markup=reply_markup,
                )
                results.append(result)

            return {
                "success": all(r.get("success") for r in results),
                "notified_count": sum(1 for r in results if r.get("success")),
            }

        except Exception as e:
            logger.error(f"Error notifying topup request: {e}")
            return {"success": False, "error": str(e)}

    async def notify_payment_link_created(
        self,
        link_id: str,
        amount: float,
        currency: str = "PHP",
        description: str = "",
        created_by: str = "",
    ) -> Dict[str, Any]:
        """Notify super admins about new payment link creation."""
        try:
            admin_ids = await self.get_super_admin_telegram_ids()
            if not admin_ids:
                return {"success": False, "error": "No super admins configured"}

            title = "🔗 New Payment Link Created"
            message = f"""
<b>{title}</b>

<b>Link ID:</b> <code>{link_id}</code>
<b>Amount:</b> {amount:,.2f} {currency}
<b>Description:</b> {description or "N/A"}
<b>Created By:</b> {created_by or "System"}
<b>Created:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC

Track this payment link for incoming transactions.
"""

            reply_markup = {
                "inline_keyboard": [
                    [
                        {
                            "text": "👁️ View Link",
                            "url": f"https://app.swiftpay.site/payment-approvals",
                        },
                    ],
                ]
            }

            results = []
            for admin_id in admin_ids:
                result = await self.telegram.send_message(
                    chat_id=admin_id,
                    text=message,
                    parse_mode="HTML",
                    reply_markup=reply_markup,
                )
                results.append(result)

            return {
                "success": all(r.get("success") for r in results),
                "notified_count": sum(1 for r in results if r.get("success")),
            }

        except Exception as e:
            logger.error(f"Error notifying payment link creation: {e}")
            return {"success": False, "error": str(e)}

    async def notify_withdrawal_request(
        self,
        withdrawal_id: str,
        user_id: str,
        amount: float,
        currency: str = "PHP",
        destination: str = "",
    ) -> Dict[str, Any]:
        """Notify super admins about withdrawal request."""
        try:
            admin_ids = await self.get_super_admin_telegram_ids()
            if not admin_ids:
                return {"success": False, "error": "No super admins configured"}

            title = "💸 Withdrawal Request Pending"
            message = f"""
<b>{title}</b>

<b>Withdrawal ID:</b> <code>{withdrawal_id}</code>
<b>User ID:</b> <code>{user_id}</code>
<b>Amount:</b> {amount:,.2f} {currency}
<b>Destination:</b> {destination or "N/A"}
<b>Requested:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC

Please verify and approve or reject this withdrawal.
"""

            reply_markup = {
                "inline_keyboard": [
                    [
                        {
                            "text": "✅ Approve",
                            "callback_data": f"approve_withdrawal:{withdrawal_id}",
                        },
                        {
                            "text": "❌ Reject",
                            "callback_data": f"reject_withdrawal:{withdrawal_id}",
                        },
                    ],
                    [
                        {
                            "text": "📋 View Details",
                            "url": f"https://app.swiftpay.site/withdrawals",
                        },
                    ],
                ]
            }

            results = []
            for admin_id in admin_ids:
                result = await self.telegram.send_message(
                    chat_id=admin_id,
                    text=message,
                    parse_mode="HTML",
                    reply_markup=reply_markup,
                )
                results.append(result)

            return {
                "success": all(r.get("success") for r in results),
                "notified_count": sum(1 for r in results if r.get("success")),
            }

        except Exception as e:
            logger.error(f"Error notifying withdrawal request: {e}")
            return {"success": False, "error": str(e)}

    async def notify_generic_request(
        self,
        request_type: str,
        request_id: str,
        title: str,
        details: Dict[str, str],
        action_buttons: Optional[list] = None,
        detail_url: str = "",
    ) -> Dict[str, Any]:
        """Send generic notification for any admin request."""
        try:
            admin_ids = await self.get_super_admin_telegram_ids()
            if not admin_ids:
                return {"success": False, "error": "No super admins configured"}

            # Build message
            message = f"<b>{title}</b>\n\n"
            for key, value in details.items():
                message += f"<b>{key}:</b> {value}\n"
            message += f"\n<b>Received:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC"

            # Build keyboard
            keyboard = []
            if action_buttons:
                keyboard.append(action_buttons)
            if detail_url:
                keyboard.append([{"text": "📋 View Details", "url": detail_url}])

            reply_markup = {"inline_keyboard": keyboard} if keyboard else None

            results = []
            for admin_id in admin_ids:
                result = await self.telegram.send_message(
                    chat_id=admin_id,
                    text=message,
                    parse_mode="HTML",
                    reply_markup=reply_markup,
                )
                results.append(result)

            return {
                "success": all(r.get("success") for r in results),
                "notified_count": sum(1 for r in results if r.get("success")),
            }

        except Exception as e:
            logger.error(f"Error sending generic notification: {e}")
            return {"success": False, "error": str(e)}
