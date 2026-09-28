"""
KRW Payment Link and Disbursement Service

Provides KRW-specific payment processing, including:
- Self-hosted KRW payment links with manual approval
- KRW disbursement/payout processing
- Bank account validation for Korean banks
- Currency conversion and fee handling
"""

import asyncio
import base64
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, Optional

import aiohttp
from pydantic import BaseModel, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from models.disbursements import Disbursements
from models.transactions import Transactions
from services.payment_gateway import PaymentGateway

logger = logging.getLogger(__name__)


class KRWBankInfo(BaseModel):
    """Korean bank information for disbursements."""
    bank_code: str = Field(..., description="Bank institution code (e.g., '004' for KB Kookmin)")
    bank_name: str = Field(..., description="Bank name in English")
    account_number: str = Field(..., description="Bank account number (without spaces/dashes)")
    account_name: str = Field(..., description="Account holder name")

    @validator("account_number")
    def validate_account_number(cls, v: str) -> str:
        """Validate Korean bank account format."""
        cleaned = v.replace("-", "").replace(" ", "").strip()
        if not cleaned or not cleaned.isdigit():
            raise ValueError("Account number must contain only digits")
        if len(cleaned) < 10 or len(cleaned) > 20:
            raise ValueError("Account number must be 10-20 digits")
        return cleaned

    @validator("account_name")
    def validate_account_name(cls, v: str) -> str:
        """Validate account holder name."""
        if not v or not v.strip():
            raise ValueError("Account name is required")
        if len(v.strip()) < 2 or len(v.strip()) > 100:
            raise ValueError("Account name must be 2-100 characters")
        return v.strip()


class KRWPaymentLinkRequest(BaseModel):
    """Request model for creating KRW payment links."""
    amount: float = Field(..., gt=0, description="Amount in KRW")
    reference_no: str = Field(..., min_length=1, max_length=255, description="Merchant reference number")
    description: Optional[str] = Field(None, max_length=500, description="Payment description")
    customer_name: Optional[str] = Field(None, description="Customer name")
    customer_email: Optional[str] = Field(None, description="Customer email")
    customer_phone: Optional[str] = Field(None, description="Customer phone number")
    payment_methods: list[str] = Field(
        default=["bank_transfer"],
        description="Payment methods: bank_transfer, virtual_account, card, etc."
    )
    expiry_days: int = Field(default=7, ge=1, le=90, description="Payment link expiry (1-90 days)")
    redirect_url: Optional[str] = Field(None, description="Redirect URL after successful payment")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for payment notifications")

    @validator("amount")
    def validate_amount(cls, v: float) -> float:
        """Validate KRW amount (minimum ₩1,000)."""
        if v < 1000:
            raise ValueError("KRW amount must be at least ₩1,000")
        if v > 100_000_000:  # ~$100k USD equivalent
            raise ValueError("KRW amount exceeds maximum limit (₩100,000,000)")
        return v


class KRWDisbursementRequest(BaseModel):
    """Request model for KRW disbursements."""
    amount: float = Field(..., gt=0, description="Disbursement amount in KRW")
    reference_no: str = Field(..., min_length=1, max_length=255, description="Unique reference number")
    bank_info: KRWBankInfo = Field(..., description="Recipient bank information")
    description: Optional[str] = Field(None, max_length=500, description="Disbursement description")
    priority: str = Field(default="normal", pattern="^(normal|high|urgent)$", description="Processing priority")

    @validator("amount")
    def validate_amount(cls, v: float) -> float:
        """Validate disbursement amount."""
        if v < 1000:
            raise ValueError("Disbursement amount must be at least ₩1,000")
        if v > 100_000_000:
            raise ValueError("Disbursement amount exceeds maximum limit (₩100,000,000)")
        return v


class KRWPaymentLinkResponse(BaseModel):
    """Response for KRW payment link creation."""
    success: bool
    transaction_id: Optional[int] = None
    payment_link: Optional[str] = None
    payment_url: Optional[str] = None
    gateway: Optional[str] = None
    bank_account: Optional[Dict[str, str]] = None
    approval_required: Optional[bool] = None
    manual_verification: Optional[bool] = None
    reference_no: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "KRW"
    status: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None
    code: Optional[str] = None


