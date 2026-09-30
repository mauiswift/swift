"""
KRW Payment Links and Disbursements Router.

KRW payment links use SwiftPay's self-hosted checkout with manual bank-transfer
verification and super-admin approval. Disbursement payouts go through the
wallet withdrawal approval flow.

Endpoints:
- POST /api/v1/krw/payment-links - Create KRW payment link
- POST /api/v1/krw/disbursements - Create KRW disbursement
- GET /api/v1/krw/disbursements/{id} - Get disbursement status
- GET /api/v1/krw/banks - List supported Korean banks
"""

import base64
import logging
from typing import Optional

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
from services.wallets import WalletsService
from services.admin_notification_service import AdminNotificationService

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
    Create a SwiftPay-hosted KRW payment link for manual bank-transfer verification.
    
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
        "payment_link": "https://kr.swiftpay.site/checkout/order-123",
        "payment_url": "https://kr.swiftpay.site/checkout/order-123",
        "reference_no": "order-123",
        "amount": 50000,
        "currency": "KRW",
        "status": "pending",
        "gateway": "swiftpay_self_hosted",
        "manual_verification": true,
        "approval_required": true,
        "expires_at": "2026-10-01T17:36:28Z"
    }
    ```
    """
    try:
        return await KRWPaymentService().create_self_hosted_payment_link(
            request,
            user_id=str(current_user.id),
            db=db,
        )
    
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
        result = await WalletsService(db).withdraw_request(
            user_id=str(current_user.id),
            amount=request.amount,
            bank_name=request.bank_info.bank_name,
            bank_code=request.bank_info.bank_code,
            account_number=request.bank_info.account_number,
            account_name=request.bank_info.account_name,
            note=request.description or "KRW bank withdrawal",
            currency="KRW",
            external_reference=request.reference_no,
        )
        disbursement = await db.scalar(
            select(Disbursements).where(
                Disbursements.external_id == result["reference_id"]
            )
        )
        if not disbursement:
            raise HTTPException(status_code=500, detail="Withdrawal request was not saved")

        await AdminNotificationService.notify_super_admins(
            db=db,
            notification_type="withdrawal_request",
            title="New KRW withdrawal request",
            message=(
                f"A KRW withdrawal request for {request.amount:,.2f} "
                f"was submitted by {request.bank_info.account_name}."
            ),
            user_id=str(current_user.id),
            user_name=request.bank_info.account_name,
            resource_type="disbursement",
            resource_id=str(disbursement.id),
            priority="high",
            action_url="/withdrawals",
        )
        return KRWDisbursementResponse(
            success=True,
            disbursement_id=disbursement.id,
            reference_no=disbursement.external_id,
            amount=float(disbursement.amount),
            currency="KRW",
            status=disbursement.status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
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
