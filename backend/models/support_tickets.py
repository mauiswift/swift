from sqlalchemy import Column, DateTime, Index, Integer, JSON, String, Text
from sqlalchemy.sql import func

from core.database import Base


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    __table_args__ = (
        Index("idx_support_ticket_user_status", "user_id", "status"),
        Index("idx_support_ticket_status_updated", "status", "updated_at"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_number = Column(String(32), unique=True, index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    user_name = Column(String(256), nullable=True)
    user_email = Column(String(256), nullable=True)
    organization_id = Column(String(64), index=True, nullable=True)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False, default="general", server_default="general")
    priority = Column(String(16), nullable=False, default="normal", server_default="normal")
    status = Column(String(32), nullable=False, default="open", server_default="open")
    assigned_to = Column(String(64), nullable=True)
    messages = Column(JSON, nullable=False, default=list, server_default="[]")
    last_response_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)