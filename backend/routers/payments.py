import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


class CreatePaymentPayload(BaseModel):
    amount: float
    description: str = ""
    currency: str = "PHP"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UpdatePaymentStatusPayload(BaseModel):
    status: str = "pending"
    provider_reference: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/create")
async def create_payment(
    payload: CreatePaymentPayload,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    try:
        processor = PaymentProcessor(db)
        return await processor.create_payment(
            user_id=str(current_user.id),
            amount=payload.amount,
            description=payload.description,
            currency=payload.currency,
            metadata=payload.metadata,
        )
    except ValueError as exc:
        logger.warning("Rejected payment creation: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to create payment")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.get_payment(payment_id=payment_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{payment_id}/status")
async def update_payment_status(
    payment_id: str,
    payload: UpdatePaymentStatusPayload,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.update_payment_status(
            payment_id=payment_id,
            status=payload.status,
            provider_reference=payload.provider_reference or None,
            metadata=payload.metadata,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/checkout/{identifier}")
async def get_checkout_payment(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment details for checkout page (unauthenticated public endpoint).
    
    Allows clients to retrieve payment information by payment ID or external reference.
    Used by the checkout page to display payment details before processing.
    """
    processor = PaymentProcessor(db)
    try:
        payment = await processor.get_payment(payment_id=identifier)
        logger.info(f"Checkout payment retrieved: {identifier}")
        return payment
    except LookupError as exc:
        logger.warning(f"Checkout payment not found: {identifier}")
        raise HTTPException(status_code=404, detail="Payment not found") from exc
    except Exception as exc:
        logger.error(f"Error retrieving checkout payment {identifier}: {exc}")
        raise HTTPException(status_code=500, detail="Error retrieving payment") from exc


@router.get("/checkout/{identifier}/status")
async def get_checkout_status(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment status for polling (unauthenticated public endpoint).
    
    Returns minimal payment status information for real-time updates on the checkout page.
    """
    processor = PaymentProcessor(db)
    try:
        payment = await processor.get_payment(payment_id=identifier)
        return {
            "status": payment.get("status", "pending"),
            "amount": payment.get("amount"),
            "currency": payment.get("currency", "PHP"),
            "payment_url": payment.get("payment_url"),
        }
    except LookupError as exc:
        logger.warning(f"Checkout status not found: {identifier}")
        raise HTTPException(status_code=404, detail="Payment not found") from exc
    except Exception as exc:
        logger.error(f"Error retrieving checkout status {identifier}: {exc}")
        raise HTTPException(status_code=500, detail="Error retrieving payment status") from exc
