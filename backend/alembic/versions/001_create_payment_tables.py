"""Create payment and transaction tables

Revision ID: 001
Revises:
Create Date: 2026-07-15
"""
from alembic import op
import sqlalchemy as sa


revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create payment-related tables"""
    # Transactions table
    op.create_table(
        "transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("transaction_type", sa.String(50), nullable=False),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("currency", sa.String(3), default="PHP"),
        sa.Column("status", sa.String(50), default="pending"),
        sa.Column("external_id", sa.String(255), unique=True),
        sa.Column("gateway_id", sa.String(255)),
        sa.Column("xendit_id", sa.String(255)),
        sa.Column("description", sa.Text),
        sa.Column("customer_name", sa.String(255)),
        sa.Column("customer_email", sa.String(255)),
        sa.Column("payment_url", sa.Text),
        sa.Column("receipt_file_id", sa.String(255)),
        sa.Column("webhook_status", sa.String(50), default="pending"),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
        sa.Column("completed_at", sa.DateTime),
        sa.Index("idx_user_id", "user_id"),
        sa.Index("idx_external_id", "external_id"),
        sa.Index("idx_status", "status"),
        sa.Index("idx_created_at", "created_at"),
    )
    
    # Payment Methods table
    op.create_table(
        "payment_methods",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("method_type", sa.String(50), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("last_four", sa.String(4)),
        sa.Column("display_name", sa.String(255)),
        sa.Column("is_default", sa.Boolean, default=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("metadata", sa.JSON),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
        sa.Index("idx_user_payment_methods", "user_id"),
    )
    
    # Webhook Events table
    op.create_table(
        "webhook_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("external_id", sa.String(255)),
        sa.Column("payload", sa.JSON),
        sa.Column("status", sa.String(50), default="pending"),
        sa.Column("retry_count", sa.Integer, default=0),
        sa.Column("last_error", sa.Text),
        sa.Column("created_at", sa.DateTime),
        sa.Column("processed_at", sa.DateTime),
        sa.Index("idx_provider_event", "provider", "event_type"),
        sa.Index("idx_webhook_status", "status"),
    )


def downgrade() -> None:
    """Drop payment-related tables"""
    op.drop_table("webhook_events")
    op.drop_table("payment_methods")
    op.drop_table("transactions")
