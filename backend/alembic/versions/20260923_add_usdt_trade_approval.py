"""Add approval tracking to USDT trades."""

from alembic import op
import sqlalchemy as sa


revision = "20260923_usdt_trade_approval"
down_revision = "20260923_usdt_trades"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("usdt_trades", sa.Column("reviewed_by", sa.String(length=128), nullable=True))
    op.add_column("usdt_trades", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("usdt_trades", sa.Column("rejection_reason", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("usdt_trades", "rejection_reason")
    op.drop_column("usdt_trades", "reviewed_at")
    op.drop_column("usdt_trades", "reviewed_by")
