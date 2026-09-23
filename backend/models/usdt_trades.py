from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.sql import func

from core.database import Base


class UsdtTrade(Base):
    """Durable record of a PHP/USDT trade with an external provider."""

    __tablename__ = "usdt_trades"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_usdt_trades_idempotency_key"),
        UniqueConstraint("provider_order_id", name="uq_usdt_trades_provider_order_id"),
        Index("ix_usdt_trades_user_id", "user_id"),
        Index("ix_usdt_trades_status", "status"),
        Index("ix_usdt_trades_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(128), nullable=False)
    side = Column(String(16), nullable=False)  # buy or sell
    source_currency = Column(String(16), nullable=False)
    target_currency = Column(String(16), nullable=False)
    requested_amount = Column(Numeric(24, 8), nullable=False)
    quoted_amount = Column(Numeric(24, 8), nullable=True)
    settled_amount = Column(Numeric(24, 8), nullable=True)
    fee = Column(Numeric(24, 8), nullable=False, server_default="0")
    provider = Column(String(64), nullable=False)
    provider_order_id = Column(String(128), nullable=True)
    provider_withdrawal_id = Column(String(128), nullable=True)
    destination_address = Column(String(64), nullable=True)
    withdrawal_status = Column(String(32), nullable=True)
    idempotency_key = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False, server_default="pending")
    failure_reason = Column(String(512), nullable=True)
    reviewed_by = Column(String(128), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
