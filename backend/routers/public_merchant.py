import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.merchant_api_config import MerchantApiConfig

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/public/merchant", tags=["public-merchant"])


class PublicMerchantInfo(BaseModel):
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    organization_id: str


@router.get("/{slug}", response_model=PublicMerchantInfo)
async def get_public_merchant_info(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MerchantApiConfig).where(MerchantApiConfig.permanent_link_slug == slug)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(status_code=404, detail="Merchant not found")

    return {
        "store_name": config.store_name or "SwiftPay Merchant",
        "store_logo_url": config.store_logo_url,
        "organization_id": config.organization_id
    }


@router.get("/platform/branding", response_model=PublicMerchantInfo)
async def get_platform_branding(
    db: AsyncSession = Depends(get_db),
):
    from core.config import settings
    platform_org_id = getattr(settings, "platform_organization_id", "swiftpay-ph")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == platform_org_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        return {
            "store_name": "SwiftPay",
            "store_logo_url": "/logo.svg",
            "organization_id": platform_org_id
        }

    return {
        "store_name": config.store_name or "SwiftPay",
        "store_logo_url": config.store_logo_url or "/logo.svg",
        "organization_id": config.organization_id
    }
