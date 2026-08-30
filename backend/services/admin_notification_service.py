"""Service for managing admin notifications."""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.admin_notifications import AdminNotification
from models.admin_users import AdminUser

logger = logging.getLogger(__name__)


class AdminNotificationService:
    """Service to create and manage admin notifications."""

    @staticmethod
    async def notify_super_admins(
        db: AsyncSession,
        notification_type: str,
        title: str,
        message: str,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        priority: str = "normal",
        action_url: Optional[str] = None,
    ) -> List[AdminNotification]:
        """
        Create a notification for all active super admins.
        
        Args:
            db: Database session
            notification_type: Type of notification (payment_request, settlement_request, kyb_application, etc.)
            title: Notification title
            message: Notification message body
            user_id: ID of the user who triggered the notification
            user_name: Name of the user who triggered the notification
            resource_type: Type of resource (payment, disbursement, kyb, settlement, etc.)
            resource_id: ID of the related resource
            metadata: Additional metadata as JSON
            priority: Notification priority (low, normal, high, urgent)
            action_url: URL to view the resource in the dashboard
        
        Returns:
            List of created notification records
        """
        try:
            # Fetch all active super admins
            result = await db.execute(
                select(AdminUser).where(
                    and_(
                        AdminUser.is_super_admin == True,
                        AdminUser.is_active == True,
                    )
                )
            )
            super_admins = result.scalars().all()
            
            if not super_admins:
                logger.warning("No active super admins found to notify")
                return []
            
            notifications = []
            for admin in super_admins:
                notification = AdminNotification(
                    admin_id=admin.telegram_id,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    user_id=user_id,
                    user_name=user_name,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    metadata=metadata or {},
                    priority=priority,
                    action_url=action_url,
                )
                db.add(notification)
                notifications.append(notification)
            
            await db.commit()
            logger.info(
                f"Created {len(notifications)} notifications for type={notification_type}, "
                f"user_id={user_id}, resource_id={resource_id}"
            )
            return notifications
            
        except Exception as e:
            logger.error(f"Failed to create admin notifications: {e}")
            await db.rollback()
            return []

    @staticmethod
    async def get_unread_count(db: AsyncSession, admin_id: str) -> int:
        """Get count of unread notifications for an admin."""
        result = await db.execute(
            select(AdminNotification).where(
                and_(
                    AdminNotification.admin_id == admin_id,
                    AdminNotification.is_read == False,
                    AdminNotification.is_archived == False,
                )
            )
        )
        return len(result.scalars().all())

    @staticmethod
    async def get_notifications(
        db: AsyncSession,
        admin_id: str,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
        notification_types: Optional[List[str]] = None,
    ) -> tuple[List[AdminNotification], int]:
        """
        Fetch notifications for an admin with pagination.
        
        Returns:
            Tuple of (notifications, total_count)
        """
        query = select(AdminNotification).where(
            and_(
                AdminNotification.admin_id == admin_id,
                AdminNotification.is_archived == False,
            )
        )
        
        if unread_only:
            query = query.where(AdminNotification.is_read == False)
        
        if notification_types:
            query = query.where(AdminNotification.notification_type.in_(notification_types))
        
        # Count total
        count_result = await db.execute(
            select(AdminNotification).where(
                and_(
                    AdminNotification.admin_id == admin_id,
                    AdminNotification.is_archived == False,
                )
            )
        )
        total_count = len(count_result.scalars().all())
        
        # Fetch with pagination
        result = await db.execute(
            query.order_by(AdminNotification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        notifications = result.scalars().all()
        
        return notifications, total_count

    @staticmethod
    async def mark_as_read(db: AsyncSession, notification_id: int, admin_id: str) -> Optional[AdminNotification]:
        """Mark a notification as read."""
        result = await db.execute(
            select(AdminNotification).where(
                and_(
                    AdminNotification.id == notification_id,
                    AdminNotification.admin_id == admin_id,
                )
            )
        )
        notification = result.scalar_one_or_none()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            await db.commit()
            await db.refresh(notification)
        
        return notification

    @staticmethod
    async def mark_all_as_read(db: AsyncSession, admin_id: str) -> int:
        """Mark all unread notifications as read."""
        result = await db.execute(
            select(AdminNotification).where(
                and_(
                    AdminNotification.admin_id == admin_id,
                    AdminNotification.is_read == False,
                )
            )
        )
        notifications = result.scalars().all()
        
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
        
        await db.commit()
        return len(notifications)

    @staticmethod
    async def archive_notification(db: AsyncSession, notification_id: int, admin_id: str) -> Optional[AdminNotification]:
        """Archive a notification."""
        result = await db.execute(
            select(AdminNotification).where(
                and_(
                    AdminNotification.id == notification_id,
                    AdminNotification.admin_id == admin_id,
                )
            )
        )
        notification = result.scalar_one_or_none()
        
        if notification:
            notification.is_archived = True
            await db.commit()
            await db.refresh(notification)
        
        return notification
