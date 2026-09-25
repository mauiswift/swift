"""add per-user TOSS Virtual Account applications"""
from alembic import op
import sqlalchemy as sa

revision = "20260918_toss_virtual"
down_revision = "20260918_payment_channels"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column("toss_virtual_account_status", sa.String(length=32), nullable=False, server_default="not_started"),
    )
    op.add_column("admin_users", sa.Column("toss_virtual_account_application", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("admin_users", "toss_virtual_account_application")
    op.drop_column("admin_users", "toss_virtual_account_status")
