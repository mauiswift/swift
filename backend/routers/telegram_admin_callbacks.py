"""Handle Telegram bot callbacks for payment approval actions."""

import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import KRW_PAYMENT_APPROVAL_TELEGRAM_ID, SYSTEM_WALLET_ADMIN_TELEGRAM_ID, settings
from core.database import get_db
from dependencies.webhook_auth import require_telegram_webhook_secret
from models.transactions import Transactions
from models.admin_users import AdminUser
from routers.bank_deposit import (
    ApproveBankDepositRequest,
    RejectBankDepositRequest,
    approve_bank_deposit_request,
    reject_bank_deposit_request,
)
from routers.topup import (
    ApproveTopupRequest,
    RejectTopupRequest,
    approve_topup_request,
    reject_topup_request,
)
from routers.wallet import RejectWithdrawalRequest, approve_withdrawal, reject_withdrawal
from schemas.auth import UserPermissions, UserResponse
from services.telegram_service import TelegramService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/telegram", tags=["telegram-bot"])


def _is_krw_payment(txn: Transactions) -> bool:
    return any(
        str(currency or "").strip().upper() == "KRW"
        for currency in (txn.original_currency, txn.currency)
    )


class TelegramCallbackUpdate(BaseModel):
    """Telegram bot callback update for inline button presses."""
    update_id: int
    callback_query: Dict[str, Any]


async def process_approval_callback(callback_query: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
    """Process an approval button from the Telegram webhook."""
    callback_id = callback_query.get("id")
    callback_data = callback_query.get("data", "")
    user_id = callback_query.get("from", {}).get("id")
    message = callback_query.get("message", {})
    message_id = message.get("message_id")
    chat_id = message.get("chat", {}).get("id")
    telegram_service = TelegramService()

    if not callback_id:
        return {"ok": False}

    str_user_id = str(user_id or "").strip()
    if not str_user_id or str_user_id == "None":
        await telegram_service.answer_callback_query(callback_id, "❌ Invalid user identity")
        return {"ok": False}

    parts = callback_data.split(":", 1)
    if len(parts) != 2:
        await telegram_service.answer_callback_query(callback_id, "Invalid approval action")
        return {"ok": False}

    action, resource_id = parts
    is_payment_action = action in {"approve_payment", "reject_payment"}
    is_designated_payment_approver = (
        is_payment_action and bool(SYSTEM_WALLET_ADMIN_TELEGRAM_ID.strip()) and str_user_id == SYSTEM_WALLET_ADMIN_TELEGRAM_ID.strip()
    )
    if is_payment_action and not is_designated_payment_approver:
        await telegram_service.answer_callback_query(
            callback_id,
            "❌ Only the designated system user can approve or reject payments",
        )
        return {"ok": False}

    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str_user_id))
    is_bot_owner = (
        bool(str(settings.telegram_bot_owner_id or "").strip())
        and str_user_id == str(settings.telegram_bot_owner_id).strip()
    )
    if (
        (not admin or not admin.is_super_admin)
        and not is_bot_owner
        and not is_designated_payment_approver
    ):
        await telegram_service.answer_callback_query(callback_id, "❌ You are not authorized to approve requests")
        return {"ok": False}

    admin_id = str_user_id
    admin_name = (admin.name if admin else None) or (
        "Designated payment approver" if is_designated_payment_approver else "Bot owner"
    )
    admin_user = UserResponse(
        id=admin_id,
        email=f"telegram:{str_user_id}",
        name=admin_name,
        role="admin",
        permissions=UserPermissions(
            is_super_admin=True,
            can_approve_topups=True,
            can_manage_disbursements=True,
        ),
    )
    note = "Approved via Telegram bot" if action.startswith("approve_") else "Rejected via Telegram bot"

    try:
        numeric_id = int(resource_id)
        if action == "approve_payment":
            txn = await db.get(Transactions, numeric_id)
            if not txn:
                raise ValueError("Payment not found")
            if _is_krw_payment(txn):
                if str(user_id) != KRW_PAYMENT_APPROVAL_TELEGRAM_ID:
                    await telegram_service.answer_callback_query(
                        callback_id,
                        "❌ Only the designated KRW payment approver can approve KRW payments",
                    )
                    return {"ok": False}
            approved = await TransactionsService(db).approve_payment_link(
                txn,
                approved_by=admin_id,
                note=note,
                force_approval=(
                    _is_krw_payment(txn)
                    and str(user_id) == KRW_PAYMENT_APPROVAL_TELEGRAM_ID
                ),
            )
            if not approved:
                raise ValueError("Payment could not be approved")
            status_text = "✅ Payment Approved"
            response_text = f"✅ Payment #{txn.external_id or txn.id} approved and credited."
        elif action == "reject_payment":
            txn = await db.get(Transactions, numeric_id)
            if not txn:
                raise ValueError("Payment not found")
            if _is_krw_payment(txn):
                if str(user_id) != KRW_PAYMENT_APPROVAL_TELEGRAM_ID:
                    await telegram_service.answer_callback_query(
                        callback_id,
                        "❌ Only the designated KRW payment approver can reject KRW payments",
                    )
                    return {"ok": False}
            txn.status = "failed"
            txn.approval_status = "rejected"
            txn.approved_by = admin_id
            txn.rejection_reason = note
            await db.commit()
            status_text = "❌ Payment Rejected"
            response_text = f"❌ Payment #{txn.external_id or txn.id} rejected."
        elif action == "approve_topup":
            await approve_topup_request(numeric_id, ApproveTopupRequest(note=note), admin_user, db)
            status_text = "✅ Top-up Approved"
            response_text = f"✅ Top-up request #{numeric_id} approved."
        elif action == "reject_topup":
            await reject_topup_request(numeric_id, RejectTopupRequest(note=note), admin_user, db)
            status_text = "❌ Top-up Rejected"
            response_text = f"❌ Top-up request #{numeric_id} rejected."
        elif action == "approve_withdrawal":
            await approve_withdrawal(numeric_id, admin_user, db, note=note)
            status_text = "✅ Withdrawal Approved"
            response_text = f"✅ Withdrawal request #{numeric_id} approved."
        elif action == "reject_withdrawal":
            await reject_withdrawal(
                numeric_id, RejectWithdrawalRequest(reason=note), admin_user, db,
            )
            status_text = "❌ Withdrawal Rejected"
            response_text = f"❌ Withdrawal request #{numeric_id} rejected."
        elif action == "approve_bank_deposit":
            await approve_bank_deposit_request(
                numeric_id, ApproveBankDepositRequest(note=note), admin_user, db,
            )
            status_text = "✅ Bank Deposit Approved"
            response_text = f"✅ Bank deposit request #{numeric_id} approved."
        elif action == "reject_bank_deposit":
            await reject_bank_deposit_request(
                numeric_id, RejectBankDepositRequest(note=note), admin_user, db,
            )
            status_text = "❌ Bank Deposit Rejected"
            response_text = f"❌ Bank deposit request #{numeric_id} rejected."
        else:
            await telegram_service.answer_callback_query(callback_id, "⚠️ Unknown approval action")
            return {"ok": False}
    except Exception as exc:
        await db.rollback()
        logger.error("Telegram approval %s failed: %s", callback_data, exc, exc_info=True)
        await telegram_service.answer_callback_query(callback_id, f"❌ {str(exc)[:180]}")
        return {"ok": False, "error": str(exc)}

    if message_id and chat_id:
        await telegram_service.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=f"<b>{status_text}</b>\n\n<b>Request ID:</b> <code>{resource_id}</code>\n<b>Processed by:</b> {admin_name}",
            parse_mode="HTML",
        )
    await telegram_service.answer_callback_query(callback_id, response_text)
    if chat_id:
        await telegram_service.send_message(
            chat_id=chat_id,
            text=(
                f"<b>{status_text}</b>\n\n"
                f"Request <code>#{resource_id}</code> was processed successfully.\n"
                f"Processed by: {admin_name}"
            ),
            parse_mode="HTML",
        )
    return {"ok": True}


