from core.database import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.sql import func


class WalletReservation(Base):
    __tablename__ = "wallet_reservations"
    __table_args__ = (
        UniqueConstraint("reference_id", name="uq_wallet_reservations_reference"),
        Index("ix_wallet_reservations_wallet_status", "wallet_id", "status"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False, index=True)
    user_id = Column(String(128), nullable=False, index=True)
    organization_id = Column(String(64), nullable=True, index=True)
    currency = Column(String(8), nullable=False)
    amount = Column(Float, nullable=False)
    reference_id = Column(String(128), nullable=False)
    status = Column(String(16), nullable=False, default="pending", server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())