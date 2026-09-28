import os
import uuid
import secrets
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator
from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import settings
from dependencies.auth import get_current_user
from models.merchant_api_config import MerchantApiConfig, generate_key
from models.admin_users import AdminUser
from schemas.auth import UserResponse
from services.app_settings import get_enabled_collection_currencies
from services.wallets import WalletsService
from services.auth import _get_platform_organization

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/merchant/api-config", tags=["merchant-api"])

FIXED_STORE_SLUG_CURRENCIES = {"KRW", "PHP", "CNY"}
FIXED_STORE_SLUG = "3"


class ApiConfigResponse(BaseModel):
    organization_id: str
    user_id: Optional[str] = None
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    permanent_link_slug: Optional[str] = None
    store_slug: str = "3"
    collection_currency: str = "PHP"
    krw_access_granted: bool = False

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
    store_slug: Optional[str] = None
    collection_currency: Optional[str] = None

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

    @field_validator(
        "test_callback_url",
        "test_external_status_url",
        "test_success_url",
        "test_cancel_url",
        "test_failure_url",
        "live_callback_url",
        "live_external_status_url",
        "live_success_url",
        "live_cancel_url",
        "live_failure_url",
    )
    @classmethod
    def validate_url(cls, value: Optional[str]) -> Optional[str]:
        value = value.strip() if value else None
        if value and not value.startswith(("http://", "https://")):
            raise ValueError("Integration URLs must use http:// or https://")
        return value

    @field_validator("test_status_page_mode", "live_status_page_mode")
    @classmethod
    def validate_status_page_mode(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in {"swiftpay", "external"}:
            raise ValueError("Status page mode must be 'swiftpay' or 'external'")
        return value


class GenerateSecretRequest(BaseModel):
    mode: str  # "test" or "live"


def _merchant_organization_id(current_user: UserResponse) -> str:
    if current_user.organization_id:
        return current_user.organization_id
    if current_user.permissions and current_user.permissions.is_super_admin:
        platform_org_id, _ = _get_platform_organization()
        return platform_org_id
    raise HTTPException(status_code=403, detail="Organization membership required")


def _merchant_user_id(current_user: UserResponse) -> str:
    return str(current_user.id)


def _require_store_profile_edit_access(current_user: UserResponse) -> None:
    permissions = current_user.permissions
    if not permissions or not (
        permissions.is_super_admin
        or permissions.can_manage_payments
        or permissions.can_manage_team
    ):
        raise HTTPException(status_code=403, detail="Permission to manage the merchant store profile is required")


async def _get_organization_merchant_config(
    db: AsyncSession,
    organization_id: str,
    current_user_id: Optional[str] = None,
) -> Optional[MerchantApiConfig]:
    """Resolve the canonical org-scoped default config before falling back to a user-specific config."""
    query = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == organization_id)
    if current_user_id:
        query = query.where(
            or_(
                MerchantApiConfig.user_id.is_(None),
                MerchantApiConfig.user_id == str(current_user_id),
            )
        )
    else:
        query = query.where(MerchantApiConfig.user_id.is_(None))

    query = query.order_by(
        (MerchantApiConfig.user_id.is_(None)).desc(),
        MerchantApiConfig.id.asc(),
    ).limit(1)
    config = (await db.execute(query)).scalars().first()
    if config is not None:
        return config

    if current_user_id:
        fallback = await db.execute(
            select(MerchantApiConfig)
            .where(
                MerchantApiConfig.organization_id == organization_id,
                MerchantApiConfig.user_id == str(current_user_id),
            )
            .order_by(MerchantApiConfig.id.asc())
            .limit(1)
        )
        return fallback.scalars().first()

    return None


async def _get_user_merchant_config(
    db: AsyncSession,
    organization_id: str,
    user_id: str,
) -> Optional[MerchantApiConfig]:
    result = await db.execute(
        select(MerchantApiConfig)
        .where(
            MerchantApiConfig.organization_id == organization_id,
            MerchantApiConfig.user_id == str(user_id),
        )
        .order_by(MerchantApiConfig.id.asc())
        .limit(1)
    )
    return result.scalars().first()


