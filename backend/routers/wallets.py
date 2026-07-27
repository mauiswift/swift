import logging
from typing import List, Optional

from datetime import datetime

from fastapi import Depends
from pydantic import ConfigDict, BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.wallets import WalletsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from routers.base import BaseEntityRouter

# Set up logging
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------
class WalletsData(BaseModel):
    """Entity data schema (for create/update)"""
    balance: float
    currency: str = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WalletsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    balance: Optional[float] = None
    currency: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WalletsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    balance: float
    currency: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WalletsListResponse(BaseModel):
    """List response schema"""
    items: List[WalletsResponse]
    total: int
    skip: int
    limit: int


class WalletsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[WalletsData]


entity_router = BaseEntityRouter(
    prefix="/api/v1/entities/wallets",
    tags=["wallets"],
    service_class=WalletsService,
    create_schema=WalletsData,
    update_schema=WalletsUpdateData,
    response_schema=WalletsResponse,
    list_response_schema=WalletsListResponse,
    batch_create_schema=WalletsBatchCreateRequest,
)

router = entity_router.router
