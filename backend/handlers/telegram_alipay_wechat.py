"""
Updated Alipay & WeChat Pay handlers for Telegram bot using Magpie.im QR API.
Replaces deprecated PhotonPay integration with modern Magpie QR service.
"""

# This is a patch module that replaces the old /alipay and /wechat handlers
# in backend/routers/telegram.py

import logging
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from services.payment_gateway import gateway as payment_gateway
from services.telegram import TelegramService

logger = logging.getLogger(__name__)


async def _create_gateway_qr(db: AsyncSession, chat_id: str, username: str, method: str, amount: float, description: str) -> dict:
    """Create a QR payment through the same gateway abstraction used by the dashboard."""
    reference_id = f"{method}-{uuid.uuid4().hex[:12]}"
    res = await payment_gateway.create_payment(
        db,
        user_id=f"tg-{chat_id}",
        amount=amount,
        description=description,
        transaction_type=f"{method}_qr",
        customer_name=username,
        customer_email="",
        external_id=reference_id,
        payment_methods=[method],
    )
    if not res.get("success"):
        return {"success": False, "error": res.get("error", "Payment request failed")}

    data = res.get("data") or {}
    payment_url = data.get("payment_url") or data.get("checkout_url") or ""
    if not payment_url:
        return {"success": False, "error": "No payment URL returned by gateway"}

    return {
        "success": True,
        "payment_url": payment_url,
        "reference_id": data.get("payment_id") or data.get("transaction_id") or reference_id,
        "gateway": data.get("gateway", "unknown"),
        "amount": amount,
        "currency": "PHP",
    }


async def handle_alipay_command(
    tg: TelegramService,
    db: AsyncSession,
    chat_id: str,
    username: str,
    parts: list,
    text: str,
    _safe_log,
) -> dict:
    """
    Handle /alipay command using Magpie.im QR API.
    Generates a scannable Alipay QR code with automatic PHP→CNY conversion.
    """
    if len(parts) < 2:
        # Start wizard flow
        from routers.telegram import _wizard_start
        await tg.send_message(chat_id, _wizard_start(chat_id, "/alipay"))
        return {"status": "ok"}
    
    try:
        amount = float(parts[1])
        if amount <= 0:
            await tg.send_message(chat_id, "❌ Amount must be greater than zero.")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}
        
        description = parts[2] if len(parts) > 2 else "Alipay payment"
        
        result = await _create_gateway_qr(db, chat_id, username, "alipay", amount, description)
        if not result.get("success"):
            await tg.send_message(
                chat_id,
                f"❌ Failed to create Alipay payment:\n{result.get('error', 'Unknown error')}"
            )
            logger.error(f"Alipay QR creation failed: {result.get('error')}")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}

        qr_url = result.get("payment_url")
        reference_id = result.get("reference_id")

        message = (
            f"✅ <b>Alipay Payment Ready!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 <b>Amount:</b> ₱{amount:,.2f} PHP\n"
            f"📝 <b>Description:</b> {description}\n"
            f"🆔 <b>Reference:</b> <code>{reference_id}</code>\n\n"
            f"📱 <b>How to pay:</b>\n"
            f"1. Tap the QR code link below\n"
            f"2. Open with Alipay app\n"
            f"3. Complete the payment\n"
            f"4. Your wallet will be credited automatically\n\n"
            f"⏱️ <b>Valid for:</b> 24 hours"
        )

        keyboard = None
        if qr_url:
            keyboard = {
                "inline_keyboard": [
                    [{"text": "🔴 Open Alipay Checkout", "url": qr_url}],
                    [{"text": "📱 View QR Code", "url": qr_url}],
                ]
            }

        await tg.send_message(chat_id, message, reply_markup=keyboard)
        await _safe_log(db, chat_id, username, text)
        return {"status": "ok"}
    
    except ValueError:
        await tg.send_message(chat_id, "❌ Invalid amount. Please enter a valid number.")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Alipay handler error: {e}", exc_info=True)
        await tg.send_message(
            chat_id,
            "❌ An error occurred while creating your Alipay payment. Please try again."
        )
        return {"status": "ok"}


async def handle_wechat_command(
    tg: TelegramService,
    db: AsyncSession,
    chat_id: str,
    username: str,
    parts: list,
    text: str,
    _safe_log,
) -> dict:
    """
    Handle /wechat command using Magpie.im QR API.
    Generates a scannable WeChat Pay QR code with automatic PHP→CNY conversion.
    """
    if len(parts) < 2:
        # Start wizard flow
        from routers.telegram import _wizard_start
        await tg.send_message(chat_id, _wizard_start(chat_id, "/wechat"))
        return {"status": "ok"}
    
    try:
        amount = float(parts[1])
        if amount <= 0:
            await tg.send_message(chat_id, "❌ Amount must be greater than zero.")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}
        
        description = parts[2] if len(parts) > 2 else "WeChat Pay"
        
        result = await _create_gateway_qr(db, chat_id, username, "wechat", amount, description)
        if not result.get("success"):
            await tg.send_message(
                chat_id,
                f"❌ Failed to create WeChat payment:\n{result.get('error', 'Unknown error')}"
            )
            logger.error(f"WeChat QR creation failed: {result.get('error')}")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}

        qr_url = result.get("payment_url")
        reference_id = result.get("reference_id")

        message = (
            f"✅ <b>WeChat Pay Ready!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 <b>Amount:</b> ₱{amount:,.2f} PHP\n"
            f"📝 <b>Description:</b> {description}\n"
            f"🆔 <b>Reference:</b> <code>{reference_id}</code>\n\n"
            f"📱 <b>How to pay:</b>\n"
            f"1. Open WeChat on your phone\n"
            f"2. Tap the QR code link or scan manually\n"
            f"3. Complete the payment\n"
            f"4. Your wallet will be credited automatically\n\n"
            f"⏱️ <b>Valid for:</b> 24 hours"
        )

        keyboard = None
        if qr_url:
            keyboard = {
                "inline_keyboard": [
                    [{"text": "🟢 Open WeChat Checkout", "url": qr_url}],
                    [{"text": "📱 View QR Code", "url": qr_url}],
                ]
            }

        await tg.send_message(chat_id, message, reply_markup=keyboard)
        await _safe_log(db, chat_id, username, text)
        return {"status": "ok"}
    
    except ValueError:
        await tg.send_message(chat_id, "❌ Invalid amount. Please enter a valid number.")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"WeChat handler error: {e}", exc_info=True)
        await tg.send_message(
            chat_id,
            "❌ An error occurred while creating your WeChat payment. Please try again."
        )
        return {"status": "ok"}
