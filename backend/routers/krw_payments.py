"""
KRW Payment Links and Disbursements Router

Endpoints for creating and managing KRW payment links and disbursements
via the SwiftPay API. Uses HTTP Basic Authentication as per SwiftPay spec.

Endpoints:
- POST /api/v1/krw/payment-links - Create KRW payment link
- POST /api/v1/krw/disbursements - Create KRW disbursement
- GET /api/v1/krw/disbursements/{id} - Get disbursement status
- GET /api/v1/krw/banks - List supported Korean banks
"""

import base64
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import settings
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.krw_payment_service import (
    KRWPaymentService,
    KRWPaymentLinkRequest,
    KRWPaymentLinkResponse,
    KRWDisbursementRequest,
    KRWDisbursementResponse,
    KOREAN_BANKS,
)
from models.disbursements import Disbursements
from sqlalchemy import select

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/krw", tags=["krw-payments"])


def verify_basic_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify HTTP Basic Authentication.
    
    SwiftPay API requires Basic Auth with access key and secret key.
    Falls back to Telegram user auth if not provided.
    """
    if authorization and authorization.startswith("Basic "):
        try:
            credentials = base64.b64decode(authorization[6:]).decode()
            access_key, secret_key = credentials.split(":", 1)
            
            # Verify credentials match SwiftPay config
            if (access_key == settings.swiftpay_access_key and 
                secret_key == settings.swiftpay_secret_key):
                return "authenticated"
        except Exception as e:
            logger.warning(f"Basic auth verification failed: {e}")
    
    raise HTTPException(
        status_code=401,
        detail="Invalid or missing HTTP Basic Authentication",
    )


@router.post("/payment-links", response_model=KRWPaymentLinkResponse)
async def create_krw_payment_link(
    request: KRWPaymentLinkRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a KRW payment link via SwiftPay API.
    
    Request body:
    ```json
    {
        "amount": 50000,
        "reference_no": "order-123",
        "description": "Payment for services",
        "customer_name": "Kim Park",
        "customer_email": "kim@example.com",
        "customer_phone": "+82-10-1234-5678",
        "payment_methods": ["bank_transfer", "card"],
        "expiry_days": 7,
        "redirect_url": "https://example.com/success",
        "webhook_url": "https://example.com/webhook"
    }
    ```
    
    Response:
    ```json
    {
        "success": true,
        "transaction_id": 123,
        "payment_link": "https://pay.live.swiftpay.ph/checkout/abc123",
        "payment_url": "https://pay.live.swiftpay.ph/checkout/abc123",
        "reference_no": "order-123",
        "amount": 50000,
        "currency": "KRW",
        "status": "pending",
        "expires_at": "2026-10-01T17:36:28Z"
    }
    ```
    """
    try:
        service = KRWPaymentService()
        
        # Create payment link
        response = await service.create_payment_link(
            request=request,
            user_id=str(current_user.id),
            db=db,
        )
        
        # Store transaction if successful
        if response.success:
            from services.transactions import TransactionsService
            txn_service = TransactionsService(db)
            
            try:
                txn = await txn_service.create_transaction(
                    user_id=str(current_user.id),
                    transaction_type="payment_link",
                    amount=request.amount,
                    external_id=request.reference_no,
                    gateway_id="swiftpay",
                    description=request.description or "KRW Payment Link",
                    customer_name=request.customer_name or "",
                    customer_email=request.customer_email or "",
                    payment_url=response.payment_url or "",
                    status="pending",
                    currency="KRW",
                    idempotency_key=request.reference_no,
                )
                response.transaction_id = txn.id
            except Exception as e:
                logger.error(f"Error storing transaction: {e}")
        
        return response
    
    except Exception as e:
        logger.exception(f"Error creating KRW payment link: {e}")
        return KRWPaymentLinkResponse(
            success=False,
            error=str(e),
            code="INTERNAL_ERROR",
        )


