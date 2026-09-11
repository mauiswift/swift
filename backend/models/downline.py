"""
Downline/Referral Tree Model - Tracks user hierarchy and affiliate relationships.
"""

from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Float, ForeignKey, Index
from sqlalchemy.sql import func
from datetime import datetime


class Downline(Base):
    """
    Tracks referral relationships between users.
    Enables multi-level affiliate tracking, commission calculations, and network analysis.
    """
    __tablename__ = "downline"
    __table_args__ = (
        Index("idx_upline_id", "upline_user_id"),
        Index("idx_downline_user_id", "downline_user_id"),
        Index("idx_level", "level"),
        Index("idx_status", "status"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # User IDs (referrer and referred)
    upline_user_id = Column(String(64), nullable=False, index=True)  # The sponsor/referrer
    downline_user_id = Column(String(64), nullable=False, index=True)  # The person being referred
    
    # Direct vs inherited relationship
    is_direct = Column(Boolean, nullable=False, default=True, server_default="1")
    level = Column(Integer, nullable=False, default=1)  # 1=direct, 2=indirect, etc.
    
    # Commission tracking
    total_commissions = Column(Float, nullable=False, default=0.0)  # Lifetime commissions earned
    pending_commissions = Column(Float, nullable=False, default=0.0)  # Pending payouts
    
    # Activity tracking
    status = Column(String(32), nullable=False, default="active", server_default="active")  # active, inactive, suspended
    last_activity_at = Column(DateTime(timezone=True), nullable=True)  # Last transaction
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        onupdate=func.now(),
    )


class DownlineCommission(Base):
    """
    Commission history for downline earnings.
    Tracks individual commission transactions.
    """
    __tablename__ = "downline_commissions"
    __table_args__ = (
        Index("idx_recipient_id", "recipient_id"),
        Index("idx_source_user_id", "source_user_id"),
        Index("idx_status", "status"),
        Index("idx_created_at", "created_at"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Commission details
    recipient_id = Column(String(64), nullable=False, index=True)  # Who receives the commission
    source_user_id = Column(String(64), nullable=False, index=True)  # The downline member who generated it
    
    # Commission metadata
    commission_type = Column(String(32), nullable=False)  # 'transaction_fee', 'payment_processing', 'tier_bonus'
    amount = Column(Float, nullable=False)  # Commission amount
    currency = Column(String(4), nullable=False, default="PHP")  # Commission currency
    
    # Reference information
    reference_id = Column(String(128), nullable=True)  # Transaction/Payment ID that generated commission
    description = Column(String(256), nullable=True)
    
    # Status
    status = Column(String(32), nullable=False, default="pending")  # pending, approved, paid, cancelled
    level = Column(Integer, nullable=False, default=1)  # Which tier of downline
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        onupdate=func.now(),
    )


class DownlineNetworkStats(Base):
    """
    Pre-computed network statistics for performance optimization.
    Tracks total volume, active members, and earnings by level.
    """
    __tablename__ = "downline_network_stats"
    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_updated_at", "updated_at"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # User
    user_id = Column(String(64), nullable=False, unique=True, index=True)
    
    # Network size and activity
    direct_referrals = Column(Integer, nullable=False, default=0)
    total_network_size = Column(Integer, nullable=False, default=0)
    active_members = Column(Integer, nullable=False, default=0)
    
    # Earnings summary
    total_earned = Column(Float, nullable=False, default=0.0)
    pending_earnings = Column(Float, nullable=False, default=0.0)
    paid_out = Column(Float, nullable=False, default=0.0)
    
    # Volume metrics
    network_volume = Column(Float, nullable=False, default=0.0)  # Total transactions from network
    network_transactions = Column(Integer, nullable=False, default=0)  # Total count
    
    # Level breakdown
    level_1_count = Column(Integer, nullable=False, default=0)
    level_2_count = Column(Integer, nullable=False, default=0)
    level_3_count = Column(Integer, nullable=False, default=0)
    level_4_count = Column(Integer, nullable=False, default=0)
    level_5_count = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        onupdate=func.now(),
    )
