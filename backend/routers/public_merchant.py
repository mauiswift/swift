import logging
import math
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.merchant_api_config import MerchantApiConfig
from models.admin_users import AdminUser
from services.payment_gateway import PaymentGateway

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/public/merchant", tags=["public-merchant"])
SUPPORTED_LINK_CURRENCIES = {"PHP", "KRW", "CNY", "USDT"}


class PublicMerchantInfo(BaseModel):
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    organization_id: str
    collection_currency: str = "PHP"
    store_slug: str = "3"


class PublicMerchantPaymentRequest(BaseModel):
    amount: float
    description: Optional[str] = None
    currency: Optional[str] = None


def _resolve_link_currency(currency: Optional[str], configured_currency: Optional[str]) -> str:
    configured = (configured_currency or "PHP").strip().upper()
    if configured not in SUPPORTED_LINK_CURRENCIES:
        raise HTTPException(status_code=400, detail="Merchant currency is not supported")
    if currency and currency.strip().upper() != configured:
        raise HTTPException(status_code=400, detail="This permanent link is for a different currency")
    selected = currency.strip().upper() if currency else configured
    if selected not in SUPPORTED_LINK_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported payment currency")
    return selected


async def _get_public_merchant_config(
    db: AsyncSession,
    slug: str,
) -> MerchantApiConfig:
    """Resolve a permanent link to one deterministic merchant configuration."""
    stmt = (
        select(MerchantApiConfig)
        .where(MerchantApiConfig.permanent_link_slug == slug)
        .order_by(MerchantApiConfig.id.asc())
        .limit(1)
    )
    config = (await db.execute(stmt)).scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return config


async def _get_public_merchant_owner(
    db: AsyncSession,
    config: MerchantApiConfig,
) -> AdminUser:
    """Resolve the wallet owner attached to the permanent link."""
    owner = None
    if config.user_id:
        owner = await db.scalar(
            select(AdminUser).where(
                AdminUser.telegram_id == str(config.user_id),
                AdminUser.is_active.is_(True),
            )
        )
    if owner:
        return owner

    # Older merchant configs may predate the required user_id association.
    # Resolve the organization's active owner deterministically before treating
    # the permanent link as orphaned.
    result = await db.execute(
        select(AdminUser)
        .where(
            AdminUser.organization_id == config.organization_id,
            AdminUser.is_active.is_(True),
            or_(AdminUser.role == "owner", AdminUser.is_super_admin.is_(False)),
        )
        .order_by(
            (AdminUser.role == "owner").desc(),
            AdminUser.id.asc(),
        )
        .limit(1)
    )
    owner = result.scalars().first()
    if not owner:
        raise HTTPException(status_code=404, detail="Merchant owner not found")
    return owner


@router.get("/{slug}", response_model=PublicMerchantInfo)
async def get_public_merchant_info(
    slug: str,
    currency: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_public_merchant_config(db, slug)
    link_currency = _resolve_link_currency(currency, config.collection_currency)

    return {
        "store_name": config.store_name or "SwiftPay Merchant",
        "store_logo_url": config.store_logo_url,
        "organization_id": config.organization_id,
        "collection_currency": link_currency,
        "store_slug": config.store_slug or "3",
    }


@router.post("/{slug}/payment")
async def create_public_merchant_payment(
    slug: str,
    payload: PublicMerchantPaymentRequest,
    currency: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Create a self-hosted checkout transaction from a permanent merchant link."""
    if not math.isfinite(payload.amount) or payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be a positive finite number")

    config = await _get_public_merchant_config(db, slug)
    link_currency = _resolve_link_currency(currency or payload.currency, config.collection_currency)
    owner = await _get_public_merchant_owner(db, config)

    result = await PaymentGateway(db).create_payment(
        db=db,
        user_id=str(owner.telegram_id),
        amount=payload.amount,
        currency=link_currency,
        transaction_type="payment_link",
        external_id=f"PUBLIC-PAY-{uuid.uuid4().hex[:16].upper()}",
        description=(payload.description or config.store_name or "Payment").strip(),
        metadata={"permanent_link_slug": slug},
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Payment could not be created"))

    payment_data = result.get("data") or {}
    external_id = payment_data.get("payment_id") or payment_data.get("external_id")
    checkout_url = payment_data.get("checkout_url") or payment_data.get("payment_url")
    if not external_id or not checkout_url:
        logger.error("Public payment creation returned incomplete payment data for slug %s: %s", slug, result)
        raise HTTPException(status_code=502, detail="Payment could not be initialized")

    return {
        "success": True,
        "external_id": external_id,
        "checkout_url": checkout_url,
        "amount": payload.amount,
        "currency": link_currency,
        "gateway": payment_data.get("gateway"),
    }


@router.get("/platform/branding", response_model=PublicMerchantInfo)
async def get_platform_branding(
    db: AsyncSession = Depends(get_db),
):
    from core.config import settings
    platform_org_id = getattr(settings, "platform_organization_id", "swiftpay-ph")

    stmt = (
        select(MerchantApiConfig)
        .where(MerchantApiConfig.organization_id == platform_org_id)
        .order_by(MerchantApiConfig.id)
        .limit(1)
    )
    result = await db.execute(stmt)
    config = result.scalars().first()

    if not config:
        return {
            "store_name": "SwiftPay",
            "store_logo_url": "/logo.svg",
            "organization_id": platform_org_id,
            "collection_currency": "PHP",
        }

    return {
        "store_name": config.store_name or "SwiftPay",
        "store_logo_url": config.store_logo_url or "/logo.svg",
        "organization_id": config.organization_id,
        "collection_currency": (config.collection_currency or "PHP").upper(),
    }
