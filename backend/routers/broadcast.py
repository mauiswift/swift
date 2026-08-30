"""Broadcast message router for super admin urgent notices."""
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.broadcast_messages import BroadcastMessage
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/broadcast", tags=["broadcast"])


# ---------- Schemas ----------
class BroadcastMessageResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    priority: int
    is_active: bool
    show_on_all_pages: bool
    created_by: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CreateBroadcastRequest(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, warning, error, success
    priority: int = 1  # 1=low, 2=medium, 3=high
    expires_at: Optional[datetime] = None


class UpdateBroadcastRequest(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class BroadcastListResponse(BaseModel):
    items: List[BroadcastMessageResponse]
    total: int


# ---------- Endpoints ----------

@router.get("", response_model=BroadcastListResponse)
async def list_active_broadcasts(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all active broadcast messages (visible to all users)."""
    now = datetime.now(timezone.utc)
    stmt = select(BroadcastMessage).where(
        BroadcastMessage.is_active == True,
        BroadcastMessage.show_on_all_pages == True,
        (BroadcastMessage.expires_at.is_(None) | (BroadcastMessage.expires_at > now))
    ).order_by(BroadcastMessage.priority.desc(), BroadcastMessage.created_at.desc())
    
    result = await db.execute(stmt)
    items = result.scalars().all()
    return BroadcastListResponse(items=list(items), total=len(items))


@router.get("/admin/all", response_model=BroadcastListResponse)
async def list_all_broadcasts_admin(
    status: Optional[str] = Query(None),  # active, inactive, expired, all
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super admin only: Get all broadcast messages (active and inactive)."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    now = datetime.now(timezone.utc)
    stmt = select(BroadcastMessage)

    if status == "active":
        stmt = stmt.where(
            BroadcastMessage.is_active == True,
            (BroadcastMessage.expires_at.is_(None) | (BroadcastMessage.expires_at > now))
        )
    elif status == "inactive":
        stmt = stmt.where(BroadcastMessage.is_active == False)
    elif status == "expired":
        stmt = stmt.where(
            BroadcastMessage.expires_at.isnot(None),
            BroadcastMessage.expires_at <= now
        )

    stmt = stmt.order_by(BroadcastMessage.priority.desc(), BroadcastMessage.created_at.desc())
    result = await db.execute(stmt)
    items = result.scalars().all()
    return BroadcastListResponse(items=list(items), total=len(items))


@router.post("", response_model=BroadcastMessageResponse, status_code=201)
async def create_broadcast(
    data: CreateBroadcastRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super admin only: Create a new broadcast message."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    if not data.title or not data.message:
        raise HTTPException(status_code=400, detail="Title and message are required.")

    broadcast = BroadcastMessage(
        title=data.title,
        message=data.message,
        type=data.type,
        priority=min(3, max(1, data.priority)),  # Clamp priority between 1-3
        is_active=True,
        show_on_all_pages=True,
        created_by=current_user.id,
        expires_at=data.expires_at,
    )
    db.add(broadcast)
    await db.commit()
    await db.refresh(broadcast)

    logger.info(
        "Broadcast message #%s created by admin %s: %s",
        broadcast.id, current_user.id, data.title,
    )
    return broadcast


@router.put("/{broadcast_id}", response_model=BroadcastMessageResponse)
async def update_broadcast(
    broadcast_id: int,
    data: UpdateBroadcastRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super admin only: Update a broadcast message."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    result = await db.execute(select(BroadcastMessage).where(BroadcastMessage.id == broadcast_id))
    broadcast = result.scalar_one_or_none()
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast message not found.")

    if data.title is not None:
        broadcast.title = data.title
    if data.message is not None:
        broadcast.message = data.message
    if data.type is not None:
        broadcast.type = data.type
    if data.priority is not None:
        broadcast.priority = min(3, max(1, data.priority))
    if data.is_active is not None:
        broadcast.is_active = data.is_active
    if data.expires_at is not None:
        broadcast.expires_at = data.expires_at

    broadcast.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(broadcast)

    logger.info(
        "Broadcast message #%s updated by admin %s",
        broadcast.id, current_user.id,
    )
    return broadcast


@router.post("/{broadcast_id}/deactivate")
async def deactivate_broadcast(
    broadcast_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super admin only: Deactivate a broadcast message."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    result = await db.execute(select(BroadcastMessage).where(BroadcastMessage.id == broadcast_id))
    broadcast = result.scalar_one_or_none()
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast message not found.")

    broadcast.is_active = False
    broadcast.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(broadcast)

    logger.info("Broadcast message #%s deactivated by admin %s", broadcast.id, current_user.id)
    return {"success": True, "message": "Broadcast deactivated"}


@router.delete("/{broadcast_id}")
async def delete_broadcast(
    broadcast_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Super admin only: Delete a broadcast message."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required.")

    result = await db.execute(select(BroadcastMessage).where(BroadcastMessage.id == broadcast_id))
    broadcast = result.scalar_one_or_none()
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast message not found.")

    await db.delete(broadcast)
    await db.commit()

    logger.info("Broadcast message #%s deleted by admin %s", broadcast.id, current_user.id)
    return {"success": True, "message": "Broadcast deleted"}
