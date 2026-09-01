from core.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func


class ManualDepositReceipt(Base):
    __tablename__ = "manual_deposit_receipts"
    __table_args__ = ({"extend_existing": True},)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=True)  # associated merchant/user (optional)
    uploaded_by = Column(String, nullable=True)
    transaction_id = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending|matched|approved|rejected
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True, default="PHP")
    reference = Column(String, nullable=True)
    deposited_at = Column(DateTime(timezone=True), nullable=True)
    file_path = Column(String, nullable=False)
    metadata = Column(JSON, nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
