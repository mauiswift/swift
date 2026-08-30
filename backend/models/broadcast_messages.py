"""Broadcast message model for super admin urgent notices."""
from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean
from sqlalchemy.sql import func


class BroadcastMessage(Base):
    __tablename__ = "broadcast_messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)  # Short title for the banner
    message = Column(Text, nullable=False)  # Full message content
    type = Column(String(50), default="info", nullable=False)  # info, warning, error, success
    priority = Column(Integer, default=1, nullable=False)  # 1=low, 2=medium, 3=high (urgency)
    is_active = Column(Boolean, default=True, server_default="1")  # Whether to show the message
    show_on_all_pages = Column(Boolean, default=True, server_default="1")  # Show everywhere
    created_by = Column(String, nullable=False)  # Admin telegram_id who created it
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Auto-hide after this time
