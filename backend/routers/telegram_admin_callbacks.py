"""Handle Telegram bot callbacks for payment approval actions."""

import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.transactions import Transactions
from models.admin_users import AdminUser
from services.telegram_service import TelegramService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/telegram", tags=["telegram-bot"])


class TelegramCallbackUpdate(BaseModel):
    """Telegram bot callback update for inline button presses."""
    update_id: int
    callback_query: Dict[str, Any]


@router.post("/callbacks")
async def handle_telegram_callback(update: TelegramCallbackUpdate, db: AsyncSession = Depends(get_db)):
    """
    Handle Telegram inline button callbacks.

    Processes payment approval/rejection actions when super admins click inline buttons.
    """
    try:
        if not update.callback_query:
            return {"ok": False}

        callback_data = update.callback_query.get("data", "")
        callback_id = update.callback_query.get("id")
        user_id = update.callback_query.get("from", {}).get("id")
        message_id = update.callback_query.get("message", {}).get("message_id")
        chat_id = update.callback_query.get("message", {}).get("chat", {}).get("id")

        if not callback_data or not callback_id:
            return {"ok": False}

        telegram_service = TelegramService()
        txn_service = TransactionsService(db)

        # Parse callback data: "approve_payment:123" or "reject_payment:456"
        action_parts = callback_data.split(":")
        if len(action_parts) != 2:
            await telegram_service.answer_callback_query(callback_id, "Invalid action")
            return {"ok": False}

        action, payment_id = action_parts

        # Verify user is super admin
        admin = await db.scalar(
            db.select(AdminUser).where(AdminUser.telegram_id == str(user_id))
        )
        if not admin or not admin.is_super_admin:
            await telegram_service.answer_callback_query(
                callback_id,
                "❌ You are not authorized to approve payments"
            )
            return {"ok": False}

        # Get transaction
        txn = await db.get(Transactions, int(payment_id))
        if not txn:
            await telegram_service.answer_callback_query(callback_id, "❌ Payment not found")
            return {"ok": False}

        if action == "approve_payment":
            # Approve payment
            approved = await txn_service.approve_payment_link(
                txn,
                approved_by=str(admin.id),
                note="Approved via Telegram bot",
            )

            if approved:
                status_text = "✅ Payment Approved"
                response_text = f"✅ Payment #{txn.external_id or txn.id} has been approved and credited to the wallet."
            else:
                status_text = "❌ Approval Failed"
                response_text = f"❌ Failed to approve payment #{txn.external_id or txn.id}"

        elif action == "reject_payment":
            # Reject payment
            txn.status = "failed"
            txn.approval_status = "rejected"
            txn.approved_by = str(admin.id)
            txn.rejection_reason = "Rejected via Telegram bot"
            await db.commit()

            status_text = "❌ Payment Rejected"
            response_text = f"❌ Payment #{txn.external_id or txn.id} has been rejected. No wallet credit issued."

        else:
            await telegram_service.answer_callback_query(callback_id, "⚠️ Unknown action")
            return {"ok": False}

        # Update the message with status
        if message_id and chat_id:
            updated_message = f"""
<b>{status_text}</b>

<b>Payment ID:</b> <code>{txn.external_id or txn.id}</code>
<b>Amount:</b> {float(txn.amount or 0):,.2f} {txn.currency or 'PHP'}
<b>Status:</b> {txn.status}
<b>Processed by:</b> {admin.telegram_name or 'Admin'}
<b>Time:</b> {txn.updated_at.strftime('%Y-%m-%d %H:%M:%S')} UTC
            """
            await telegram_service.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=updated_message,
                parse_mode="HTML",
            )

        # Send notification to user
        await telegram_service.answer_callback_query(callback_id, response_text)

        logger.info(
            f"Payment {payment_id} {action.split('_')[0]}d via Telegram by admin {admin.id}"
        )
        return {"ok": True}

    except Exception as e:
        logger.error(f"Error handling Telegram callback: {e}", exc_info=True)
        return {"ok": False, "error": str(e)}


@router.post("/callbacks/topup")
async def handle_topup_callback(update: TelegramCallbackUpdate, db: AsyncSession = Depends(get_db)):
    """Handle topup request approval/rejection callbacks."""
    try:
        if not update.callback_query:
            return {"ok": False}

        callback_data = update.callback_query.get("data", "")
        callback_id = update.callback_query.get("id")
        user_id = update.callback_query.get("from", {}).get("id")
        message_id = update.callback_query.get("message", {}).get("message_id")
        chat_id = update.callback_query.get("message", {}).get("chat", {}).get("id")

        telegram_service = TelegramService()

        # Verify user is super admin
        admin = await db.scalar(
            db.select(AdminUser).where(AdminUser.telegram_id == str(user_id))
        )
        if not admin or not admin.is_super_admin:
            await telegram_service.answer_callback_query(
                callback_id,
                "❌ You are not authorized"
            )
            return {"ok": False}

        # Parse callback: "approve_topup:123" or "reject_topup:456"
        action_parts = callback_data.split(":")
        if len(action_parts) != 2:
            return {"ok": False}

        action, topup_id = action_parts

        # TODO: Implement topup approval/rejection logic
        # For now, just acknowledge the action
        response_msg = {
            "approve_topup": f"✅ Topup request #{topup_id} approved",
            "reject_topup": f"❌ Topup request #{topup_id} rejected",
        }.get(action, "Unknown action")

        await telegram_service.answer_callback_query(callback_id, response_msg)

        logger.info(f"Topup {topup_id} {action.split('_')[0]}d via Telegram by {admin.id}")
        return {"ok": True}

    except Exception as e:
        logger.error(f"Error handling topup callback: {e}")
        return {"ok": False}


@router.post("/callbacks/withdrawal")
async def handle_withdrawal_callback(update: TelegramCallbackUpdate, db: AsyncSession = Depends(get_db)):
    """Handle withdrawal request approval/rejection callbacks."""
    try:
        if not update.callback_query:
            return {"ok": False}

        callback_data = update.callback_query.get("data", "")
        callback_id = update.callback_query.get("id")
        user_id = update.callback_query.get("from", {}).get("id")

        telegram_service = TelegramService()

        # Verify super admin
        admin = await db.scalar(
            db.select(AdminUser).where(AdminUser.telegram_id == str(user_id))
        )
        if not admin or not admin.is_super_admin:
            await telegram_service.answer_callback_query(
                callback_id,
                "❌ Unauthorized"
            )
            return {"ok": False}

        # Parse callback: "approve_withdrawal:123" or "reject_withdrawal:456"
        action_parts = callback_data.split(":")
        if len(action_parts) != 2:
            return {"ok": False}

        action, withdrawal_id = action_parts

        # TODO: Implement withdrawal approval/rejection logic
        response_msg = {
            "approve_withdrawal": f"✅ Withdrawal request #{withdrawal_id} approved",
            "reject_withdrawal": f"❌ Withdrawal request #{withdrawal_id} rejected",
        }.get(action, "Unknown action")

        await telegram_service.answer_callback_query(callback_id, response_msg)

        logger.info(f"Withdrawal {withdrawal_id} {action.split('_')[0]}d via {admin.id}")
        return {"ok": True}

    except Exception as e:
        logger.error(f"Error handling withdrawal callback: {e}")
        return {"ok": False}