@router.post("/disbursements", response_model=KRWDisbursementResponse)
async def create_krw_disbursement(
    request: KRWDisbursementRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a KRW disbursement (payout) via SwiftPay API.
    
    Requires sufficient wallet balance in KRW.
    
    Request body:
    ```json
    {
        "amount": 50000,
        "reference_no": "payout-456",
        "description": "Withdrawal to bank account",
        "bank_info": {
            "bank_code": "004",
            "bank_name": "KB Kookmin",
            "account_number": "12345678901",
            "account_name": "Kim Park"
        },
        "priority": "normal"
    }
    ```
    
    Response:
    ```json
    {
        "success": true,
        "disbursement_id": 456,
        "reference_no": "payout-456",
        "amount": 50000,
        "currency": "KRW",
        "status": "processing"
    }
    ```
    
    Status flow: pending → processing → completed (or failed)
    """
    try:
        # Verify user has sufficient balance
        from services.wallets import WalletsService
        wallet_service = WalletsService(db)
        
        wallet = await wallet_service.get_or_create_wallet(str(current_user.id), "KRW")
        if not wallet or float(wallet.balance or 0) < request.amount:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient KRW balance. Required: ₩{request.amount:,.0f}, Available: ₩{float(wallet.balance or 0):,.0f}",
            )
        
        # Create disbursement
        service = KRWPaymentService()
        response = await service.create_disbursement(
            request=request,
            user_id=str(current_user.id),
            db=db,
        )
        
        # Deduct from wallet if successful
        if response.success:
            try:
                from sqlalchemy import update
                from models.wallets import Wallets
                
                stmt = update(Wallets).where(
                    Wallets.user_id == str(current_user.id),
                    Wallets.currency == "KRW",
                ).values(
                    balance=Wallets.balance - request.amount
                )
                await db.execute(stmt)
                await db.commit()
            except Exception as e:
                logger.error(f"Error deducting from wallet: {e}")
                await db.rollback()
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error creating KRW disbursement: {e}")
        return KRWDisbursementResponse(
            success=False,
            error=str(e),
            code="INTERNAL_ERROR",
        )


@router.get("/disbursements/{disbursement_id}")
async def get_krw_disbursement_status(
    disbursement_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the status of a KRW disbursement.
    
    Response:
    ```json
    {
        "success": true,
        "status": "processing",
        "amount": 50000,
        "currency": "KRW",
        "reference_no": "payout-456"
    }
    ```
    """
    try:
        # Get disbursement from database
        stmt = select(Disbursements).where(
            Disbursements.id == disbursement_id,
            Disbursements.user_id == str(current_user.id),
            Disbursements.currency == "KRW",
        )
        result = await db.execute(stmt)
        disbursement = result.scalar_one_or_none()
        
        if not disbursement:
            raise HTTPException(
                status_code=404,
                detail="Disbursement not found",
            )
        
        # Get status from SwiftPay if xendit_id available
        if disbursement.xendit_id:
            service = KRWPaymentService()
            status_response = await service.get_disbursement_status(disbursement.xendit_id)
            
            if status_response.get("success"):
                return {
                    "success": True,
                    "disbursement_id": disbursement.id,
                    "status": status_response.get("status", disbursement.status),
                    "amount": status_response.get("amount", disbursement.amount),
                    "currency": "KRW",
                    "reference_no": disbursement.external_id,
                    "bank_account": disbursement.account_number,
                    "bank_name": disbursement.bank_code,
                }
        
        # Return local status if no xendit_id
        return {
            "success": True,
            "disbursement_id": disbursement.id,
            "status": disbursement.status or "pending",
            "amount": disbursement.amount,
            "currency": "KRW",
            "reference_no": disbursement.external_id,
            "bank_account": disbursement.account_number,
            "bank_name": disbursement.bank_code,
            "created_at": disbursement.created_at.isoformat() if disbursement.created_at else None,
            "updated_at": disbursement.updated_at.isoformat() if disbursement.updated_at else None,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching disbursement status: {e}")
        return {
            "success": False,
            "error": str(e),
        }


@router.get("/banks")
async def list_korean_banks():
    """
    List all supported Korean banks for KRW disbursements.
    
    Response:
    ```json
    {
        "success": true,
        "banks": [
            {
                "code": "004",
                "name": "KB Kookmin",
                "swift": "KKBKKRSE"
            },
            ...
        ]
    }
    ```
    """
    banks = [
        {
            "code": code,
            "name": info["name"],
            "swift": info["swift"],
        }
        for code, info in sorted(KOREAN_BANKS.items())
    ]
    
    return {
        "success": True,
        "banks": banks,
        "total": len(banks),
    }


@router.post("/validate-bank-account")
async def validate_krw_bank_account(
    bank_code: str,
    account_number: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Validate a Korean bank account.
    
    Query parameters:
    - `bank_code`: Korean bank code (e.g., "004" for KB Kookmin)
    - `account_number`: Bank account number
    
    Response:
    ```json
    {
        "valid": true,
        "bank_name": "KB Kookmin",
        "bank_code": "004",
        "swift_code": "KKBKKRSE",
        "account_number": "12345678901"
    }
    ```
    """
    try:
        service = KRWPaymentService()
        result = await service.validate_bank_account(bank_code, account_number)
        return {"success": result.get("valid"), **result}
    except Exception as e:
        logger.exception(f"Error validating bank account: {e}")
        return {
            "success": False,
            "error": str(e),
        }
