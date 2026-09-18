"""add per-user payment channel preferences"""
from alembic import op
import sqlalchemy as sa

revision = "20260918_add_user_payment_channels"
down_revision = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("payment_channels", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("admin_users", "payment_channels")
