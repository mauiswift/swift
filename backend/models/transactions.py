from core.database import Base
from sqlalchemy import Column, DateTime, Float, Index, Integer, String


class Transactions(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        # Index for per-user list queries (the most common filter)
        Index("idx_txn_user_id", "user_id"),
        # Index for status-based filtering (e.g. pending/completed dashboards)
        Index("idx_txn_status", "status"),
        # Index for short URL lookups
        Index("idx_txn_short_url_slug", "short_url_slug", unique=True),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)
    external_id = Column(String, nullable=True)
    xendit_id = Column(String, nullable=True)
    short_url_slug = Column(String, nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=True, default='PHP', server_default='PHP')
    original_amount = Column(Float, nullable=True)
    original_currency = Column(String, nullable=True)
    status = Column(String, nullable=False)
    approval_status = Column(String, nullable=True, default='pending')  # pending, approved, rejected
    approved_by = Column(String, nullable=True)  # Admin user ID
    approved_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)  # Actual time the payment was completed
    rejection_reason = Column(String, nullable=True)
    title = Column(String, nullable=True)
    order_no = Column(String, nullable=True)
    description = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    sender_name = Column(String, nullable=True)
    sender_bank = Column(String, nullable=True)
    payment_url = Column(String, nullable=True)
    receipt_file_id = Column(String, nullable=True)
    bank_name = Column(String(128), nullable=True)
    bank_account_number = Column(String(128), nullable=True)
    bank_account_name = Column(String(256), nullable=True)
    bank_account_reference = Column(String(256), nullable=True)
    qr_code_url = Column(String, nullable=True)
    telegram_chat_id = Column(String, nullable=True)
    checkout_token = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
