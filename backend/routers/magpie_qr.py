"""
API Router for Magpie QR code generation (Alipay and WeChat Pay).
Exposes endpoints for creating dynamic QR codes with currency conversion.
"""

import logging
import uuid
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.magpie_qr_service import MagpieQRService, CurrencyConverter
from services.magpie_services import MagpieService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/magpie/qr", tags=["magpie-qr"])


# ═══════════════════════════════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════════════════════════════

class CreateAlipayQRRequest(BaseModel):
    """Request to create an Alipay QR code."""
    amount: float = Field(..., gt=0, description="Payment amount")
    description: Optional[str] = Field(None, description="Payment description")
    currency: Optional[str] = Field("PHP", description="Currency (PHP, CNY, USD, EUR)")
    reference_id: Optional[str] = Field(None, description="Merchant reference ID")
    customer_name: Optional[str] = Field(None, description="Customer name")
    customer_email: Optional[str] = Field(None, description="Customer email")


class CreateWeChatQRRequest(BaseModel):
    """Request to create a WeChat Pay QR code."""
    amount: float = Field(..., gt=0, description="Payment amount")
    description: Optional[str] = Field(None, description="Payment description")
    currency: Optional[str] = Field("PHP", description="Currency (PHP, CNY, USD, EUR)")
    reference_id: Optional[str] = Field(None, description="Merchant reference ID")
    customer_name: Optional[str] = Field(None, description="Customer name")
    customer_email: Optional[str] = Field(None, description="Customer email")


class CreateDynamicQRRequest(BaseModel):
    """Request to create a dynamic QR code for Alipay or WeChat."""
    payment_method: str = Field(..., description="Payment method: 'alipay' or 'wechat'")
    amount: float = Field(..., gt=0, description="Payment amount")
    description: Optional[str] = Field(None, description="Payment description")
    currency: Optional[str] = Field(None, description="Currency (auto-selected if not specified)")
    reference_id: Optional[str] = Field(None, description="Merchant reference ID")
    customer_name: Optional[str] = Field(None, description="Customer name")
    customer_email: Optional[str] = Field(None, description="Customer email")


class ConvertCurrencyRequest(BaseModel):
    """Request to convert between currencies."""
    amount: float = Field(..., gt=0, description="Amount to convert")
    from_currency: str = Field(..., description="Source currency")
    to_currency: str = Field(..., description="Target currency")


class CreateCheckoutSessionRequest(BaseModel):
    """Request to create a Magpie Checkout Session."""
    amount: float = Field(..., gt=0, description="Payment amount")
    currency: Optional[str] = Field("PHP", description="Currency (PHP, CNY, USD, EUR)")
    product_name: str = Field(..., description="Name of the product or service")
    payment_method_types: List[str] = Field(default_factory=lambda: ["alipay", "wechat_pay"], description="Allowed payment methods")
    reference_id: Optional[str] = Field(None, description="Merchant reference ID")
    customer_name: Optional[str] = Field(None, description="Customer name")
    customer_email: Optional[str] = Field(None, description="Customer email")


class QRCodeResponse(BaseModel):
    """Standard response for QR code generation."""
    success: bool
    payment_method: Optional[str] = None
    qr_code: Optional[str] = None
    qr_url: Optional[str] = None
    qr_content: Optional[str] = None
    reference_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    original_amount: Optional[float] = None
    original_currency: Optional[str] = None
    checkout_url: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None


class CurrencyConversionResponse(BaseModel):
    """Response for currency conversion."""
    success: bool
    amount: float
    from_currency: str
    to_currency: str
    converted_amount: float
    rate: float
    error: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════

async def _record_qr_transaction(
    db: AsyncSession,
    user_id: str,
    payment_method: str,
    amount: float,
    currency: str,
    reference_id: str,
    gateway_id: Optional[str],
    qr_code_url: Optional[str],
    description: str,
    customer_email: Optional[str],
    transaction_type: Optional[str] = None,
    payment_url: Optional[str] = None,
) -> None:
    """Record QR code generation or checkout session as a transaction."""
    try:
        from models.transactions import Transactions
        
        now = datetime.now(timezone.utc)
        if not transaction_type:
            transaction_type = f"{payment_method.lower()}_qr"
        
        txn = Transactions(
            user_id=user_id,
            transaction_type=transaction_type,
            external_id=reference_id,
            xendit_id=gateway_id, # Store provider ID (Magpie request ID)
            amount=amount,
            currency=currency,
            status="pending",
            description=description,
            qr_code_url=qr_code_url,
            payment_url=payment_url,
            customer_email=customer_email,
            created_at=now,
            updated_at=now,
        )
        
        db.add(txn)
        await db.commit()
        logger.info(
            f"Recorded {transaction_type} transaction: {reference_id} "
            f"({amount} {currency})"
        )
    except Exception as e:
        logger.error(f"Failed to record QR transaction: {e}", exc_info=True)
        # Don't fail the entire request if transaction recording fails


