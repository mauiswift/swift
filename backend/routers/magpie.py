import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.magpie_services import MagpieService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/magpie", tags=["magpie"])


@router.get("/ping")
async def ping_magpie(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """Check Magpie connectivity and API key validity."""
    service = MagpieService()
    if not service.api_key:
        return {
            "success": False,
            "configured": False,
            "base_url": service.base_url,
            "error": "MAGPIE_API_KEY is not set",
        }

    result = await service.get_balance()
    return {
        "success": result.get("success", False),
        "configured": True,
        "base_url": service.base_url,
        "error": result.get("error") if not result.get("success") else None,
    }


@router.post("/create-checkout-session")
async def create_checkout_session(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    """Create a Magpie checkout session."""
    service = MagpieService()
    result = await service.create_session(**payload)
    return result


@router.post("/create-qr-payment")
async def create_qr_payment(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    """Create a Magpie QR payment."""
    service = MagpieService()
    result = await service.create_qr_payment(**payload)
    return result


@router.post("/create-invoice")
async def create_invoice(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    """Create a Magpie invoice."""
    service = MagpieService()
    result = await service.create_invoice(**payload)
    return result


@router.post("/create-payment-link")
async def create_payment_link(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
):
    """Create a Magpie payment link."""
    service = MagpieService()
    result = await service.create_payment_link(**payload)
    return result


@router.get("/checkout-status/{checkout_id}")
async def get_checkout_status(
    checkout_id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """Get the status of a Magpie checkout."""
    service = MagpieService()
    result = await service.get_checkout_status(checkout_id)
    return result


@router.get("/balance")
async def get_balance(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """Get Magpie account balance."""
    service = MagpieService()
    result = await service.get_balance()
    return result
