"""Event handlers for admin notifications."""
import logging
import asyncio
from typing import Dict, Any

from services.event_bus import payment_event_bus
from services.admin_notification_service import AdminNotificationService
from core.database import db_manager
from core.config import KRW_PAYMENT_APPROVAL_TELEGRAM_ID

logger = logging.getLogger(__name__)


def _payment_recipient_ids(currency: str, original_currency: str | None = None) -> list[str] | None:
    if all(
        str(value or "").strip().upper() != "KRW"
        for value in (currency, original_currency)
    ):
        return None
    return [KRW_PAYMENT_APPROVAL_TELEGRAM_ID]


def _format_payment_received_message(data: Dict[str, Any]) -> str:
    """Build a detailed alert from the payment data captured on the transaction."""
    fields = [
        ("Payment record", data.get("payment_id")),
        ("Payment reference", data.get("external_id")),
        ("Gateway reference", data.get("gateway_reference")),
        ("Gateway", data.get("gateway")),
        ("Merchant ID", data.get("user_id")),
        ("Customer", data.get("customer_name")),
        ("Customer email", data.get("customer_email")),
        ("Payer name", data.get("sender_name")),
        ("Payer bank", data.get("sender_bank")),
        ("Amount", f"{data.get('amount'):,.2f} {data.get('currency') or 'PHP'}" if data.get("amount") is not None else None),
        (
            "Original amount",
            f"{data.get('original_amount'):,.2f} {data.get('original_currency')}"
            if data.get("original_amount") is not None and data.get("original_currency")
            else None,
        ),
        ("Payment type", data.get("transaction_type")),
        ("Order number", data.get("order_no")),
        ("Description", data.get("description")),
        ("Status", data.get("status")),
        ("Approval status", data.get("approval_status")),
        ("Received at (UTC)", data.get("paid_at")),
        ("Receiving bank", data.get("bank_name")),
        ("Receiving account name", data.get("bank_account_name")),
        ("Receiving account number", data.get("bank_account_number")),
        ("Bank reference", data.get("bank_account_reference")),
    ]
    return "\n".join(f"{label}: {value}" for label, value in fields if value not in (None, ""))


async def _handle_payment_created(data: Dict[str, Any]):
    """Create a dashboard notification without sending a premature bot alert."""
    payment_id = data.get("payment_id")
    if not payment_id:
        return
    recipient_ids = _payment_recipient_ids(str(data.get("currency") or ""))
    if recipient_ids == []:
        logger.error("KRW payment notification skipped: TELEGRAM_BOT_OWNER_ID is not configured")
        return

    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="payment_created",
            title="New Payment Request",
            message=(
                f"Payment of {data.get('amount', 'N/A')} "
                f"{data.get('currency', 'PHP')} from {data.get('user_name', 'User')}"
            ),
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            resource_type="payment",
            resource_id=str(payment_id),
            metadata={
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "description": data.get("description"),
            },
            priority="normal",
            action_url=f"/payments/{payment_id}",
            send_telegram=False,
            recipient_ids=recipient_ids,
        )


async def _handle_payment_link_created(data: Dict[str, Any]):
    """Create a dashboard notification without sending a premature bot alert."""
    payment_id = data.get("payment_id")
    if not payment_id:
        return
    recipient_ids = _payment_recipient_ids(str(data.get("currency") or ""))
    if recipient_ids == []:
        logger.error("KRW payment-link notification skipped: TELEGRAM_BOT_OWNER_ID is not configured")
        return

    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="payment_link_created",
            title="New Payment Link Created",
            message=(
                f"Payment link for {data.get('amount', 'N/A')} "
                f"{data.get('currency', 'PHP')} from {data.get('user_name', 'User')}"
            ),
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            resource_type="payment_link",
            resource_id=str(payment_id),
            metadata={
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "description": data.get("description"),
                "external_id": data.get("external_id"),
            },
            priority="normal",
            action_url="/payment-approvals",
            send_telegram=False,
            recipient_ids=recipient_ids,
        )


