"""Admin notifications API router."""
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_notifications import AdminNotification
from schemas.auth import UserResponse
from services.admin_notification_service import AdminNotificationService
from utils.datetime import serialize_utc_datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/notifications", tags=["admin-notifications"])


# ---------- Schemas ----------

class AdminNotificationResponse(BaseModel):
    id: int
    admin_id: str
    notification_type: str
    title: str
    message: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    metadata: dict
    is_read: bool
    read_at: Optional[str] = None
    priority: str
    action_url: Optional[str] = None
    created_at: str
    
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm(cls, obj: AdminNotification):
        return cls(
            id=obj.id,
            admin_id=obj.admin_id,
            notification_type=obj.notification_type,
            title=obj.title,
            message=obj.message,
            user_id=obj.user_id,
            user_name=obj.user_name,
            resource_type=obj.resource_type,
            resource_id=obj.resource_id,
            metadata=obj.metadata or {},
            is_read=obj.is_read,
            read_at=serialize_utc_datetime(obj.read_at),
            priority=obj.priority,
            action_url=obj.action_url,
            created_at=serialize_utc_datetime(obj.created_at),
        )


class AdminNotificationsListResponse(BaseModel):
    notifications: List[AdminNotificationResponse]
    total_count: int
    unread_count: int


class MarkAsReadRequest(BaseModel):
    notification_id: int


class ArchiveNotificationRequest(BaseModel):
    notification_id: int


def _require_super_admin(current_user: UserResponse):
    """Ensure user is a super admin."""
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required.",
        )


# ---------- Endpoints ----------

@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get count of unread notifications for the current admin."""
    _require_super_admin(current_user)
    
    unread_count = await AdminNotificationService.get_unread_count(db, str(current_user.id))
    return {"unread_count": unread_count}


@router.get("", response_model=AdminNotificationsListResponse)
async def list_notifications(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    notification_types: Optional[str] = Query(None),  # comma-separated list of types
):
    """
    List notifications for the current admin.
    
    Query Parameters:
    - limit: Number of notifications to return (default: 50, max: 200)
    - offset: Number of notifications to skip (default: 0)
    - unread_only: If true, return only unread notifications (default: false)
    - notification_types: Comma-separated list of notification types to filter by
    """
    _require_super_admin(current_user)
    
    types_list = None
    if notification_types:
        types_list = [t.strip() for t in notification_types.split(",") if t.strip()]
    
    notifications, total_count = await AdminNotificationService.get_notifications(
        db,
        admin_id=str(current_user.id),
        limit=limit,
        offset=offset,
        unread_only=unread_only,
        notification_types=types_list,
    )
    
    unread_count = await AdminNotificationService.get_unread_count(db, str(current_user.id))
    
    return AdminNotificationsListResponse(
        notifications=[AdminNotificationResponse.from_orm(n) for n in notifications],
        total_count=total_count,
        unread_count=unread_count,
    )


@router.post("/mark-as-read", response_model=AdminNotificationResponse)
async def mark_notification_as_read(
    data: MarkAsReadRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific notification as read."""
    _require_super_admin(current_user)
    
    notification = await AdminNotificationService.mark_as_read(
        db,
        notification_id=data.notification_id,
        admin_id=str(current_user.id),
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    
    return AdminNotificationResponse.from_orm(notification)


@router.post("/mark-all-as-read", response_model=dict)
async def mark_all_as_read(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread notifications as read."""
    _require_super_admin(current_user)
    
    count = await AdminNotificationService.mark_all_as_read(db, str(current_user.id))
    return {"marked_count": count}


@router.post("/archive", response_model=AdminNotificationResponse)
async def archive_notification(
    data: ArchiveNotificationRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive a notification."""
    _require_super_admin(current_user)
    
    notification = await AdminNotificationService.archive_notification(
        db,
        notification_id=data.notification_id,
        admin_id=str(current_user.id),
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    
    return AdminNotificationResponse.from_orm(notification)