# ═══════════════════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════════════════

@router.post("/alipay", response_model=QRCodeResponse)
async def create_alipay_qr(
    payload: CreateAlipayQRRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an Alipay QR code.
    
    - **amount**: Payment amount in the specified currency
    - **currency**: Currency code (PHP, CNY, USD, EUR) - defaults to PHP
    - **description**: Payment description
    - **reference_id**: Your unique reference (auto-generated if not provided)
    - **customer_name**: Customer name (optional)
    - **customer_email**: Customer email (optional)
    
    The service automatically converts PHP to CNY for Alipay processing.
    """
    service = MagpieQRService()
    
    if not service.is_configured:
        logger.warning("Alipay QR request but Magpie API not configured")
        return QRCodeResponse(
            success=False,
            error="Magpie API is not configured. Please set MAGPIE_API_KEY in environment variables.",
        )
    
    try:
        reference_id = payload.reference_id or f"alipay-{uuid.uuid4().hex[:12]}"
        
        result = await service.create_alipay_qr(
            amount=payload.amount,
            description=payload.description or "Alipay Payment",
            currency=payload.currency or "PHP",
            reference_id=reference_id,
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
        )
        
        # Record transaction if successful
        if result.get("success"):
            await _record_qr_transaction(
                db=db,
                user_id=current_user.id,
                payment_method="alipay",
                amount=payload.amount,
                currency=payload.currency or "PHP",
                reference_id=reference_id,
                gateway_id=result.get("data", {}).get("id"),
                qr_code_url=result.get("payment_url") or result.get("qr_url"),
                description=payload.description or "Alipay Payment",
                customer_email=payload.customer_email,
            )

            # Generate local checkout URL
            from core.config import settings
            public_host = (getattr(settings, 'public_checkout_host', '') or getattr(settings, 'railway_public_domain', '') or '').strip()
            if public_host:
                if not public_host.startswith('http'):
                    public_host = f"https://{public_host.lstrip('/')}"
                result["checkout_url"] = f"{public_host.rstrip('/')}/checkout/{reference_id}"
            else:
                result["checkout_url"] = f"/checkout/{reference_id}"

            logger.info(
                f"Alipay QR created: {reference_id} "
                f"({payload.amount} {payload.currency or 'PHP'})"
            )
        
        return QRCodeResponse(**result)
    
    except Exception as e:
        logger.error(f"Error creating Alipay QR: {e}", exc_info=True)
        return QRCodeResponse(
            success=False,
            error=f"Failed to create Alipay QR: {str(e)}",
        )


@router.post("/wechat", response_model=QRCodeResponse)
async def create_wechat_qr(
    payload: CreateWeChatQRRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a WeChat Pay QR code.
    
    - **amount**: Payment amount in the specified currency
    - **currency**: Currency code (PHP, CNY, USD, EUR) - defaults to PHP
    - **description**: Payment description
    - **reference_id**: Your unique reference (auto-generated if not provided)
    - **customer_name**: Customer name (optional)
    - **customer_email**: Customer email (optional)
    
    The service automatically converts PHP to CNY for WeChat processing.
    """
    service = MagpieQRService()
    
    if not service.is_configured:
        logger.warning("WeChat QR request but Magpie API not configured")
        return QRCodeResponse(
            success=False,
            error="Magpie API is not configured. Please set MAGPIE_API_KEY in environment variables.",
        )
    
    try:
        reference_id = payload.reference_id or f"wechat-{uuid.uuid4().hex[:12]}"
        
        result = await service.create_wechat_qr(
            amount=payload.amount,
            description=payload.description or "WeChat Payment",
            currency=payload.currency or "PHP",
            reference_id=reference_id,
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
        )
        
        # Record transaction if successful
        if result.get("success"):
            await _record_qr_transaction(
                db=db,
                user_id=current_user.id,
                payment_method="wechat",
                amount=payload.amount,
                currency=payload.currency or "PHP",
                reference_id=reference_id,
                gateway_id=result.get("data", {}).get("id"),
                qr_code_url=result.get("payment_url") or result.get("qr_url"),
                description=payload.description or "WeChat Payment",
                customer_email=payload.customer_email,
            )

            # Generate local checkout URL
            from core.config import settings
            public_host = (getattr(settings, 'public_checkout_host', '') or getattr(settings, 'railway_public_domain', '') or '').strip()
            if public_host:
                if not public_host.startswith('http'):
                    public_host = f"https://{public_host.lstrip('/')}"
                result["checkout_url"] = f"{public_host.rstrip('/')}/checkout/{reference_id}"
            else:
                result["checkout_url"] = f"/checkout/{reference_id}"

            logger.info(
                f"WeChat QR created: {reference_id} "
                f"({payload.amount} {payload.currency or 'PHP'})"
            )
        
        return QRCodeResponse(**result)
    
    except Exception as e:
        logger.error(f"Error creating WeChat QR: {e}", exc_info=True)
        return QRCodeResponse(
            success=False,
            error=f"Failed to create WeChat QR: {str(e)}",
        )


@router.post("/dynamic", response_model=QRCodeResponse)
async def create_dynamic_qr(
    payload: CreateDynamicQRRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a dynamic QR code for either Alipay or WeChat Pay.
    
    - **payment_method**: "alipay" or "wechat"
    - **amount**: Payment amount
    - **currency**: Currency (auto-selected to CNY if not specified)
    - **description**: Payment description
    - **reference_id**: Your unique reference (auto-generated if not provided)
    - **customer_name**: Customer name (optional)
    - **customer_email**: Customer email (optional)
    
    This endpoint automatically selects the best currency for the payment method.
    """
    service = MagpieQRService()
    
    if not service.is_configured:
        logger.warning(f"{payload.payment_method} QR request but Magpie API not configured")
        return QRCodeResponse(
            success=False,
            error="Magpie API is not configured. Please set MAGPIE_API_KEY in environment variables.",
        )
    
    try:
        reference_id = payload.reference_id or f"qr-{uuid.uuid4().hex[:12]}"
        
        result = await service.create_dynamic_qr(
            payment_method=payload.payment_method,
            amount=payload.amount,
            description=payload.description or f"{payload.payment_method.title()} Payment",
            currency=payload.currency,
            reference_id=reference_id,
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
        )
        
        # Record transaction if successful
        if result.get("success"):
            await _record_qr_transaction(
                db=db,
                user_id=current_user.id,
                payment_method=payload.payment_method,
                amount=payload.amount,
                currency=result.get("currency", "CNY"),
                reference_id=reference_id,
                gateway_id=result.get("data", {}).get("id"),
                qr_code_url=result.get("payment_url") or result.get("qr_url"),
                description=payload.description or f"{payload.payment_method.title()} Payment",
                customer_email=payload.customer_email,
            )

            # Generate local checkout URL
            from core.config import settings
            public_host = (getattr(settings, 'public_checkout_host', '') or getattr(settings, 'railway_public_domain', '') or '').strip()
            if public_host:
                if not public_host.startswith('http'):
                    public_host = f"https://{public_host.lstrip('/')}"
                result["checkout_url"] = f"{public_host.rstrip('/')}/checkout/{reference_id}"
            else:
                result["checkout_url"] = f"/checkout/{reference_id}"

            logger.info(
                f"Dynamic QR created: {reference_id} "
                f"({payload.payment_method}, {payload.amount} {result.get('currency', 'CNY')})"
            )
        
        return QRCodeResponse(**result)
    
    except Exception as e:
        logger.error(f"Error creating dynamic QR: {e}", exc_info=True)
        return QRCodeResponse(
            success=False,
            error=f"Failed to create QR code: {str(e)}",
        )


@router.post("/checkout/session", response_model=QRCodeResponse)
async def create_magpie_checkout_session(
    payload: CreateCheckoutSessionRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a Magpie Checkout Session for Alipay/WeChat Pay.
    Returns a short, branded self-hosted link.
    """
    service = MagpieService()

    if not service.api_key:
        raise HTTPException(status_code=400, detail="Magpie API key not configured")

    try:
        reference_id = payload.reference_id or f"magpie-{uuid.uuid4().hex[:12]}"
        amount_cents = int(round(payload.amount * 100))

        # Build success/fail URLs
        from core.config import settings
        public_host = (getattr(settings, 'public_checkout_host', '') or getattr(settings, 'railway_public_domain', '') or 'swiftpay.ph').strip()
        if not public_host.startswith('http'):
            public_host = f"https://{public_host.lstrip('/')}"

        success_url = f"{public_host}/checkout/{reference_id}?status=success"
        cancel_url = f"{public_host}/checkout/{reference_id}?status=cancel"

        result = await service.create_session(
            amount_cents=amount_cents,
            currency=payload.currency or "PHP",
            product_name=payload.product_name,
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=reference_id,
            payment_method_types=payload.payment_method_types
        )

        if not result.get("success"):
            return QRCodeResponse(success=False, error=result.get("error"))

        session_data = result.get("data", {})
        magpie_url = session_data.get("url")

        # Record transaction
        await _record_qr_transaction(
            db=db,
            user_id=current_user.id,
            payment_method="magpie",
            amount=payload.amount,
            currency=payload.currency or "PHP",
            reference_id=reference_id,
            gateway_id=session_data.get("id"),
            qr_code_url=None,
            description=payload.product_name,
            customer_email=payload.customer_email,
            transaction_type="magpie_checkout",
            payment_url=magpie_url
        )

        # Branded Self-Hosted URL
        checkout_url = f"{public_host.rstrip('/')}/checkout/{reference_id}"

        return QRCodeResponse(
            success=True,
            payment_method="magpie_checkout",
            reference_id=reference_id,
            amount=payload.amount,
            currency=payload.currency,
            checkout_url=checkout_url
        )

    except Exception as e:
        logger.error(f"Error creating Magpie checkout session: {e}", exc_info=True)
        return QRCodeResponse(success=False, error=str(e))


@router.post("/convert", response_model=CurrencyConversionResponse)
async def convert_currency(
    payload: ConvertCurrencyRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """
    Convert between supported currencies.
    
    Supported currencies: PHP, CNY, USD, EUR
    
    - **amount**: Amount to convert
    - **from_currency**: Source currency code
    - **to_currency**: Target currency code
    
    Returns the converted amount and the exchange rate used.
    """
    try:
        from_currency = (payload.from_currency or "").upper()
        to_currency = (payload.to_currency or "").upper()
        
        if not from_currency or not to_currency:
            return CurrencyConversionResponse(
                success=False,
                amount=payload.amount,
                from_currency=from_currency,
                to_currency=to_currency,
                converted_amount=0,
                rate=0,
                error="Both from_currency and to_currency are required",
            )
        
        if from_currency == to_currency:
            return CurrencyConversionResponse(
                success=True,
                amount=payload.amount,
                from_currency=from_currency,
                to_currency=to_currency,
                converted_amount=payload.amount,
                rate=1.0,
            )
        
        # Perform conversion
        converted = CurrencyConverter.convert(
            payload.amount, from_currency, to_currency
        )
        
        # Calculate rate
        rate = converted / payload.amount if payload.amount > 0 else 0
        
        return CurrencyConversionResponse(
            success=True,
            amount=payload.amount,
            from_currency=from_currency,
            to_currency=to_currency,
            converted_amount=converted,
            rate=round(rate, 4),
        )
    
    except Exception as e:
        logger.error(f"Currency conversion error: {e}", exc_info=True)
        return CurrencyConversionResponse(
            success=False,
            amount=payload.amount,
            from_currency=payload.from_currency,
            to_currency=payload.to_currency,
            converted_amount=0,
            rate=0,
            error=str(e),
        )


@router.get("/exchange-rates")
async def get_exchange_rates(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """
    Get current exchange rates.
    
    Returns a dictionary of supported currencies and their conversion rates to PHP.
    """
    return {
        "success": True,
        "base_currency": "PHP",
        "rates": {
            "PHP": CurrencyConverter.EXCHANGE_RATES.get("PHP", 1.0),
            "CNY": CurrencyConverter.EXCHANGE_RATES.get("CNY", 0.0137),
            "USD": CurrencyConverter.EXCHANGE_RATES.get("USD", 0.0184),
            "EUR": CurrencyConverter.EXCHANGE_RATES.get("EUR", 0.0170),
        },
        "alipay_currencies": CurrencyConverter.ALIPAY_CURRENCIES,
        "wechat_currencies": CurrencyConverter.WECHAT_CURRENCIES,
        "note": "Rates are approximate and for reference only. Use /convert endpoint for accurate conversions.",
    }


@router.get("/health")
async def health_check(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """
    Check if Magpie QR service is configured and ready.
    """
    service = MagpieQRService()
    
    return {
        "success": True,
        "service": "magpie-qr",
        "configured": service.is_configured,
        "base_url": service.base_url if service.is_configured else None,
        "message": (
            "Magpie QR service is ready"
            if service.is_configured
            else "Magpie API key not configured. Set MAGPIE_API_KEY environment variable."
        ),
    }