async def _handle_payment_received(data: Dict[str, Any]):
    """Notify the bot owner for KRW receipts and super admins for other currencies."""
    payment_id = data.get("payment_id")
    if not payment_id:
        logger.warning("Payment receipt notification ignored because payment_id is missing")
        return

    currency = str(data.get("currency") or "").strip().upper()
    original_currency = str(data.get("original_currency") or "").strip().upper()
    recipient_ids = _payment_recipient_ids(currency, original_currency)
    if "KRW" in {currency, original_currency} and not recipient_ids:
        logger.error("KRW payment receipt notification skipped: TELEGRAM_BOT_OWNER_ID is not configured")
        return

    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="payment_received",
            title="Payment Received — Awaiting Approval",
            message=_format_payment_received_message(data),
            user_id=data.get("user_id"),
            user_name=data.get("customer_name") or data.get("user_id"),
            resource_type="payment",
            resource_id=str(payment_id),
            metadata={key: value for key, value in data.items() if key != "event_type"},
            priority="high",
            action_url="/payment-approvals",
            recipient_ids=recipient_ids,
        )


async def _handle_withdrawal_request(data: Dict[str, Any]):
    """Handle withdrawal/disbursement request notification."""
    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="withdrawal_request",
            title=f"New Withdrawal Request",
            message=f"Withdrawal of {data.get('amount', 'N/A')} {data.get('currency', 'PHP')} from {data.get('user_name', 'User')} to {data.get('bank_name', 'Bank')}",
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            resource_type="disbursement",
            resource_id=data.get("disbursement_id"),
            metadata={
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "bank_name": data.get("bank_name"),
                "account_name": data.get("account_name"),
            },
            priority="high",
            action_url=f"/disbursements/{data.get('disbursement_id')}",
        )


async def _handle_bank_deposit_request(data: Dict[str, Any]):
    """Handle bank deposit request notification."""
    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="bank_deposit_request",
            title=f"New Bank Deposit Request",
            message=f"Bank deposit of {data.get('amount', 'N/A')} {data.get('currency', 'PHP')} from {data.get('user_name', 'User')} to {data.get('bank_name', 'Bank')}",
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            resource_type="deposit",
            resource_id=data.get("deposit_id"),
            metadata={
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "bank_name": data.get("bank_name"),
            },
            priority="high",
            action_url=f"/deposits/{data.get('deposit_id')}",
        )


async def _handle_kyb_application(data: Dict[str, Any]):
    """Handle KYB/merchant application notification."""
    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="kyb_application",
            title=f"New KYB Application",
            message=f"New merchant application from {data.get('merchant_name', 'User')}",
            user_id=data.get("user_id"),
            user_name=data.get("merchant_name"),
            resource_type="kyb",
            resource_id=data.get("kyb_id"),
            metadata={"merchant_name": data.get("merchant_name"), "application_type": data.get("application_type")},
            priority="urgent",
            action_url=f"/kyb/{data.get('kyb_id')}",
        )


async def _handle_settlement_update(data: Dict[str, Any]):
    """Handle user settlement details update notification."""
    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="settlement_updated",
            title=f"Settlement Details Updated",
            message=f"{data.get('user_name', 'User')} updated their settlement account details",
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            resource_type="settlement",
            resource_id=data.get("user_id"),
            metadata={"bank_name": data.get("bank_name"), "account_name": data.get("account_name")},
            priority="normal",
            action_url=f"/users/{data.get('user_id')}/settlement",
        )


async def _handle_topup_request(data: Dict[str, Any]):
    """Handle wallet topup request notification."""
    async with db_manager.async_session_maker() as db:
        await AdminNotificationService.notify_super_admins(
            db,
            notification_type="topup_request",
            title=f"New Top-up Request",
            message=f"Top-up of {data.get('amount', 'N/A')} {data.get('currency', 'PHP')} from {data.get('user_name', 'User')}",
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            resource_type="topup",
            resource_id=data.get("topup_id"),
            metadata={"amount": data.get("amount"), "currency": data.get("currency"), "method": data.get("method")},
            priority="normal",
            action_url="/topup-requests",
        )


def register_notification_handlers():
    """Register event handlers for admin notifications."""
    payment_event_bus.subscribe("payment_created", _handle_payment_created)
    payment_event_bus.subscribe("payment_link_created", _handle_payment_link_created)
    payment_event_bus.subscribe("payment_received", _handle_payment_received)
    payment_event_bus.subscribe("withdrawal_request", _handle_withdrawal_request)
    payment_event_bus.subscribe("bank_deposit_request", _handle_bank_deposit_request)
    payment_event_bus.subscribe("kyb_application", _handle_kyb_application)
    payment_event_bus.subscribe("settlement_updated", _handle_settlement_update)
    payment_event_bus.subscribe("topup_request", _handle_topup_request)
    
    logger.info("Registered admin notification event handlers")
