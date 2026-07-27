import logging
from typing import List, Optional

from datetime import datetime

from fastapi import Depends
from pydantic import ConfigDict, BaseModel

from services.bot_logs import Bot_logsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from routers.base import BaseEntityRouter

# Set up logging
logger = logging.getLogger(__name__)


# ---------- Pydantic Schemas ----------
class Bot_logsData(BaseModel):
    """Entity data schema (for create/update)"""
    log_type: str
    message: str
    telegram_chat_id: str = None
    telegram_username: str = None
    command: str = None
    created_at: Optional[datetime] = None


class Bot_logsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    log_type: Optional[str] = None
    message: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None
    command: Optional[str] = None
    created_at: Optional[datetime] = None


class Bot_logsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    log_type: str
    message: str
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None
    command: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Bot_logsListResponse(BaseModel):
    """List response schema"""
    items: List[Bot_logsResponse]
    total: int
    skip: int
    limit: int


class Bot_logsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Bot_logsData]


entity_router = BaseEntityRouter(
    prefix="/api/v1/entities/bot_logs",
    tags=["bot_logs"],
    service_class=Bot_logsService,
    create_schema=Bot_logsData,
    update_schema=Bot_logsUpdateData,
    response_schema=Bot_logsResponse,
    list_response_schema=Bot_logsListResponse,
    batch_create_schema=Bot_logsBatchCreateRequest,
)

router = entity_router.router