@router.post("/callbacks")
async def handle_telegram_callback(
    update: TelegramCallbackUpdate,
    db: AsyncSession = Depends(get_db),
    _webhook_auth: None = Depends(require_telegram_webhook_secret),
):
    """
    Handle Telegram inline button callbacks.

    Processes payment approval/rejection actions when super admins click inline buttons.
    """
    if update.callback_query and update.callback_query.get("data", "").startswith((
        "approve_payment:", "reject_payment:",
        "approve_topup:", "reject_topup:",
        "approve_withdrawal:", "reject_withdrawal:",
        "approve_bank_deposit:", "reject_bank_deposit:",
    )):
        return await process_approval_callback(update.callback_query, db)

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
<b>Processed by:</b> {admin.name or 'Admin'}
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
    if not update.callback_query:
        return {"ok": False}

    callback_data = update.callback_query.get("data", "")
    if callback_data.startswith(("approve_topup:", "reject_topup:")):
        return await process_approval_callback(update.callback_query, db)

    logger.warning("Top-up callback data was not recognized: %s", callback_data)
    return {"ok": False, "error": "Unknown topup approval action"}


@router.post("/callbacks/withdrawal")
async def handle_withdrawal_callback(update: TelegramCallbackUpdate, db: AsyncSession = Depends(get_db)):
    """Handle withdrawal request approval/rejection callbacks."""
    if not update.callback_query:
        return {"ok": False}

    callback_data = update.callback_query.get("data", "")
    if callback_data.startswith(("approve_withdrawal:", "reject_withdrawal:")):
        return await process_approval_callback(update.callback_query, db)

    logger.warning("Withdrawal callback data was not recognized: %s", callback_data)
    return {"ok": False, "error": "Unknown withdrawal approval action"}
