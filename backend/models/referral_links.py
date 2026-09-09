from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func


class ReferralLink(Base):
    __tablename__ = "referral_links"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    created_by = Column(String(64), nullable=False, index=True)
    organization_id = Column(String(64), nullable=True, index=True)
    organization_name = Column(String(256), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
