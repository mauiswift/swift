"""Handle Telegram inline button callbacks for bot quick actions."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.telegram_service import TelegramService
from services.bot_enhancements import BotEnhancements

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/telegram", tags=["telegram-bot-actions"])


class BotCallbackUpdate(BaseModel):
    """Telegram bot callback update for quick action buttons."""
    update_id: int
    callback_query: Dict[str, Any]


@router.post("/bot-actions")
async def handle_bot_quick_actions(
    update: BotCallbackUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle quick action button presses from bot menus.
    Examples: send money, receive money, check wallet, view downline, etc.
    """
    try:
        if not update.callback_query:
            return {"ok": False}

        callback_data = update.callback_query.get("data", "")
        callback_id = update.callback_query.get("id")
        user_id = update.callback_query.get("from", {}).get("id")
        chat_id = update.callback_query.get("message", {}).get("chat", {}).get("id")
        message_id = update.callback_query.get("message", {}).get("message_id")

        if not callback_data or not callback_id:
            return {"ok": False}

        tg_service = TelegramService()
        bot_enhancements = BotEnhancements(tg_service)

        # Parse callback data: "action:send" or "copy_link:https://..."
        parts = callback_data.split(":", 1)
        action = parts[0] if parts else ""
        action_data = parts[1] if len(parts) > 1 else ""

        logger.info(f"Bot action: {action} from user {user_id}")

        # Handle different actions
        if action == "action":
            if action_data == "menu":
                # Show main menu
                await bot_enhancements.send_welcome_message(
                    chat_id=str(chat_id),
                    user_name="User"
                )
                await tg_service.answer_callback_query(callback_id, "📋 Showing menu...")

            elif action_data == "wallet":
                # Show wallet summary
                await bot_enhancements.send_wallet_summary(
                    chat_id=str(chat_id),
                    php_balance=0,  # TODO: Fetch from DB
                    usd_balance=0,
                    pending_balance=0,
                )
                await tg_service.answer_callback_query(callback_id, "💰 Loading wallet...")

            elif action_data == "send":
                await tg_service.send_message(
                    chat_id=str(chat_id),
                    text="📤 <b>Send Money</b>\n\nOpen the app or type /send to send money to a contact.",
                    parse_mode="HTML",
                )
                await tg_service.answer_callback_query(callback_id, "📤 Send money feature opening...")

            elif action_data == "receive":
                await tg_service.send_message(
                    chat_id=str(chat_id),
                    text="📥 <b>Receive Money</b>\n\nOpen the app or type /receive to generate a payment link.",
                    parse_mode="HTML",
                )
                await tg_service.answer_callback_query(callback_id, "📥 Receive feature opening...")

            elif action_data == "payment_link":
                await tg_service.send_message(
                    chat_id=str(chat_id),
                    text="🔗 <b>Generate Payment Link</b>\n\nOpen the app or type /payment_link to create a new link.",
                    parse_mode="HTML",
                )
                await tg_service.answer_callback_query(callback_id, "🔗 Payment link generator opening...")

            elif action_data == "downline":
                await tg_service.send_message(
                    chat_id=str(chat_id),
                    text="👥 <b>Downline Management</b>\n\nOpen the app or type /downline to manage your team.",
                    parse_mode="HTML",
                )
                await tg_service.answer_callback_query(callback_id, "👥 Downline view opening...")

            elif action_data == "settings":
                await tg_service.send_message(
                    chat_id=str(chat_id),
                    text="⚙️ <b>Settings</b>\n\nOpen the app or type /settings to configure your account.",
                    parse_mode="HTML",
                )
                await tg_service.answer_callback_query(callback_id, "⚙️ Settings opening...")

            elif action_data == "help":
                await bot_enhancements.send_help_menu(str(chat_id))
                await tg_service.answer_callback_query(callback_id, "❓ Help loaded")

            elif action_data == "retry":
                await tg_service.answer_callback_query(callback_id, "🔄 Retrying...")

        elif action == "copy_link":
            # Copy payment link to clipboard
            await tg_service.answer_callback_query(
                callback_id,
                f"📋 Link copied to clipboard!\n{action_data}",
                show_alert=False,
            )

        elif action == "txn_details":
            # Show transaction details
            txn_id = action_data
            await tg_service.send_message(
                chat_id=str(chat_id),
                text=f"📊 <b>Transaction Details</b>\n\nTransaction ID: <code>{txn_id}</code>\n\nOpen the app for full details.",
                parse_mode="HTML",
            )
            await tg_service.answer_callback_query(callback_id, "📊 Loading details...")

        else:
            await tg_service.answer_callback_query(callback_id, "❓ Unknown action")
            return {"ok": False}

        return {"ok": True}

    except Exception as e:
        logger.error(f"Error handling bot quick action: {e}", exc_info=True)
        return {"ok": False, "error": str(e)}
