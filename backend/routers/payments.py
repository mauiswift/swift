import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor
from models.transactions import Transactions

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
    
    Searches by multiple identifiers:
    - external_id (payment reference from xend)
    - xendit_id (gateway payment ID)
    - transaction ID (numeric)
    """
    try:
        # Try to match by external_id, xendit_id, or transaction ID
        conditions = [
            Transactions.external_id == identifier,
            Transactions.xendit_id == identifier,
        ]
        
        # Also try numeric ID
        try:
            txn_id = int(identifier)
            conditions.append(Transactions.id == txn_id)
        except ValueError:
            pass
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout payment not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        logger.info(f"Checkout payment retrieved: {identifier} -> txn_id={txn.id}")
        return {
            "success": True,
            "transaction_id": txn.id,
            "payment_id": txn.external_id,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "status": txn.status,
            "description": txn.description or "",
            "payment_url": txn.payment_url or "",
            "customer_name": txn.customer_name or "",
            "customer_email": txn.customer_email or "",
            "created_at": txn.created_at.isoformat() if txn.created_at else None,
            "updated_at": txn.updated_at.isoformat() if txn.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout payment {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment") from exc


@router.get("/checkout/{identifier}/status")
async def get_checkout_status(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment status for polling (unauthenticated public endpoint).
    
    Returns minimal payment status information for real-time updates on the checkout page.
    """
    try:
        # Try to match by external_id, xendit_id, or transaction ID
        conditions = [
            Transactions.external_id == identifier,
            Transactions.xendit_id == identifier,
        ]
        
        # Also try numeric ID
        try:
            txn_id = int(identifier)
            conditions.append(Transactions.id == txn_id)
        except ValueError:
            pass
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout status not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return {
            "status": txn.status,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "payment_url": txn.payment_url or "",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout status {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment status") from exc
