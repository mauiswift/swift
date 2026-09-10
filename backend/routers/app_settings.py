import logging
from datetime import datetime, timezone
from typing import Optional

from core.database import get_db
from dependencies.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.app_settings import AppSettings
from models.admin_users import AdminUser
from pydantic import BaseModel
from schemas.auth import UserResponse
from services.exchange_rate_service import fetch_live_usdt_php_rate, get_cache_status as _get_exchange_rate_cache_status
from services.app_settings import (
    _get_setting,
    _set_setting,
    get_usdt_php_rate,
    get_usdt_trc20_address,
    ensure_maintenance_off,
    get_maintenance_mode,
    set_maintenance_mode,
    get_enabled_collection_currencies,
    set_enabled_collection_currencies,
    get_krw_bank_name,
    set_krw_bank_name,
    get_krw_account_holder_name,
    set_krw_account_holder_name,
    get_payment_channels,
    set_payment_channels,
    get_additional_collection_fee_percent,
    set_additional_collection_fee_percent,
    get_conversion_fee_percent,
    set_conversion_fee_percent,
    get_usdt_php_rate_details,
)
from core.constants import (
    MAINTENANCE_MODE_KEY,
    USDT_PHP_RATE_KEY,
    DEFAULT_USDT_PHP_RATE,
    USDT_TRC20_ADDRESS_KEY,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/app-settings", tags=["app-settings"])

class MaintenanceStatusResponse(BaseModel):
    maintenance_mode: bool


class MaintenanceUpdateRequest(BaseModel):
    enabled: bool


class UsdtPhpRateResponse(BaseModel):
    rate: float
    source: str = ""


class LiveUsdtPhpRateResponse(BaseModel):
    rate: float
    source: str
    cached: bool


class UsdtPhpRateUpdateRequest(BaseModel):
    rate: float


class UsdtTrc20AddressResponse(BaseModel):
    address: str


class UsdtTrc20AddressUpdateRequest(BaseModel):
    address: str


class CollectionCurrenciesResponse(BaseModel):
    currencies: list[str]


class CollectionCurrenciesUpdateRequest(BaseModel):
    currencies: list[str]


class PaymentChannelsUpdateRequest(BaseModel):
    channels: dict[str, dict[str, list[str]]]


class CollectionFeeResponse(BaseModel):
    system_fee_percent: float
    additional_fee_percent: float
    total_fee_percent: float


class CollectionFeeUpdateRequest(BaseModel):
    additional_fee_percent: float


class UserServiceFeeUpdateRequest(BaseModel):
    service_fee_percent: float


class UserServiceFeeResponse(BaseModel):
    user_id: str
    service_fee_percent: float


class ConversionFeeResponse(BaseModel):
    fee_percent: float


class ConversionFeeUpdateRequest(BaseModel):
    fee_percent: float


class KrwBankNameResponse(BaseModel):
    bank_name: str


class KrwBankNameUpdateRequest(BaseModel):
    bank_name: str


class KrwAccountHolderNameResponse(BaseModel):
    holder_name: str


class KrwAccountHolderNameUpdateRequest(BaseModel):
    holder_name: str


@router.get("/maintenance", response_model=MaintenanceStatusResponse)
async def get_maintenance_mode_endpoint(db: AsyncSession = Depends(get_db)):
    """Get the current maintenance mode status. Publicly accessible."""
    enabled = await get_maintenance_mode(db)
    return MaintenanceStatusResponse(maintenance_mode=enabled)


@router.put("/maintenance", response_model=MaintenanceStatusResponse)
async def set_maintenance_mode_endpoint(
    body: MaintenanceUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enable or disable maintenance mode. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    enabled = await set_maintenance_mode(db, body.enabled)
    logger.info("Maintenance mode set to %s by user %s", "enabled" if enabled else "disabled", current_user.id)
    return MaintenanceStatusResponse(maintenance_mode=enabled)


@router.get("/usdt-php-rate", response_model=UsdtPhpRateResponse)
async def get_usdt_php_rate_endpoint(db: AsyncSession = Depends(get_db)):
    """Return the current USDT→PHP exchange rate used for topup conversion. Publicly accessible."""
    details = await get_usdt_php_rate_details(db)
    return UsdtPhpRateResponse(rate=float(details["rate"]), source=str(details["source"]))


@router.get("/users/{user_id}/service-fee", response_model=UserServiceFeeResponse)
async def get_user_service_fee(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserServiceFeeResponse(user_id=user.telegram_id, service_fee_percent=float(user.service_fee_percent or 0.4))


@router.put("/users/{user_id}/service-fee", response_model=UserServiceFeeResponse)
async def set_user_service_fee(
    user_id: str,
    body: UserServiceFeeUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    if not 0 <= body.service_fee_percent <= 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service fee must be between 0 and 100 percent")
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.service_fee_percent = body.service_fee_percent
    await db.commit()
    return UserServiceFeeResponse(user_id=user.telegram_id, service_fee_percent=float(user.service_fee_percent))


@router.get("/usdt-php-rate/live", response_model=LiveUsdtPhpRateResponse)
async def get_live_usdt_php_rate():
    """Fetch the real-time USDT→PHP exchange rate from CoinGecko. Publicly accessible.

    Results are cached for 5 minutes to stay within free-tier API limits.
    """
    try:
        rate = await fetch_live_usdt_php_rate()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    _, is_cached = _get_exchange_rate_cache_status()

    return LiveUsdtPhpRateResponse(
        rate=rate,
        source="CoinGecko",
        cached=is_cached,
    )


@router.put("/usdt-php-rate", response_model=UsdtPhpRateResponse)
async def set_usdt_php_rate(
    body: UsdtPhpRateUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the USDT→PHP exchange rate used for wallet top-up conversions. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    if body.rate <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rate must be greater than zero.")
    await _set_setting(db, USDT_PHP_RATE_KEY, str(body.rate))
    logger.info("USDT→PHP rate updated to %s by user %s", body.rate, current_user.id)
    return UsdtPhpRateResponse(rate=body.rate)


@router.get("/usdt-trc20-address", response_model=UsdtTrc20AddressResponse)
async def get_usdt_trc20_address_endpoint(db: AsyncSession = Depends(get_db)):
    """Return the configured USDT TRC20 deposit wallet address. Publicly accessible."""
    address = await get_usdt_trc20_address(db)
    return UsdtTrc20AddressResponse(address=address)


@router.put("/usdt-trc20-address", response_model=UsdtTrc20AddressResponse)
async def set_usdt_trc20_address_endpoint(
    body: UsdtTrc20AddressUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the USDT TRC20 deposit wallet address. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    address = body.address.strip()
    if not address:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Address must not be empty.")
    if not (address.startswith("T") and len(address) == 34):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid TRC20 address. Must start with 'T' and be exactly 34 characters.",
        )
    await _set_setting(db, USDT_TRC20_ADDRESS_KEY, address)
    logger.info("USDT TRC20 address updated to %s by user %s", address, current_user.id)
    return UsdtTrc20AddressResponse(address=address)


@router.get("/collection-currencies", response_model=CollectionCurrenciesResponse)
async def get_collection_currencies(db: AsyncSession = Depends(get_db)):
    """Return currencies available to merchant collection selectors."""
    return CollectionCurrenciesResponse(currencies=await get_enabled_collection_currencies(db))


@router.put("/collection-currencies", response_model=CollectionCurrenciesResponse)
async def set_collection_currencies(
    body: CollectionCurrenciesUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set currencies available to merchants. Main admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    try:
        currencies = await set_enabled_collection_currencies(db, body.currencies)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    logger.info("Collection currencies updated to %s by user %s", currencies, current_user.id)
    return CollectionCurrenciesResponse(currencies=currencies)


@router.get("/payment-channels")
async def get_payment_channels_endpoint(db: AsyncSession = Depends(get_db)):
    """Return enabled payment channels for each currency and flow."""
    return {"channels": await get_payment_channels(db)}


@router.put("/payment-channels")
async def set_payment_channels_endpoint(
    body: PaymentChannelsUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update payment channels. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    try:
        channels = await set_payment_channels(db, body.channels)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    logger.info("Payment channels updated by user %s", current_user.id)
    return {"channels": channels}


@router.get("/collection-fee", response_model=CollectionFeeResponse)
async def get_collection_fee_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return collection fee configuration to dashboard owners."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required.")
    additional = 0.0
    return CollectionFeeResponse(
        system_fee_percent=0.4,
        additional_fee_percent=additional,
        total_fee_percent=0.4,
    )


@router.put("/collection-fee", response_model=CollectionFeeResponse)
async def set_collection_fee_endpoint(
    body: CollectionFeeUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set the owner-configured collection fee surcharge."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required.")
    try:
        await set_additional_collection_fee_percent(db, 0.0)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    logger.info("Incoming collection fee remains fixed at 0.4%%; surcharge ignored for user %s", current_user.id)
    return CollectionFeeResponse(
        system_fee_percent=0.4,
        additional_fee_percent=0.0,
        total_fee_percent=0.4,
    )


@router.get("/conversion-fee", response_model=ConversionFeeResponse)
async def get_conversion_fee_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    return ConversionFeeResponse(fee_percent=await get_conversion_fee_percent(db))


@router.put("/conversion-fee", response_model=ConversionFeeResponse)
async def set_conversion_fee_endpoint(
    body: ConversionFeeUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    try:
        fee_percent = await set_conversion_fee_percent(db, body.fee_percent)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ConversionFeeResponse(fee_percent=fee_percent)


@router.get("/krw-bank-name", response_model=KrwBankNameResponse)
async def get_krw_bank_name_endpoint(db: AsyncSession = Depends(get_db)):
    """Get the configured KRW bank name for virtual account deposits. Publicly accessible."""
    bank_name = await get_krw_bank_name(db)
    return KrwBankNameResponse(bank_name=bank_name)


@router.put("/krw-bank-name", response_model=KrwBankNameResponse)
async def set_krw_bank_name_endpoint(
    body: KrwBankNameUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the KRW bank name. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    bank_name = await set_krw_bank_name(db, body.bank_name)
    logger.info("KRW bank name updated to %s by user %s", bank_name, current_user.id)
    return KrwBankNameResponse(bank_name=bank_name)


@router.get("/krw-account-holder-name", response_model=KrwAccountHolderNameResponse)
async def get_krw_account_holder_name_endpoint(db: AsyncSession = Depends(get_db)):
    """Get the configured KRW account holder name for bank transfers. Publicly accessible."""
    holder_name = await get_krw_account_holder_name(db)
    return KrwAccountHolderNameResponse(holder_name=holder_name)


@router.put("/krw-account-holder-name", response_model=KrwAccountHolderNameResponse)
async def set_krw_account_holder_name_endpoint(
    body: KrwAccountHolderNameUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the KRW account holder name. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    holder_name = await set_krw_account_holder_name(db, body.holder_name)
    logger.info("KRW account holder name updated to %s by user %s", holder_name, current_user.id)
    return KrwAccountHolderNameResponse(holder_name=holder_name)