class KRWDisbursementResponse(BaseModel):
    """Response for KRW disbursement."""
    success: bool
    disbursement_id: Optional[int] = None
    provider_reference: Optional[str] = None
    reference_no: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "KRW"
    status: Optional[str] = None
    error: Optional[str] = None
    code: Optional[str] = None


# Korean bank codes mapping
KOREAN_BANKS = {
    "004": {"name": "KB Kookmin", "swift": "KKBKKRSE"},
    "011": {"name": "NH Nonghyup", "swift": "NHMAKRSE"},
    "020": {"name": "Woori", "swift": "WOORKNSE"},
    "023": {"name": "SC First Bank", "swift": "SCBLKRSE"},
    "027": {"name": "KEB Hana", "swift": "HANAKRSE"},
    "032": {"name": "Busan Bank", "swift": "BNBKKRSE"},
    "034": {"name": "Gwangju Bank", "swift": "GBNKKRSE"},
    "035": {"name": "Jeju Bank", "swift": "IJBKKRSE"},
    "037": {"name": "Jeonbuk Bank", "swift": "JBNKKRSE"},
    "039": {"name": "Jeongbuk Bank", "swift": "EBKKRSE"},
    "040": {"name": "Shinhan", "swift": "SHINKNSE"},
    "050": {"name": "Jeju Bank", "swift": "IJBKKRSE"},
    "071": {"name": "Post Office Bank", "swift": "PBNKKRSE"},
    "081": {"name": "Hanabank", "swift": "HANAKRSE"},
    "088": {"name": "National Bank", "swift": "NBNKKRSE"},
    "089": {"name": "Bank of Korea", "swift": "KOREKRSE"},
    "090": {"name": "Nonghyup Bank", "swift": "NHMAKRSE"},
}


