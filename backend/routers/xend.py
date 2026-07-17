import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor
from services.swiftpay_service import SwiftPayService
from core.config import settings
from services.transactions import TransactionsService

from services.payment_gateway import gateway as payment_gateway

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/xend", tags=["xend"])


class CreatePaymentRequest(BaseModel):
    amount: float
    description: str = ""
    descriptor: str = ""
    merchant_name: str = ""
    customer_name: str = ""
    customer_email: str = ""
    external_id: str = ""
    payment_methods: List[str] = Field(default_factory=list)


class PayQRPhRequest(BaseModel):
    qr_data: str
    amount: float
    description: str = ""
    merchant_name: str = ""
    reference_number: str = ""


SUPPORTED_PAYMENT_METHODS = ["card", "gcash", "bank_transfer", "qrph", "cash", "wallet"]


@router.get("/payment-methods")
async def get_supported_payment_methods():
    return {
        "success": True,
        "source": "internal",
        "payment_methods": SUPPORTED_PAYMENT_METHODS,
    }


@router.get("/ping")
async def ping_magpie(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
):
    return {
        "success": True,
        "configured": True,
        "source": "internal",
        "message": "Payment processing is running with the internal processor.",
    }


@router.get("/transaction-stats")
async def get_transaction_stats(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    return await processor.get_stats(user_id=str(current_user.id))


async def _process_xend_request(
    db: AsyncSession,
    current_user: UserResponse,
    request: CreatePaymentRequest,
    transaction_type: str,
):
    return await payment_gateway.create_payment(
        db,
        user_id=str(current_user.id),
        amount=request.amount,
        description=request.description or f"{transaction_type} payment",
        transaction_type=transaction_type,
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        external_id=request.external_id,
        payment_methods=request.payment_methods,
    )

    processor = PaymentProcessor(db)
    result = await processor.create_payment(
        user_id=str(current_user.id),
        amount=request.amount,
        description=request.description or f"{transaction_type} payment",
        currency="PHP",
        metadata={
            "transaction_type": transaction_type,
            "merchant_name": request.merchant_name,
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "external_id": request.external_id,
            "payment_methods": request.payment_methods,
        },
    )
    return {
        "success": True,
        "message": f"{transaction_type} created",
        "data": {
            "transaction_id": result["transaction_id"],
            "payment_id": result["payment_id"],
            "amount": result["amount"],
            "currency": result["currency"],
            "status": result["status"],
            "source": "internal",
            "gateway": "internal",
        },
    }


@router.post("/create-invoice")
async def create_invoice(
    data: CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await _process_xend_request(db=db, current_user=current_user, request=data, transaction_type="invoice")


@router.post("/create-payment-link")
async def create_payment_link(
    data: CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await _process_xend_request(db=db, current_user=current_user, request=data, transaction_type="payment_link")


@router.post("/create-qr-code")
async def create_qr_code(
    data: CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await _process_xend_request(db=db, current_user=current_user, request=data, transaction_type="qr_code")


@router.post("/pay-qrph")
async def pay_qrph(
    data: PayQRPhRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    request = CreatePaymentRequest(
        amount=data.amount,
        description=data.description or data.merchant_name or "QRPH payment",
        merchant_name=data.merchant_name,
        external_id=data.reference_number,
        payment_methods=["qrph"],
    )
    return await _process_xend_request(db=db, current_user=current_user, request=request, transaction_type="qrph_payment")
