import logging
from typing import List, Optional

from datetime import datetime

from fastapi import Depends
from pydantic import ConfigDict, BaseModel

from services.subscriptions import SubscriptionsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from routers.base import BaseEntityRouter

# Set up logging
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------
class SubscriptionsData(BaseModel):
    """Entity data schema (for create/update)"""
    plan_name: str
    amount: float
    currency: str = None
    interval: str = None
    customer_name: str = None
    customer_email: str = None
    status: str = None
    next_billing_date: Optional[datetime] = None
    total_cycles: int = None
    external_id: str = None
    xendit_id: str = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SubscriptionsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    plan_name: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    interval: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    status: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    total_cycles: Optional[int] = None
    external_id: Optional[str] = None
    xendit_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SubscriptionsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    plan_name: str
    amount: float
    currency: Optional[str] = None
    interval: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    status: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    total_cycles: Optional[int] = None
    external_id: Optional[str] = None
    xendit_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SubscriptionsListResponse(BaseModel):
    """List response schema"""
    items: List[SubscriptionsResponse]
    total: int
    skip: int
    limit: int


class SubscriptionsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[SubscriptionsData]


entity_router = BaseEntityRouter(
    prefix="/api/v1/entities/subscriptions",
    tags=["subscriptions"],
    service_class=SubscriptionsService,
    create_schema=SubscriptionsData,
    update_schema=SubscriptionsUpdateData,
    response_schema=SubscriptionsResponse,
    list_response_schema=SubscriptionsListResponse,
    batch_create_schema=SubscriptionsBatchCreateRequest,
)

router = entity_router.router