class KRWPaymentService:
    """Service for KRW checkout links and provider-backed disbursements."""

    def __init__(self):
        """Initialize KRW payment service with SwiftPay credentials."""
        self.base_url = settings.swiftpay_base_url or "https://api.pay.live.swiftpay.ph"
        self.access_key = settings.swiftpay_access_key or ""
        self.secret_key = settings.swiftpay_secret_key or ""
        self.is_configured = bool(self.access_key and self.secret_key)

        if not self.is_configured:
            logger.warning("SwiftPay credentials not configured for KRW payments")

    def _get_auth_header(self) -> str:
        """Generate HTTP Basic Authentication header for SwiftPay API."""
        credentials = f"{self.access_key}:{self.secret_key}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    def _format_amount(self, amount: float) -> str:
        """Format amount with exactly 2 decimal places as per SwiftPay spec."""
        return f"{Decimal(str(amount)):.2f}"

    async def create_self_hosted_payment_link(
        self,
        request: KRWPaymentLinkRequest,
        user_id: str,
        db: AsyncSession,
    ) -> KRWPaymentLinkResponse:
        """Create a local KRW checkout that remains pending admin approval."""
        result = await PaymentGateway(db).create_payment(
            db,
            user_id=user_id,
            amount=request.amount,
            description=request.description or "KRW Payment Link",
            transaction_type="payment_link",
            customer_name=request.customer_name or "",
            customer_email=request.customer_email or "",
            external_id=request.reference_no,
            payment_methods=["bank_transfer"],
            metadata={
                "manual_krw_checkout": True,
                "self_hosted_checkout": True,
            },
            currency="KRW",
        )
        if not result.get("success"):
            return KRWPaymentLinkResponse(
                success=False,
                error=result.get("error", "KRW checkout could not be created"),
                code="CHECKOUT_ERROR",
            )

        payment_data = result.get("data") or {}
        payment_url = payment_data.get("checkout_url") or payment_data.get("payment_url")
        transaction_id = payment_data.get("transaction_id")
        if not payment_url or transaction_id is None:
            return KRWPaymentLinkResponse(
                success=False,
                error="KRW checkout could not be initialized",
                code="CHECKOUT_ERROR",
            )

        transaction = await db.get(Transactions, transaction_id)
        if not transaction:
            return KRWPaymentLinkResponse(
                success=False,
                error="KRW checkout transaction could not be loaded",
                code="CHECKOUT_ERROR",
            )

        expires_at = datetime.now(timezone.utc) + timedelta(days=request.expiry_days)
        transaction.expires_at = expires_at
        transaction.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return KRWPaymentLinkResponse(
            success=True,
            transaction_id=transaction_id,
            payment_link=payment_url,
            payment_url=payment_url,
            gateway=payment_data.get("gateway", "swiftpay_self_hosted"),
            bank_account=payment_data.get("bank_account"),
            approval_required=True,
            manual_verification=True,
            reference_no=request.reference_no,
            amount=request.amount,
            currency="KRW",
            status="pending",
            expires_at=expires_at.isoformat(),
        )

    async def create_payment_link(
        self,
        request: KRWPaymentLinkRequest,
        user_id: str,
        db: Optional[AsyncSession] = None,
    ) -> KRWPaymentLinkResponse:
        """
        Create a KRW payment link via SwiftPay API.

        Args:
            request: Payment link request parameters
            user_id: Merchant user ID
            db: Database session for transaction storage

        Returns:
            KRWPaymentLinkResponse with payment link details or error
        """
        if not self.is_configured:
            return KRWPaymentLinkResponse(
                success=False,
                error="SwiftPay API not configured",
                code="UNCONFIGURED",
            )

        try:
            # Prepare payload for SwiftPay API
            payload = {
                "amount": self._format_amount(request.amount),
                "currency": "KRW",
                "reference_no": request.reference_no,
                "description": request.description or "KRW Payment",
                "customer_name": request.customer_name,
                "customer_email": request.customer_email,
                "customer_phone": request.customer_phone,
                "payment_methods": request.payment_methods,
                "expiry_days": request.expiry_days,
                "redirect_url": request.redirect_url,
                "webhook_url": request.webhook_url,
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            # Call SwiftPay API
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": self._get_auth_header(),
                    "Content-Type": "application/json",
                }

                async with session.post(
                    f"{self.base_url}/api/payments/links",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    data = await response.json()

                    if response.status == 201:  # Created
                        return KRWPaymentLinkResponse(
                            success=True,
                            reference_no=request.reference_no,
                            payment_link=data.get("payment_link") or data.get("url"),
                            payment_url=data.get("payment_url") or data.get("url"),
                            amount=request.amount,
                            status="pending",
                            expires_at=data.get("expires_at"),
                        )
                    else:
                        error_msg = data.get("error", {}).get("message", f"HTTP {response.status}")
                        return KRWPaymentLinkResponse(
                            success=False,
                            error=error_msg,
                            code=data.get("error", {}).get("code", "API_ERROR"),
                        )

        except asyncio.TimeoutError:
            logger.error(f"Timeout creating KRW payment link for {user_id}")
            return KRWPaymentLinkResponse(
                success=False,
                error="Request timeout",
                code="TIMEOUT",
            )
        except Exception as e:
            logger.exception(f"Error creating KRW payment link: {e}")
            return KRWPaymentLinkResponse(
                success=False,
                error=str(e),
                code="INTERNAL_ERROR",
            )

    async def create_disbursement(
        self,
        request: KRWDisbursementRequest,
        user_id: str,
        db: Optional[AsyncSession] = None,
    ) -> KRWDisbursementResponse:
        """
        Create a KRW disbursement via SwiftPay API.

        Args:
            request: Disbursement request parameters
            user_id: Merchant user ID
            db: Database session for transaction storage

        Returns:
            KRWDisbursementResponse with disbursement status or error
        """
        if not self.is_configured:
            return KRWDisbursementResponse(
                success=False,
                error="SwiftPay API not configured",
                code="UNCONFIGURED",
            )

        try:
            # Validate bank code
            bank_code = request.bank_info.bank_code
            if bank_code not in KOREAN_BANKS:
                logger.warning(f"Unknown Korean bank code: {bank_code}")

            # Prepare payload for SwiftPay API
            payload = {
                "amount": self._format_amount(request.amount),
                "currency": "KRW",
                "reference_no": request.reference_no,
                "description": request.description or "KRW Disbursement",
                "recipient": {
                    "bank_code": bank_code,
                    "account_number": request.bank_info.account_number,
                    "account_name": request.bank_info.account_name,
                },
                "priority": request.priority,
            }

            # Call SwiftPay API
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": self._get_auth_header(),
                    "Content-Type": "application/json",
                }

                async with session.post(
                    f"{self.base_url}/api/disbursements",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    data = await response.json()

                    if response.status in (200, 201):
                        # Store disbursement in database if session provided
                        if db:
                            try:
                                disbursement = Disbursements(
                                    user_id=user_id,
                                    external_id=request.reference_no,
                                    xendit_id=data.get("id"),
                                    amount=request.amount,
                                    currency="KRW",
                                    bank_code=bank_code,
                                    account_number=request.bank_info.account_number,
                                    account_name=request.bank_info.account_name,
                                    description=request.description,
                                    status=data.get("status", "processing"),
                                    disbursement_type="single",
                                )
                                db.add(disbursement)
                                await db.commit()
                                await db.refresh(disbursement)
                                disbursement_id = disbursement.id
                            except Exception as e:
                                logger.error(f"Error saving disbursement to database: {e}")
                                disbursement_id = None
                        else:
                            disbursement_id = None

                        return KRWDisbursementResponse(
                            success=True,
                            disbursement_id=disbursement_id,
                            provider_reference=str(data["id"]) if data.get("id") is not None else None,
                            reference_no=request.reference_no,
                            amount=request.amount,
                            status=data.get("status", "processing"),
                        )
                    else:
                        error_msg = data.get("error", {}).get("message", f"HTTP {response.status}")
                        return KRWDisbursementResponse(
                            success=False,
                            error=error_msg,
                            code=data.get("error", {}).get("code", "API_ERROR"),
                        )

        except asyncio.TimeoutError:
            logger.error(f"Timeout creating KRW disbursement for {user_id}")
            return KRWDisbursementResponse(
                success=False,
                error="Request timeout",
                code="TIMEOUT",
            )
        except Exception as e:
            logger.exception(f"Error creating KRW disbursement: {e}")
            return KRWDisbursementResponse(
                success=False,
                error=str(e),
                code="INTERNAL_ERROR",
            )

    async def get_disbursement_status(self, disbursement_id: str) -> Dict[str, Any]:
        """
        Get status of a KRW disbursement.

        Args:
            disbursement_id: SwiftPay disbursement ID

        Returns:
            Disbursement status details
        """
        if not self.is_configured:
            return {"success": False, "error": "API not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": self._get_auth_header()}

                async with session.get(
                    f"{self.base_url}/api/disbursements/{disbursement_id}",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    data = await response.json()

                    if response.status == 200:
                        return {
                            "success": True,
                            "status": data.get("status"),
                            "amount": data.get("amount"),
                            "currency": data.get("currency"),
                            "reference_no": data.get("reference_no"),
                        }
                    else:
                        return {
                            "success": False,
                            "error": data.get("error", {}).get("message", "Unknown error"),
                        }

        except Exception as e:
            logger.exception(f"Error fetching disbursement status: {e}")
            return {"success": False, "error": str(e)}

    async def validate_bank_account(
        self, bank_code: str, account_number: str
    ) -> Dict[str, Any]:
        """
        Validate Korean bank account details.

        Args:
            bank_code: Bank institution code
            account_number: Bank account number

        Returns:
            Validation result with account details if valid
        """
        # Basic validation
        if bank_code not in KOREAN_BANKS:
            return {"valid": False, "error": f"Unknown bank code: {bank_code}"}

        if not account_number or not account_number.replace("-", "").isdigit():
            return {"valid": False, "error": "Invalid account number format"}

        bank_info = KOREAN_BANKS.get(bank_code, {})
        return {
            "valid": True,
            "bank_name": bank_info.get("name"),
            "bank_code": bank_code,
            "swift_code": bank_info.get("swift"),
            "account_number": account_number,
        }
