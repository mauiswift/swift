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
from services.exchange_rate_service import fetch_live_usdt_php_rate, get_cache_status as _get_exchange_rate_cache_status, get_rate
from services.app_settings import (
    _get_setting,
    _set_setting,
    get_usdt_php_rate,
    get_usdt_trc20_address,
    get_maintenance_mode,
    get_maintenance_details,
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
    get_system_collection_fee_percent,
    set_system_collection_fee_percent,
    get_vip_gold_collection_fee_percent,
    set_vip_gold_collection_fee_percent,
    get_conversion_fee_percent,
    set_conversion_fee_percent,
    get_withdrawal_fees,
    set_withdrawal_fees,
    get_deposit_rules,
    set_deposit_rules,
    get_deposit_accounts,
    set_deposit_accounts,
    is_toss_bank_account,
    get_usdt_php_rate_details,
    get_wallet_limits,
    set_wallet_limits,
    get_checkout_design,
    set_checkout_design,
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
    maintenance_region: str = "all"
    maintenance_started_at: Optional[str] = None
    maintenance_ends_at: Optional[str] = None


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
    vip_gold_fee_percent: float


class CollectionFeeUpdateRequest(BaseModel):
    system_fee_percent: Optional[float] = None
    additional_fee_percent: Optional[float] = None
    vip_gold_fee_percent: Optional[float] = None


class UserServiceFeeUpdateRequest(BaseModel):
    service_fee_percent: float


class UserServiceFeeResponse(BaseModel):
    user_id: str
    service_fee_percent: float


class MyCollectionCommissionResponse(BaseModel):
    base_fee_percent: float
    additional_fee_percent: float
    total_fee_percent: float


class MyCollectionCommissionUpdateRequest(BaseModel):
    additional_fee_percent: float


class ConversionFeeResponse(BaseModel):
    fee_percent: float


class ConversionFeeUpdateRequest(BaseModel):
    fee_percent: float


class WithdrawalFeesUpdateRequest(BaseModel):
    fees: dict[str, float]


class DepositRulesUpdateRequest(BaseModel):
    rules: dict


class DepositAccountsUpdateRequest(BaseModel):
    accounts: list[dict]


class WalletLimitsUpdateRequest(BaseModel):
    limits: dict[str, dict[str, float]]


class CheckoutDesignUpdateRequest(BaseModel):
    design: dict


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
    return MaintenanceStatusResponse(**(await get_maintenance_details(db)))


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
    return MaintenanceStatusResponse(**(await get_maintenance_details(db)))


@router.get("/usdt-php-rate", response_model=UsdtPhpRateResponse)
async def get_usdt_php_rate_endpoint(db: AsyncSession = Depends(get_db)):
    """Return the current USDT→PHP exchange rate used for topup conversion. Publicly accessible."""
    details = await get_usdt_php_rate_details(db)
    return UsdtPhpRateResponse(rate=float(details["rate"]), source=str(details["source"]))


@router.get("/public-exchange-rates")
async def get_public_exchange_rates():
    """Return the cached live market rates shown on the public homepage."""
    usdt_rates = {
        currency: await get_rate(f"USDT_{currency}")
        for currency in ("PHP", "USD", "EUR", "KRW", "CNY")
    }
    usdt_php = usdt_rates["PHP"]
    rates = {
        "PHP": 1.0,
        "USDT": usdt_php,
        "USD": usdt_php / usdt_rates["USD"],
        "EUR": usdt_php / usdt_rates["EUR"],
        "KRW": usdt_php / usdt_rates["KRW"],
        "CNY": usdt_php / usdt_rates["CNY"],
    }
    return {
        "success": True,
        "base_currency": "PHP",
        "rates": rates,
        "source": "CoinGecko",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


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
    return UserServiceFeeResponse(user_id=user.telegram_id, service_fee_percent=float(user.service_fee_percent or 0.0))


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


@router.get("/wallet-limits")
async def get_wallet_limits_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    return {"limits": await get_wallet_limits(db)}


@router.put("/wallet-limits")
async def set_wallet_limits_endpoint(
    body: WalletLimitsUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    try:
        limits = await set_wallet_limits(db, body.limits)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    logger.info("Wallet limits updated by super admin %s", current_user.id)
    return {"limits": limits}


@router.get("/checkout-design")
async def get_checkout_design_endpoint(db: AsyncSession = Depends(get_db)):
    return {"design": await get_checkout_design(db)}


@router.put("/checkout-design")
async def set_checkout_design_endpoint(
    body: CheckoutDesignUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    try:
        design = await set_checkout_design(db, body.design)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"design": design}


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


@router.post("/payment-channels/reset")
async def reset_payment_channels_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset payment channels to defaults. Super admin only."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    from core.constants import DEFAULT_PAYMENT_CHANNELS
    try:
        channels = await set_payment_channels(db, DEFAULT_PAYMENT_CHANNELS)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    logger.info("Payment channels reset to defaults by user %s", current_user.id)
    return {"channels": channels, "message": "Payment channels reset to defaults"}


@router.get("/collection-fee", response_model=CollectionFeeResponse)
async def get_collection_fee_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return collection fee configuration to dashboard owners."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required.")
    system_fee = (await get_system_collection_fee_percent(db)) * 100
    additional_fee = await get_additional_collection_fee_percent(db)
    vip_fee = await get_vip_gold_collection_fee_percent(db)
    return CollectionFeeResponse(
        system_fee_percent=system_fee,
        additional_fee_percent=additional_fee,
        total_fee_percent=system_fee + additional_fee,
        vip_gold_fee_percent=vip_fee,
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
    if body.system_fee_percent is None:
        raise HTTPException(status_code=400, detail="system_fee_percent is required")
    try:
        system_fee = await set_system_collection_fee_percent(db, body.system_fee_percent)
        if body.additional_fee_percent is not None:
            await set_additional_collection_fee_percent(db, body.additional_fee_percent)
        if body.vip_gold_fee_percent is not None:
            await set_vip_gold_collection_fee_percent(db, body.vip_gold_fee_percent)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    logger.info("System collection commission set to %.2f%% by user %s", system_fee, current_user.id)
    return CollectionFeeResponse(
        system_fee_percent=system_fee,
        additional_fee_percent=await get_additional_collection_fee_percent(db),
        total_fee_percent=system_fee + await get_additional_collection_fee_percent(db),
        vip_gold_fee_percent=await get_vip_gold_collection_fee_percent(db),
    )


@router.get("/my-collection-commission", response_model=MyCollectionCommissionResponse)
async def get_my_collection_commission(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions:
        raise HTTPException(status_code=403, detail="Admin access required.")
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")
    if not admin.is_super_admin and admin.role != "admin":
        raise HTTPException(status_code=403, detail="Only super admins and admins can set commission.")
    base = (await get_system_collection_fee_percent(db)) * 100
    additional = float(admin.service_fee_percent or 0)
    return MyCollectionCommissionResponse(
        base_fee_percent=base,
        additional_fee_percent=additional,
        total_fee_percent=base + additional,
    )


@router.put("/my-collection-commission", response_model=MyCollectionCommissionResponse)
async def set_my_collection_commission(
    body: MyCollectionCommissionUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions:
        raise HTTPException(status_code=403, detail="Admin access required.")
    if not 0 <= body.additional_fee_percent <= 100:
        raise HTTPException(status_code=400, detail="Additional commission must be between 0 and 100 percent")
    admin = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)))
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")
    if not admin.is_super_admin and admin.role != "admin":
        raise HTTPException(status_code=403, detail="Only super admins and admins can set commission.")
    admin.service_fee_percent = body.additional_fee_percent
    await db.commit()
    base = (await get_system_collection_fee_percent(db)) * 100
    return MyCollectionCommissionResponse(
        base_fee_percent=base,
        additional_fee_percent=body.additional_fee_percent,
        total_fee_percent=base + body.additional_fee_percent,
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


@router.get("/withdrawal-fees")
async def get_withdrawal_fees_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    return {"fees": await get_withdrawal_fees(db)}


@router.put("/withdrawal-fees")
async def set_withdrawal_fees_endpoint(
    body: WithdrawalFeesUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    try:
        fees = await set_withdrawal_fees(db, body.fees)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"fees": fees}


@router.get("/deposit-rules")
async def get_deposit_rules_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    return {"rules": await get_deposit_rules(db)}


@router.put("/deposit-rules")
async def set_deposit_rules_endpoint(
    body: DepositRulesUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    try:
        rules = await set_deposit_rules(db, body.rules)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"rules": rules}


@router.get("/deposit-accounts")
async def get_deposit_accounts_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"accounts": await get_deposit_accounts(db)}


@router.get("/toss-bank-accounts")
async def get_toss_bank_accounts_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    accounts = [
        account for account in await get_deposit_accounts(db)
        if str(account.get("currency", "")).strip().upper() == "KRW"
        and is_toss_bank_account(account)
    ]
    return {"accounts": accounts}


@router.put("/toss-bank-accounts")
async def set_toss_bank_accounts_endpoint(
    body: DepositAccountsUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    if not body.accounts:
        raise HTTPException(status_code=400, detail="At least one Toss Bank account is required.")
    if any(
        str(account.get("currency", "")).strip().upper() != "KRW"
        or not is_toss_bank_account(account)
        for account in body.accounts
    ):
        raise HTTPException(status_code=400, detail="Only KRW Toss Bank accounts may be configured here.")
    try:
        existing = await get_deposit_accounts(db)
        non_toss = [
            account for account in existing
            if not (
                str(account.get("currency", "")).strip().upper() == "KRW"
                and is_toss_bank_account(account)
            )
        ]
        accounts = await set_deposit_accounts(db, non_toss + body.accounts)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "accounts": [
            account
            for account in accounts
            if str(account.get("currency", "")).upper() == "KRW" and is_toss_bank_account(account)
        ]
    }


@router.put("/deposit-accounts")
async def set_deposit_accounts_endpoint(
    body: DepositAccountsUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")
    try:
        accounts = await set_deposit_accounts(db, body.accounts)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"accounts": accounts}


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
