"""Admin notification model for super admin dashboard alerts."""
from datetime import datetime
from typing import Optional

from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, JSON, Index
from sqlalchemy.sql import func


class AdminNotification(Base):
    __tablename__ = "admin_notifications"
    __table_args__ = {
        "extend_existing": True,
        "indexes": [
            Index("idx_admin_id_read", "admin_id", "is_read"),
            Index("idx_created_at", "created_at"),
            Index("idx_notification_type", "notification_type"),
        ],
    }

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Target admin (super admin receiving the notification)
    admin_id = Column(String(64), index=True, nullable=False)
    
    # Notification metadata
    notification_type = Column(String(64), index=True, nullable=False)  # e.g., "payment_request", "settlement_request", "kyb_application"
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related resource info
    user_id = Column(String(64), nullable=True)  # The user who triggered the notification
    user_name = Column(String(256), nullable=True)
    resource_type = Column(String(64), nullable=True)  # e.g., "payment", "disbursement", "kyb", "settlement"
    resource_id = Column(String(256), nullable=True)  # ID of the related resource
    
    # Action metadata (JSON for flexibility)
    metadata = Column(JSON, nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False, server_default='false', nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    is_archived = Column(Boolean, default=False, server_default='false', nullable=False)
    
    # Priority level
    priority = Column(String(16), default='normal', nullable=False)  # "low", "normal", "high", "urgent"
    
    # Action URL (link to view the resource in the dashboard)
    action_url = Column(String(512), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
