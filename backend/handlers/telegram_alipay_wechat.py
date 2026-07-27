"""
Updated Alipay & WeChat Pay handlers for Telegram bot using Magpie.im QR API.
Replaces deprecated PhotonPay integration with modern Magpie QR service.
"""

# This is a patch module that replaces the old /alipay and /wechat handlers
# in backend/routers/telegram.py

import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from services.magpie_qr_service import MagpieQRService
from services.telegram import TelegramService
from models.transactions import Transactions

logger = logging.getLogger(__name__)


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
        
        # Initialize Magpie QR service
        magpie = MagpieQRService()
        
        if not magpie.is_configured:
            await tg.send_message(
                chat_id,
                "❌ Alipay payments are temporarily unavailable. "
                "Please contact support."
            )
            logger.warning("Alipay requested but Magpie API not configured")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}
        
        # Generate Alipay QR code
        result = await magpie.create_alipay_qr(
            amount=amount,
            description=description,
            currency="PHP",
            customer_name=username,
        )
        
        if not result.get("success"):
            await tg.send_message(
                chat_id,
                f"❌ Failed to create Alipay payment:\n{result.get('error', 'Unknown error')}"
            )
            logger.error(f"Alipay QR creation failed: {result.get('error')}")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}
        
        # Successfully created QR code
        qr_url = result.get("qr_url")
        reference_id = result.get("reference_id")
        converted_amount = result.get("amount")
        converted_currency = result.get("currency")
        
        # Build response message
        message = (
            f"✅ <b>Alipay Payment Ready!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 <b>Original Amount:</b> ₱{amount:,.2f} PHP\n"
            f"💵 <b>Payment Amount:</b> ¥{converted_amount:,.2f} CNY\n"
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
                    [{"text": "📱 View QR Code", "url": result.get("qr_url")}],
                ]
            }
        
        await tg.send_message(chat_id, message, reply_markup=keyboard)
        
        # Record transaction
        try:
            now = datetime.now(timezone.utc)
            txn = Transactions(
                user_id=f"tg-{chat_id}",
                transaction_type="alipay_qr",
                external_id=reference_id,
                amount=amount,  # Original PHP amount
                currency="PHP",
                status="pending",
                description=description,
                qr_code_url=qr_url,
                telegram_chat_id=chat_id,
                created_at=now,
                updated_at=now,
                metadata={
                    "service": "magpie",
                    "converted_amount": converted_amount,
                    "converted_currency": converted_currency,
                    "username": username,
                },
            )
            db.add(txn)
            await db.commit()
            logger.info(
                f"Recorded Alipay QR transaction: {reference_id} "
                f"({amount} PHP → {converted_amount} CNY)"
            )
        except Exception as e:
            logger.error(f"Failed to record Alipay transaction: {e}", exc_info=True)
            try:
                await db.rollback()
            except:
                pass
        
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
        
        # Initialize Magpie QR service
        magpie = MagpieQRService()
        
        if not magpie.is_configured:
            await tg.send_message(
                chat_id,
                "❌ WeChat payments are temporarily unavailable. "
                "Please contact support."
            )
            logger.warning("WeChat requested but Magpie API not configured")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}
        
        # Generate WeChat Pay QR code
        result = await magpie.create_wechat_qr(
            amount=amount,
            description=description,
            currency="PHP",
            customer_name=username,
        )
        
        if not result.get("success"):
            await tg.send_message(
                chat_id,
                f"❌ Failed to create WeChat payment:\n{result.get('error', 'Unknown error')}"
            )
            logger.error(f"WeChat QR creation failed: {result.get('error')}")
            await _safe_log(db, chat_id, username, text)
            return {"status": "ok"}
        
        # Successfully created QR code
        qr_url = result.get("qr_url")
        reference_id = result.get("reference_id")
        converted_amount = result.get("amount")
        converted_currency = result.get("currency")
        
        # Build response message
        message = (
            f"✅ <b>WeChat Pay Ready!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 <b>Original Amount:</b> ₱{amount:,.2f} PHP\n"
            f"💵 <b>Payment Amount:</b> ¥{converted_amount:,.2f} CNY\n"
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
                    [{"text": "📱 View QR Code", "url": result.get("qr_url")}],
                ]
            }
        
        await tg.send_message(chat_id, message, reply_markup=keyboard)
        
        # Record transaction
        try:
            now = datetime.now(timezone.utc)
            txn = Transactions(
                user_id=f"tg-{chat_id}",
                transaction_type="wechat_qr",
                external_id=reference_id,
                amount=amount,  # Original PHP amount
                currency="PHP",
                status="pending",
                description=description,
                qr_code_url=qr_url,
                telegram_chat_id=chat_id,
                created_at=now,
                updated_at=now,
                metadata={
                    "service": "magpie",
                    "converted_amount": converted_amount,
                    "converted_currency": converted_currency,
                    "username": username,
                },
            )
            db.add(txn)
            await db.commit()
            logger.info(
                f"Recorded WeChat QR transaction: {reference_id} "
                f"({amount} PHP → {converted_amount} CNY)"
            )
        except Exception as e:
            logger.error(f"Failed to record WeChat transaction: {e}", exc_info=True)
            try:
                await db.rollback()
            except:
                pass
        
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
