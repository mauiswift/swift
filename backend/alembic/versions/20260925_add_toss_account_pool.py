"""add configurable TOSS account pool"""
from alembic import op
import sqlalchemy as sa

revision = "20260925_toss_account_pool"
down_revision = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "toss_account_pool",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bank_name", sa.String(length=128), nullable=False, server_default="토스페이"),
        sa.Column("account_number", sa.String(length=64), nullable=False),
        sa.Column("account_holder_name", sa.String(length=256), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_assigned_transaction_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("account_number"),
    )
    op.create_index("idx_toss_account_pool_active", "toss_account_pool", ["is_active"])


def downgrade() -> None:
    op.drop_index("idx_toss_account_pool_active", table_name="toss_account_pool")
    op.drop_table("toss_account_pool")
