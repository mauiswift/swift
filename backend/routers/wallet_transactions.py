import logging
from typing import List, Optional

from datetime import datetime

from fastapi import Depends
from pydantic import ConfigDict, BaseModel

from services.wallet_transactions import Wallet_transactionsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from routers.base import BaseEntityRouter

# Set up logging
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------
class Wallet_transactionsData(BaseModel):
    """Entity data schema (for create/update)"""
    wallet_id: int
    transaction_type: str
    amount: float
    balance_before: float = None
    balance_after: float = None
    recipient: str = None
    note: str = None
    status: str = None
    reference_id: str = None
    created_at: Optional[datetime] = None


class Wallet_transactionsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    wallet_id: Optional[int] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None
    recipient: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: Optional[datetime] = None


class Wallet_transactionsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    wallet_id: int
    transaction_type: str
    amount: float
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None
    recipient: Optional[str] = None
    note: Optional[str] = None
    status: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Wallet_transactionsListResponse(BaseModel):
    """List response schema"""
    items: List[Wallet_transactionsResponse]
    total: int
    skip: int
    limit: int


class Wallet_transactionsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Wallet_transactionsData]


entity_router = BaseEntityRouter(
    prefix="/api/v1/entities/wallet_transactions",
    tags=["wallet_transactions"],
    service_class=Wallet_transactionsService,
    create_schema=Wallet_transactionsData,
    update_schema=Wallet_transactionsUpdateData,
    response_schema=Wallet_transactionsResponse,
    list_response_schema=Wallet_transactionsListResponse,
    batch_create_schema=Wallet_transactionsBatchCreateRequest,
)

router = entity_router.router
