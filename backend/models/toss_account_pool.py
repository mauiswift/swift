from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Index

from core.database import Base


class TossAccountPool(Base):
    __tablename__ = "toss_account_pool"
    __table_args__ = (
        Index("idx_toss_account_pool_active", "is_active"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    bank_name = Column(String(128), nullable=False, default="Toss Bank")
    account_number = Column(String(64), nullable=False, unique=True)
    account_holder_name = Column(String(256), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    last_assigned_at = Column(DateTime(timezone=True), nullable=True)
    last_assigned_transaction_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
