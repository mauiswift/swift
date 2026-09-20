from sqlalchemy import Column, DateTime, Integer, String, Boolean, UniqueConstraint
from sqlalchemy.sql import func

from core.database import Base


class UsdtDepositAddress(Base):
    __tablename__ = "usdt_deposit_addresses"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_usdt_deposit_address_user"),
        UniqueConstraint("address", name="uq_usdt_deposit_address_address"),
        UniqueConstraint("derivation_index", name="uq_usdt_deposit_address_index"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(128), nullable=False, index=True)
    address = Column(String(64), nullable=False, index=True)
    derivation_index = Column(Integer, nullable=False)
    network = Column(String(16), nullable=False, default="TRON", server_default="TRON")
    active = Column(Boolean, nullable=False, default=True, server_default="true")
    last_scanned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class UsdtChainTransfer(Base):
    __tablename__ = "usdt_chain_transfers"
    __table_args__ = (
        UniqueConstraint("tx_hash", name="uq_usdt_chain_transfer_hash"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(128), nullable=False, index=True)
    address = Column(String(64), nullable=False, index=True)
    tx_hash = Column(String(128), nullable=False, index=True)
    direction = Column(String(16), nullable=False)  # incoming | outgoing
    amount_usdt = Column(String(64), nullable=False)
    from_address = Column(String(64), nullable=True)
    to_address = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False, default="confirmed", server_default="confirmed")
    raw_payload = Column(String, nullable=True)
    observed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
