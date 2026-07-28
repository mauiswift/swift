import os
import uuid
import secrets
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import settings
from dependencies.auth import get_current_user
from models.merchant_api_config import MerchantApiConfig, generate_key
from models.admin_users import AdminUser
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/merchant/api-config", tags=["merchant-api"])


class ApiConfigResponse(BaseModel):
    organization_id: str
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    permanent_link_slug: Optional[str] = None

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
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    permanent_link_slug: Optional[str] = None

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
        random_suffix = secrets.token_hex(3).lower()
        default_slug = f"{current_user.organization_id.lower().replace(' ', '-')[:24]}-{random_suffix}"
        # Ensure slug is unique if necessary, for now we just use org_id as base
        config = MerchantApiConfig(
            organization_id=current_user.organization_id,
            store_name=current_user.organization_name,
            permanent_link_slug=default_slug
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
    elif not config.permanent_link_slug:
        # Generate default slug if missing
        random_suffix = secrets.token_hex(3).lower()
        config.permanent_link_slug = f"{current_user.organization_id.lower().replace(' ', '-')[:24]}-{random_suffix}"
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

    try:
        # Sync organization_name if store_name is updated
        if payload.store_name:
            from models.admin_users import AdminUser
            from sqlalchemy import update
            await db.execute(
                update(AdminUser)
                .where(AdminUser.organization_id == current_user.organization_id)
                .values(organization_name=payload.store_name)
            )

        await db.commit()
        await db.refresh(config)
        return config
    except Exception as e:
        logger.error(f"Failed to update merchant api config: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/upload-logo")
async def upload_merchant_logo(
    logo: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a new logo for the merchant organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Organization membership required")

    # Define upload directory
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", "logos")
    os.makedirs(uploads_dir, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(logo.filename)[1] or ".png"
    filename = f"logo_{current_user.organization_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(uploads_dir, filename)

    # Save file
    content = await logo.read()
    with open(file_path, "wb") as f:
        f.write(content)

    logo_url = f"/uploads/logos/{filename}"

    # Update API config
    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == current_user.organization_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        config = MerchantApiConfig(organization_id=current_user.organization_id)
        db.add(config)

    config.store_logo_url = logo_url
    await db.commit()

    return {"success": True, "logo_url": logo_url}
