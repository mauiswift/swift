import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.zip_service import ZipService
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/zip", tags=["zip-payments"])


class CreateZipCheckoutRequest(BaseModel):
    amount: float
    description: str = ""
    external_id: str = ""
    customer_email: Optional[str] = None
    payment_method_types: List[str] = Field(default_factory=lambda: ["card", "gcash", "paymaya"])


@router.post("/create-checkout")
async def create_checkout(
    data: CreateZipCheckoutRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create a Zip checkout session and record the transaction."""
    service = ZipService()
    if not service.api_key:
        raise HTTPException(status_code=400, detail="ZIP_API_KEY is not configured")

    external_id = data.external_id or f"zip-{uuid.uuid4().hex[:12]}"

    try:
        res = await service.create_checkout(
            amount=data.amount,
            description=data.description,
            external_id=external_id,
            customer_email=data.customer_email,
            payment_method_types=data.payment_method_types
        )
    except Exception as exc:
        logger.exception("Zip checkout creation failed")
        raise HTTPException(status_code=500, detail=f"Zip integration error: {str(exc)}")

    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to create Zip checkout"))

    # Record transaction in local database
    txn_svc = TransactionsService(db)
    txn_id = None
    try:
        txn = await txn_svc.create_transaction(
            user_id=str(current_user.id),
            transaction_type="zip_checkout",
            amount=data.amount,
            external_id=external_id,
            gateway_id=res.get("checkout_id", ""),
            description=data.description or "Zip payment",
            customer_email=data.customer_email or "",
            payment_url=res.get("checkout_url", ""),
        )
        txn_id = txn.id
    except Exception as exc:
        logger.error("Failed to record transaction for Zip: %s", exc, exc_info=True)

    return {
        "success": True,
        "data": {
            "transaction_id": txn_id,
            "checkout_id": res.get("checkout_id"),
            "checkout_url": res.get("checkout_url"),
            "external_id": external_id,
            "raw": res.get("raw")
        }
    }


@router.get("/status/{session_id}")
async def get_status(
    session_id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """Retrieve the status of a Zip checkout session."""
    service = ZipService()
    res = await service.get_session(session_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to retrieve Zip session"))
    return res


@router.get("/success")
async def zip_success(session_id: str = Query(...)):
    """Callback for successful Zip payment."""
    # In a production app, we would verify the session status here and update our database.
    # For now, we return a success JSON.
    return {
        "success": True,
        "message": "Payment received and being processed",
        "session_id": session_id
    }


@router.get("/cancel")
async def zip_cancel(session_id: Optional[str] = Query(None)):
    """Callback for cancelled Zip payment."""
    return {
        "success": False,
        "message": "Payment was cancelled by the user",
        "session_id": session_id
    }


@router.get("/config")
async def get_config(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    """Check Zip configuration."""
    service = ZipService()
    return {
        "success": True,
        "configured": bool(service.api_key),
        "base_url": service.base_url
    }
