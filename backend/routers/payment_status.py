"""Payment status and health check endpoints"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from services.payment_gateway import PaymentGateway
from services.payment_processing import PaymentProcessor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payment-status", tags=["payment-status"])


@router.get("/health")
async def payment_health_check():
    """Check payment system health"""
    try:
        gateway = PaymentGateway()
        
        return {
            "status": "operational",
            "payment_system": {
                "xendit": {
                    "configured": bool(settings.xendit_secret_key),
                    "descriptor": settings.xendit_descriptor or "Click Store"
                },
                "swiftpay": {
                    "configured": bool(settings.swiftpay_access_key),
                    "mode": settings.swiftpay_mode
                },
                "photonpay": {
                    "configured": bool(settings.photonpay_app_id),
                    "mode": settings.photonpay_mode
                }
            },
            "webhook_handlers": {
                "xendit": "/webhooks/xendit",
                "swiftpay": "/webhooks/swiftpay",
                "photonpay": "/webhooks/photonpay"
            }
        }
    except Exception as e:
        logger.error(f"Payment health check failed: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/providers")
async def payment_providers():
    """Get configured payment providers"""
    return {
        "providers": {
            "xendit": {
                "configured": bool(settings.xendit_secret_key),
                "type": "primary",
                "methods": ["card", "bank_transfer", "e_wallet"],
                "regions": ["ph", "sg", "id", "th", "my"]
            },
            "swiftpay": {
                "configured": bool(settings.swiftpay_access_key),
                "type": "gateway",
                "methods": ["card", "gcash", "maya", "bank_transfer"],
                "regions": ["ph"]
            },
            "photonpay": {
                "configured": bool(settings.photonpay_app_id),
                "type": "marketplace",
                "methods": ["alipay", "wechat"],
                "regions": ["cn", "ph", "sg"]
            }
        }
    }


@router.get("/supported-methods")
async def supported_payment_methods():
    """Get all supported payment methods"""
    return {
        "methods": [
            {"id": "visa", "name": "Visa Card", "type": "card", "region": "global"},
            {"id": "mastercard", "name": "Mastercard", "type": "card", "region": "global"},
            {"id": "gcash", "name": "GCash", "type": "ewallet", "region": "ph"},
            {"id": "maya", "name": "Maya", "type": "ewallet", "region": "ph"},
            {"id": "grabpay", "name": "GrabPay", "type": "ewallet", "region": "ph"},
            {"id": "alipay", "name": "Alipay", "type": "ewallet", "region": "cn"},
            {"id": "wechat", "name": "WeChat Pay", "type": "ewallet", "region": "cn"},
            {"id": "bank_transfer", "name": "Bank Transfer", "type": "bank", "region": "global"},
            {"id": "qrph", "name": "QR PH", "type": "qr", "region": "ph"},
        ]
    }
