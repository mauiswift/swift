import logging
from typing import List, Optional

from datetime import datetime

from fastapi import Depends, HTTPException
from pydantic import ConfigDict, BaseModel, field_serializer
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.transactions import TransactionsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from routers.base import BaseEntityRouter
from utils.datetime import serialize_utc_datetime

# Set up logging
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------
class TransactionsData(BaseModel):
    """Entity data schema (for create/update)"""
    transaction_type: str
    external_id: str = None
    xendit_id: str = None
    amount: float
    currency: str = None
    status: str
    title: str = None
    order_no: str = None
    description: str = None
    customer_name: str = None
    customer_email: str = None
    payment_url: str = None
    qr_code_url: str = None
    telegram_chat_id: str = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


class TransactionsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    transaction_type: Optional[str] = None
    external_id: Optional[str] = None
    xendit_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None
    order_no: Optional[str] = None
    description: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    sender_name: Optional[str] = None
    sender_bank: Optional[str] = None
    payment_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None


class TransactionsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    transaction_type: str
    external_id: Optional[str] = None
    xendit_id: Optional[str] = None
    amount: float
    currency: Optional[str] = None
    status: str
    approval_status: Optional[str] = None
    rejection_reason: Optional[str] = None
    title: Optional[str] = None
    order_no: Optional[str] = None
    description: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    sender_name: Optional[str] = None
    sender_bank: Optional[str] = None
    payment_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    @field_serializer("expires_at", "created_at", "updated_at", "paid_at")
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        return serialize_utc_datetime(value)

    model_config = ConfigDict(from_attributes=True)


class TransactionsListResponse(BaseModel):
    """List response schema"""
    items: List[TransactionsResponse]
    total: int
    skip: int
    limit: int


class TransactionsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[TransactionsData]


entity_router = BaseEntityRouter(
    prefix="/api/v1/entities/transactions",
    tags=["transactions"],
    service_class=TransactionsService,
    create_schema=TransactionsData,
    update_schema=TransactionsUpdateData,
    response_schema=TransactionsResponse,
    list_response_schema=TransactionsListResponse,
    batch_create_schema=TransactionsBatchCreateRequest,
)

router = entity_router.router


@router.get("/public/{external_id}", response_model=TransactionsResponse)
async def get_public_transaction(
    external_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public transaction lookup by external_id or gateway ID for hosted checkout pages.
    """
    service = TransactionsService(db)
    result = await service.find_by_external_or_gateway_id(external_id)
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result
