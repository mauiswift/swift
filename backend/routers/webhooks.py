"""Webhook handlers for payment integrations"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/xendit")
async def xendit_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Xendit payment callbacks"""
    try:
        payload = await request.json()
        webhook_token = request.headers.get("X-Callback-Token")
        
        if webhook_token != settings.xendit_webhook_token:
            logger.warning("Xendit webhook: Invalid token")
            raise HTTPException(status_code=403, detail="Invalid token")
        
        event = payload.get("event")
        external_id = payload.get("external_id", "")
        status = payload.get("status", "")
        
        logger.info(f"Xendit webhook: event={event}, external_id={external_id}, status={status}")
        
        # Update transaction status
        if external_id and status:
            txn_service = TransactionsService(db)
            await txn_service.update_transaction_status(
                external_id=external_id,
                status=status,
                provider_reference=payload.get("id", "")
            )
        
        return {"success": True, "received": True}
    except Exception as e:
        logger.error(f"Xendit webhook error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/swiftpay")
async def swiftpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle SwiftPay payment callbacks"""
    try:
        payload = await request.json()
        
        reference_no = payload.get("reference_no", "")
        status = payload.get("status", "")
        payment_id = payload.get("payment_id", "")
        
        logger.info(f"SwiftPay webhook: reference_no={reference_no}, status={status}")
        
        # Update transaction status
        if reference_no and status:
            txn_service = TransactionsService(db)
            await txn_service.update_transaction_status(
                external_id=reference_no,
                status=status,
                provider_reference=payment_id
            )
        
        return {"success": True, "received": True}
    except Exception as e:
        logger.error(f"SwiftPay webhook error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/photonpay")
async def photonpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle PhotonPay (Alipay/WeChat) callbacks"""
    try:
        payload = await request.json()
        
        order_id = payload.get("order_id", "")
        status = payload.get("status", "")
        transaction_id = payload.get("transaction_id", "")
        
        logger.info(f"PhotonPay webhook: order_id={order_id}, status={status}")
        
        # Update transaction status
        if order_id and status:
            txn_service = TransactionsService(db)
            await txn_service.update_transaction_status(
                external_id=order_id,
                status=status,
                provider_reference=transaction_id
            )
        
        return {"success": True, "received": True}
    except Exception as e:
        logger.error(f"PhotonPay webhook error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.get("/test")
async def test_webhook():
    """Test endpoint to verify webhooks are running"""
    return {
        "message": "Webhooks endpoint is operational",
        "handlers": ["xendit", "swiftpay", "photonpay"]
    }