async def _get_or_create_shared_store_profile(
    db: AsyncSession,
    organization_id: str,
    current_user_id: str,
    organization_name: Optional[str] = None,
) -> MerchantApiConfig:
    shared_result = await db.execute(
        select(MerchantApiConfig)
        .where(
            MerchantApiConfig.organization_id == organization_id,
            MerchantApiConfig.user_id.is_(None),
        )
        .order_by(MerchantApiConfig.id.asc())
        .limit(1)
    )
    shared_config = shared_result.scalars().first()
    if shared_config:
        return shared_config

    owner_id = await db.scalar(
        select(AdminUser.telegram_id)
        .where(
            AdminUser.organization_id == organization_id,
            AdminUser.role == "owner",
            AdminUser.is_active.is_(True),
        )
        .order_by(AdminUser.id.asc())
        .limit(1)
    )
    legacy_config = await _get_organization_merchant_config(
        db, organization_id, str(owner_id or current_user_id)
    )
    if not legacy_config and owner_id and str(owner_id) != str(current_user_id):
        legacy_config = await _get_organization_merchant_config(
            db, organization_id, str(current_user_id)
        )

    shared_config = MerchantApiConfig(
        organization_id=organization_id,
        user_id=None,
        store_name=(legacy_config.store_name if legacy_config else None) or organization_name,
        store_logo_url=legacy_config.store_logo_url if legacy_config else None,
        permanent_link_slug=legacy_config.permanent_link_slug if legacy_config else None,
        store_slug=(legacy_config.store_slug if legacy_config else None) or FIXED_STORE_SLUG,
        collection_currency=(legacy_config.collection_currency if legacy_config else None) or "PHP",
        krw_access_granted=bool(legacy_config.krw_access_granted) if legacy_config else False,
    )
    if legacy_config and legacy_config.permanent_link_slug:
        legacy_config.permanent_link_slug = None
        await db.flush()
    db.add(shared_config)
    await db.flush()
    return shared_config


def _build_api_config_response(
    profile_config: MerchantApiConfig,
    api_config: MerchantApiConfig,
) -> ApiConfigResponse:
    profile_fields = (
        "store_name",
        "store_logo_url",
        "permanent_link_slug",
        "store_slug",
        "collection_currency",
        "krw_access_granted",
    )
    api_fields = (
        "test_access_key",
        "test_secret_key",
        "live_access_key",
        "live_secret_key",
        "test_callback_url",
        "test_status_page_mode",
        "test_external_status_url",
        "test_success_url",
        "test_cancel_url",
        "test_failure_url",
        "live_callback_url",
        "live_status_page_mode",
        "live_external_status_url",
        "live_success_url",
        "live_cancel_url",
        "live_failure_url",
    )
    return ApiConfigResponse(
        organization_id=profile_config.organization_id,
        user_id=api_config.user_id,
        **{field: getattr(profile_config, field) for field in profile_fields},
        **{field: getattr(api_config, field) for field in api_fields},
    )


