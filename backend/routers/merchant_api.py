import logging
import secrets
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.merchant_api_config import MerchantApiConfig, generate_key
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/merchant/api-config", tags=["merchant-api"])


class ApiConfigResponse(BaseModel):
    organization_id: str
    test_access_key: str
    test_secret_key: Optional[str] = None
    live_access_key: str
    live_secret_key: Optional[str] = None

    test_callback_url: Optional[str] = None
    test_status_page_mode: str
    test_external_status_url: Optional[str] = None
    test_success_url: Optional[str] = None
    test_cancel_url: Optional[str] = None
    test_failure_url: Optional[str] = None

    live_callback_url: Optional[str] = None
    live_status_page_mode: str
    live_external_status_url: Optional[str] = None
    live_success_url: Optional[str] = None
    live_cancel_url: Optional[str] = None
    live_failure_url: Optional[str] = None


class ApiConfigUpdate(BaseModel):
    test_callback_url: Optional[str] = None
    test_status_page_mode: Optional[str] = None
    test_external_status_url: Optional[str] = None
    test_success_url: Optional[str] = None
    test_cancel_url: Optional[str] = None
    test_failure_url: Optional[str] = None

    live_callback_url: Optional[str] = None
    live_status_page_mode: Optional[str] = None
    live_external_status_url: Optional[str] = None
    live_success_url: Optional[str] = None
    live_cancel_url: Optional[str] = None
    live_failure_url: Optional[str] = None


class GenerateSecretRequest(BaseModel):
    mode: str  # "test" or "live"


@router.get("", response_model=ApiConfigResponse)
async def get_merchant_api_config(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Organization membership required")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == current_user.organization_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        # Create default config if not exists
        config = MerchantApiConfig(organization_id=current_user.organization_id)
        db.add(config)
        await db.commit()
        await db.refresh(config)

    return config


@router.patch("", response_model=ApiConfigResponse)
async def update_merchant_api_config(
    payload: ApiConfigUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Organization membership required")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == current_user.organization_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        config = MerchantApiConfig(organization_id=current_user.organization_id)
        db.add(config)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)
    return config


@router.post("/generate-secret", response_model=Dict[str, str])
async def generate_merchant_secret_key(
    payload: GenerateSecretRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Organization membership required")

    if payload.mode not in ("test", "live"):
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'test' or 'live'.")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == current_user.organization_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        config = MerchantApiConfig(organization_id=current_user.organization_id)
        db.add(config)

    new_secret = generate_key(f"SK_{payload.mode.upper()}_")

    if payload.mode == "test":
        config.test_secret_key = new_secret
    else:
        config.live_secret_key = new_secret

    await db.commit()
    return {"secret_key": new_secret}


@router.post("/{org_id}/generate-secret", response_model=Dict[str, str])
async def admin_generate_merchant_secret_key(
    org_id: str,
    payload: GenerateSecretRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super Admin: Regenerate secret key for any organization."""
    if not (current_user.permissions and current_user.permissions.is_super_admin):
        raise HTTPException(status_code=403, detail="Super admin access required")

    if payload.mode not in ("test", "live"):
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'test' or 'live'.")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == org_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        config = MerchantApiConfig(organization_id=org_id)
        db.add(config)

    new_secret = generate_key(f"SK_{payload.mode.upper()}_")

    if payload.mode == "test":
        config.test_secret_key = new_secret
    else:
        config.live_secret_key = new_secret

    await db.commit()
    return {"secret_key": new_secret}


@router.post("/{org_id}/reset-secret", response_model=Dict[str, bool])
async def admin_reset_merchant_secret_key(
    org_id: str,
    payload: GenerateSecretRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super Admin: Clear secret key for any organization."""
    if not (current_user.permissions and current_user.permissions.is_super_admin):
        raise HTTPException(status_code=403, detail="Super admin access required")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == org_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        return {"success": True}

    if payload.mode == "test":
        config.test_secret_key = None
    else:
        config.live_secret_key = None

    await db.commit()
    return {"success": True}
