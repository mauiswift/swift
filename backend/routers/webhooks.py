"""Webhook handlers for payment integrations

Handles callbacks from:
- SwiftPay (Local PH payments: GCash, Maya, Bank Transfer, QR)
- Magpie (International: Visa, Mastercard, Alipay, WeChat Pay)
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.post("/swiftpay")
async def swiftpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle SwiftPay payment callbacks
    
    SwiftPay processes:
    - GCash payments
    - Maya payments
    - Bank transfers
    - QR Code payments
    """
    try:
        payload = await request.json()
        
        reference_no = payload.get("reference_no", "")
        status = payload.get("status", "")
        payment_id = payload.get("payment_id", "")
        amount = payload.get("amount", 0)
        
        logger.info(f"SwiftPay webhook: reference_no={reference_no}, status={status}, amount={amount}")
        
        # Map SwiftPay status to our internal status
        status_map = {
            "success": "completed",
            "completed": "completed",
            "paid": "completed",
            "pending": "pending",
            "failed": "failed",
            "cancelled": "cancelled",
        }
        
        internal_status = status_map.get(status, status)
        
        # Update transaction status
        if reference_no:
            txn_service = TransactionsService(db)
            await txn_service.update_transaction_status(
                external_id=reference_no,
                status=internal_status,
                provider_reference=payment_id
            )
            logger.info(f"SwiftPay: Updated transaction {reference_no} to {internal_status}")
        
        return {"success": True, "received": True, "reference_no": reference_no}
    except Exception as e:
        logger.error(f"SwiftPay webhook error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/magpie")
async def magpie_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Magpie payment callbacks
    
    Magpie processes:
    - Visa card payments
    - Mastercard card payments
    - Alipay payments
    - WeChat Pay payments
    """
    try:
        payload = await request.json()
        
        order_id = payload.get("order_id", "")
        status = payload.get("status", "")
        transaction_id = payload.get("transaction_id", "")
        amount = payload.get("amount", 0)
        payment_method = payload.get("payment_method", "")
        
        logger.info(f"Magpie webhook: order_id={order_id}, status={status}, method={payment_method}, amount={amount}")
        
        # Map Magpie status to our internal status
        status_map = {
            "success": "completed",
            "completed": "completed",
            "paid": "completed",
            "pending": "pending",
            "failed": "failed",
            "cancelled": "cancelled",
        }
        
        internal_status = status_map.get(status, status)
        
        # Update transaction status
        if order_id:
            txn_service = TransactionsService(db)
            await txn_service.update_transaction_status(
                external_id=order_id,
                status=internal_status,
                provider_reference=transaction_id
            )
            logger.info(f"Magpie: Updated transaction {order_id} to {internal_status}")
        
        return {"success": True, "received": True, "order_id": order_id}
    except Exception as e:
        logger.error(f"Magpie webhook error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.get("/test")
async def test_webhook():
    """Test endpoint to verify webhooks are running"""
    return {
        "message": "Payment webhooks endpoint is operational",
        "providers": {
            "swiftpay": "Local PH payments (GCash, Maya, Bank, QR)",
            "magpie": "International payments (Visa, Mastercard, Alipay, WeChat)"
        },
        "endpoints": {
            "swiftpay": "/api/v1/webhooks/swiftpay",
            "magpie": "/api/v1/webhooks/magpie"
        }
    }
