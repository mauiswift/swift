"""Add approval tracking columns to transactions table

Revision ID: 20260910_add_approval_tracking
Revises: d4825d2e0284
Create Date: 2026-09-10 14:30:00.000000

Adds columns to track super admin payment approval:
- approval_status: tracks pending/approved/rejected state
- approved_by: records which admin approved the payment
- approved_at: timestamp of approval
- rejection_reason: reason if payment was rejected
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text, inspect


# revision identifiers, used by Alembic.
revision = "20260910_add_approval_tracking"
down_revision = "d4825d2e0284"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c["name"] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    """Add approval tracking columns to transactions table."""
    
    # Add approval_status column if it doesn't exist
    if not _column_exists("transactions", "approval_status"):
        op.add_column(
            "transactions",
            sa.Column(
                "approval_status",
                sa.String(32),
                nullable=True,
                server_default="pending",
            ),
        )
    
    # Add approved_by column if it doesn't exist
    if not _column_exists("transactions", "approved_by"):
        op.add_column(
            "transactions",
            sa.Column("approved_by", sa.String(64), nullable=True),
        )
    
    # Add approved_at column if it doesn't exist
    if not _column_exists("transactions", "approved_at"):
        op.add_column(
            "transactions",
            sa.Column(
                "approved_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )
    
    # Add rejection_reason column if it doesn't exist
    if not _column_exists("transactions", "rejection_reason"):
        op.add_column(
            "transactions",
            sa.Column("rejection_reason", sa.String(512), nullable=True),
        )

    # Add paid_at column if it doesn't exist for payment completion timestamps
    if not _column_exists("transactions", "paid_at"):
        op.add_column(
            "transactions",
            sa.Column(
                "paid_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )


def downgrade() -> None:
    """Revert approval tracking columns from transactions table."""
    
    if _column_exists("transactions", "approval_status"):
        op.drop_column("transactions", "approval_status")
    
    if _column_exists("transactions", "approved_by"):
        op.drop_column("transactions", "approved_by")
    
    if _column_exists("transactions", "approved_at"):
        op.drop_column("transactions", "approved_at")
    
    if _column_exists("transactions", "rejection_reason"):
        op.drop_column("transactions", "rejection_reason")

    if _column_exists("transactions", "paid_at"):
        op.drop_column("transactions", "paid_at")
