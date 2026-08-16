"""Payment status and health check endpoints

Providers:
- SwiftPay: Local Philippine payments (GCash, Maya, Bank, QR)
- Magpie: International payments (Alipay, WeChat Pay)
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from services.payment_gateway import PaymentGateway

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/payments/status", tags=["payment-status"])


@router.get("/health")
async def payment_health_check():
    """Check payment system health"""
    try:
        gateway = PaymentGateway()
        
        return {
            "status": "operational",
            "payment_system": {
                "swiftpay": {
                    "name": "SwiftPay (Local PH Payments)",
                    "configured": bool(settings.swiftpay_access_key),
                    "mode": settings.swiftpay_mode,
                    "methods": ["gcash", "maya", "bank_transfer", "qr_code"]
                },
                "magpie": {
                    "name": "Magpie (International Payments)",
                    "configured": bool(getattr(settings, 'magpie_api_key', None)),
                    "mode": settings.swiftpay_mode,
                    "methods": ["alipay", "wechat", "visa", "mastercard"]
                }
            },
            "webhook_handlers": {
                "swiftpay": "/api/v1/webhooks/swiftpay",
                "magpie": "/api/v1/webhooks/magpie"
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
        "providers": [
            {
                "id": "swiftpay",
                "name": "SwiftPay",
                "type": "local_gateway",
                "region": "Philippine",
                "methods": [
                    {"id": "gcash", "name": "GCash"},
                    {"id": "maya", "name": "Maya"},
                    {"id": "bank_transfer", "name": "Bank Transfer"},
                    {"id": "qr_code", "name": "QR Code Payment"}
                ],
                "configured": bool(settings.swiftpay_access_key),
                "webhook": "/api/v1/webhooks/swiftpay"
            },
            {
                "id": "magpie",
                "name": "Magpie",
                "type": "international_gateway",
                "region": "International",
                "methods": [
                    {"id": "alipay", "name": "Alipay"},
                    {"id": "wechat", "name": "WeChat Pay"},
                    {"id": "visa", "name": "Visa"},
                    {"id": "mastercard", "name": "Mastercard"}
                ],
                "configured": bool(getattr(settings, 'magpie_api_key', None)),
                "webhook": "/api/v1/webhooks/magpie"
            }
        ]
    }


@router.get("/supported-methods")
async def supported_payment_methods():
    """Get all supported payment methods"""
    return {
        "local_methods": [
            {
                "id": "gcash",
                "name": "GCash",
                "type": "e-wallet",
                "region": "Philippines",
                "provider": "swiftpay",
                "logo": "/logos/gcash.svg"
            },
            {
                "id": "maya",
                "name": "Maya",
                "type": "e-wallet",
                "region": "Philippines",
                "provider": "swiftpay",
                "logo": "/logos/maya.svg"
            },
            {
                "id": "bank_transfer",
                "name": "Bank Transfer",
                "type": "bank",
                "region": "Philippines",
                "provider": "swiftpay",
                "description": "Direct bank transfer from Philippine banks"
            },
            {
                "id": "qr_code",
                "name": "QR Code Payment",
                "type": "qr",
                "region": "Philippines",
                "provider": "swiftpay",
                "description": "Scan and pay via QR code"
            }
        ],
        "international_methods": [
            {
                "id": "alipay",
                "name": "Alipay",
                "type": "e-wallet",
                "region": "China",
                "provider": "magpie",
                "logo": "/logos/alipay.svg",
                "description": "Alibaba's payment platform"
            },
            {
                "id": "wechat",
                "name": "WeChat Pay",
                "type": "e-wallet",
                "region": "China",
                "provider": "magpie",
                "logo": "/logos/wechat.svg",
                "description": "WeChat payment service"
            },
            {
                "id": "visa",
                "name": "Visa",
                "type": "card",
                "region": "International",
                "provider": "magpie",
                "logo": "/logos/visa.svg",
                "description": "International Visa card payments"
            },
            {
                "id": "mastercard",
                "name": "Mastercard",
                "type": "card",
                "region": "International",
                "provider": "magpie",
                "logo": "/logos/mastercard.svg",
                "description": "International Mastercard payments"
            }
        ]
    }
