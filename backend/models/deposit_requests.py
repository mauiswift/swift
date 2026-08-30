"""Unified deposit request model for PHP bank deposits and USDT topups."""
from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean
from sqlalchemy.sql import func


class DepositRequest(Base):
    __tablename__ = "deposit_requests"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_id = Column(String, nullable=False, index=True)
    telegram_username = Column(String, nullable=True)
    
    # Deposit type: 'php_bank' or 'usdt_topup'
    deposit_type = Column(String, nullable=False, index=True)
    
    # For both types
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)  # 'PHP' or 'USDT'
    status = Column(String, default="pending", server_default="pending", nullable=False)  # pending | approved | rejected
    note = Column(String, nullable=True)  # admin note/reason
    approved_by = Column(String, nullable=True)  # admin telegram_id
    
    # PHP Bank Deposit fields
    channel = Column(String, nullable=True)  # GCASH, MAYA, BDO, BPI, Netbank, etc.
    account_number = Column(String, nullable=True)  # source account used to send
    transfer_method = Column(String, nullable=True)  # same_bank, interbank, cash_deposit, check_deposit, international
    transfer_date = Column(String, nullable=True)  # date of transfer (YYYY-MM-DD)
    reference_number = Column(String, nullable=True)  # transaction reference
    
    # USDT Topup fields
    usdt_address = Column(String, nullable=True)  # TRC-20 address (TXXXXXXXXX format)
    usdt_platform = Column(String, nullable=True)  # exchange/platform (Binance, Kraken, etc.)
    reference_code = Column(String, nullable=True, index=True)  # for SwiftPay tracking
    
    # Receipt/proof
    receipt_file_id = Column(String, nullable=True)  # file path or Telegram file_id
    receipt_uploaded = Column(Boolean, default=False, server_default="0")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
