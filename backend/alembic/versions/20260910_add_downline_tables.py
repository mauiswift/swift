"""add downline referral and commission tables"""

import sqlalchemy as sa
from alembic import op


revision = "20260910_add_downline_tables"
down_revision = "20260910_merge_active_heads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "downline",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("upline_user_id", sa.String(length=64), nullable=False),
        sa.Column("downline_user_id", sa.String(length=64), nullable=False),
        sa.Column("is_direct", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("total_commissions", sa.Float(), server_default="0", nullable=False),
        sa.Column("pending_commissions", sa.Float(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("upline_user_id", "downline_user_id", name="uq_downline_relationship"),
    )
    op.create_index("idx_upline_id", "downline", ["upline_user_id"])
    op.create_index("idx_downline_user_id", "downline", ["downline_user_id"])
    op.create_index("idx_level", "downline", ["level"])
    op.create_index("idx_status", "downline", ["status"])

    op.create_table(
        "downline_commissions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("recipient_id", sa.String(length=64), nullable=False),
        sa.Column("source_user_id", sa.String(length=64), nullable=False),
        sa.Column("commission_type", sa.String(length=32), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=4), server_default="PHP", nullable=False),
        sa.Column("reference_id", sa.String(length=128), nullable=True),
        sa.Column("description", sa.String(length=256), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column("level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_recipient_id", "downline_commissions", ["recipient_id"])
    op.create_index("idx_source_user_id", "downline_commissions", ["source_user_id"])
    op.create_index("idx_commission_status", "downline_commissions", ["status"])
    op.create_index("idx_commission_created_at", "downline_commissions", ["created_at"])

    op.create_table(
        "downline_network_stats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("direct_referrals", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_network_size", sa.Integer(), server_default="0", nullable=False),
        sa.Column("active_members", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_earned", sa.Float(), server_default="0", nullable=False),
        sa.Column("pending_earnings", sa.Float(), server_default="0", nullable=False),
        sa.Column("paid_out", sa.Float(), server_default="0", nullable=False),
        sa.Column("network_volume", sa.Float(), server_default="0", nullable=False),
        sa.Column("network_transactions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("level_1_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("level_2_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("level_3_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("level_4_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("level_5_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("idx_network_stats_user_id", "downline_network_stats", ["user_id"])
    op.create_index("idx_network_stats_updated_at", "downline_network_stats", ["updated_at"])


def downgrade() -> None:
    op.drop_table("downline_network_stats")
    op.drop_table("downline_commissions")
    op.drop_table("downline")