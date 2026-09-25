"""Add durable USDT trade records."""

from alembic import op
import sqlalchemy as sa


revision = "20260923_usdt_trades"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usdt_trades",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("side", sa.String(length=16), nullable=False),
        sa.Column("source_currency", sa.String(length=16), nullable=False),
        sa.Column("target_currency", sa.String(length=16), nullable=False),
        sa.Column("requested_amount", sa.Numeric(precision=24, scale=8), nullable=False),
        sa.Column("quoted_amount", sa.Numeric(precision=24, scale=8), nullable=True),
        sa.Column("settled_amount", sa.Numeric(precision=24, scale=8), nullable=True),
        sa.Column("fee", sa.Numeric(precision=24, scale=8), server_default="0", nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("provider_order_id", sa.String(length=128), nullable=True),
        sa.Column("provider_withdrawal_id", sa.String(length=128), nullable=True),
        sa.Column("destination_address", sa.String(length=64), nullable=True),
        sa.Column("withdrawal_status", sa.String(length=32), nullable=True),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column("failure_reason", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key", name="uq_usdt_trades_idempotency_key"),
        sa.UniqueConstraint("provider_order_id", name="uq_usdt_trades_provider_order_id"),
    )
    op.create_index("ix_usdt_trades_user_id", "usdt_trades", ["user_id"], unique=False)
    op.create_index("ix_usdt_trades_status", "usdt_trades", ["status"], unique=False)
    op.create_index("ix_usdt_trades_created_at", "usdt_trades", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_usdt_trades_created_at", table_name="usdt_trades")
    op.drop_index("ix_usdt_trades_status", table_name="usdt_trades")
    op.drop_index("ix_usdt_trades_user_id", table_name="usdt_trades")
    op.drop_table("usdt_trades")