@router.get("", response_model=ApiConfigResponse)
async def get_merchant_api_config(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    organization_id = _merchant_organization_id(current_user)
    user_id = _merchant_user_id(current_user)

    profile_config = await _get_or_create_shared_store_profile(
        db, organization_id, user_id, current_user.organization_name
    )
    api_config = await _get_user_merchant_config(db, organization_id, user_id)
    if not api_config:
        api_config = profile_config

    if not profile_config.permanent_link_slug:
        random_suffix = secrets.token_hex(3).lower()
        profile_config.permanent_link_slug = f"{organization_id.lower().replace(' ', '-')[:24]}-{random_suffix}"

    if (profile_config.collection_currency or "PHP").upper() in FIXED_STORE_SLUG_CURRENCIES and profile_config.store_slug != FIXED_STORE_SLUG:
        profile_config.store_slug = FIXED_STORE_SLUG

    await db.commit()
    await db.refresh(profile_config)
    if api_config is not profile_config:
        await db.refresh(api_config)
    return _build_api_config_response(profile_config, api_config)


@router.patch("", response_model=ApiConfigResponse)
async def update_merchant_api_config(
    payload: ApiConfigUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    organization_id = _merchant_organization_id(current_user)
    user_id = _merchant_user_id(current_user)

    profile_config = await _get_or_create_shared_store_profile(
        db, organization_id, user_id, current_user.organization_name
    )
    api_config = await _get_user_merchant_config(db, organization_id, user_id) or profile_config

    values = payload.model_dump(exclude_unset=True)
    requested_store_slug = values.pop("store_slug", None)
    profile_field_names = {
        "store_name",
        "store_logo_url",
        "permanent_link_slug",
        "collection_currency",
    }
    profile_values = {field: value for field, value in values.items() if field in profile_field_names}
    api_values = {field: value for field, value in values.items() if field not in profile_field_names}
    values.pop("store_slug", None)
    if profile_values or requested_store_slug is not None:
        _require_store_profile_edit_access(current_user)
    requested_permanent_slug = profile_values.get("permanent_link_slug")
    if requested_permanent_slug:
        requested_permanent_slug = str(requested_permanent_slug).strip()
        profile_values["permanent_link_slug"] = requested_permanent_slug or None
        if requested_permanent_slug:
            conflict = await db.scalar(
                select(MerchantApiConfig.id).where(
                    MerchantApiConfig.permanent_link_slug == requested_permanent_slug,
                    MerchantApiConfig.id != profile_config.id if profile_config.id is not None else True,
                )
            )
            if conflict is not None:
                await db.rollback()
                raise HTTPException(status_code=409, detail="That public store slug is already in use. Choose another slug.")
    if "collection_currency" in profile_values:
        requested_currency = str(profile_values["collection_currency"]).upper()
        profile_values["collection_currency"] = requested_currency
        # Validate against settings without flushing a newly-created config.
        with db.no_autoflush:
            enabled_currencies = await get_enabled_collection_currencies(db)
        if requested_currency not in enabled_currencies:
            raise HTTPException(status_code=400, detail="That collection currency is currently disabled by the main administrator")

        if requested_currency == "KRW":
            profile_config.krw_access_granted = True

    effective_currency = str(profile_values.get("collection_currency", profile_config.collection_currency or "PHP")).upper()
    if effective_currency in FIXED_STORE_SLUG_CURRENCIES:
        profile_config.store_slug = FIXED_STORE_SLUG
    elif requested_store_slug is not None:
        profile_config.store_slug = str(requested_store_slug).strip() or FIXED_STORE_SLUG

    for field, value in profile_values.items():
        setattr(profile_config, field, value)
    for field, value in api_values.items():
        setattr(api_config, field, value)

    try:
        await db.commit()
        await db.refresh(profile_config)
        if api_config is not profile_config:
            await db.refresh(api_config)
        return _build_api_config_response(profile_config, api_config)
    except IntegrityError:
        logger.warning("Duplicate permanent link slug for organization %s", organization_id)
        await db.rollback()
        raise HTTPException(status_code=409, detail="That public store slug is already in use. Choose another slug.")
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
    organization_id = _merchant_organization_id(current_user)

    if payload.mode not in ("test", "live"):
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'test' or 'live'.")

    stmt = select(MerchantApiConfig).where(
        MerchantApiConfig.organization_id == organization_id,
        MerchantApiConfig.user_id == _merchant_user_id(current_user),
    ).order_by(MerchantApiConfig.id.asc()).limit(1)
    result = await db.execute(stmt)
    config = result.scalars().first()

    if not config:
        config = MerchantApiConfig(organization_id=organization_id, user_id=_merchant_user_id(current_user))
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

    stmt = (
        select(MerchantApiConfig)
        .where(MerchantApiConfig.organization_id == org_id)
        .order_by(MerchantApiConfig.id.asc())
        .limit(1)
    )
    result = await db.execute(stmt)
    config = result.scalars().first()

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

    stmt = (
        select(MerchantApiConfig)
        .where(MerchantApiConfig.organization_id == org_id)
        .order_by(MerchantApiConfig.id.asc())
        .limit(1)
    )
    result = await db.execute(stmt)
    config = result.scalars().first()

    if not config:
        return {"success": True}

    if payload.mode not in ("test", "live"):
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'test' or 'live'.")

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
    _require_store_profile_edit_access(current_user)
    organization_id = _merchant_organization_id(current_user)
    profile_config = await _get_or_create_shared_store_profile(
        db,
        organization_id,
        _merchant_user_id(current_user),
        current_user.organization_name,
    )

    # Define upload directory
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", "logos")
    os.makedirs(uploads_dir, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(logo.filename)[1] or ".png"
    filename = f"logo_{organization_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(uploads_dir, filename)

    # Save file
    content = await logo.read()
    with open(file_path, "wb") as f:
        f.write(content)

    logo_url = f"/uploads/logos/{filename}"

    profile_config.store_logo_url = logo_url
    await db.commit()

    return {"success": True, "logo_url": logo_url}
