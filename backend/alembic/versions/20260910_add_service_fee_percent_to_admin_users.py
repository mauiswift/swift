"""add per-user incoming service fee

Revision ID: 20260910_service_fee_percent
down_revision: 20260909_add_referral_links
"""
from alembic import op
import sqlalchemy as sa

revision = "20260910_service_fee_percent"
down_revision = "20260910_recipient_phone"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("service_fee_percent", sa.Float(), nullable=False, server_default="0.4"))


def downgrade() -> None:
    op.drop_column("admin_users", "service_fee_percent")
