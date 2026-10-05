from core.database import Base
from sqlalchemy import Column, DateTime, Integer, JSON, String, Text


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True)
    provider = Column(String(50), nullable=False)
    event_type = Column(String(100), nullable=False)
    external_id = Column(String(255), nullable=True)
    payload = Column(JSON, nullable=True)
    status = Column(String(50), nullable=True, default="processed")
    retry_count = Column(Integer, nullable=True, default=0)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
