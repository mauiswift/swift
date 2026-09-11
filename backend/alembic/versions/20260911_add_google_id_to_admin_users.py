"""Add Google account links to admin users.

Revision ID: 20260911_google_id
Revises: 20260911_vip_gold
"""

from alembic import op
import sqlalchemy as sa


revision = "20260911_google_id"
down_revision = "20260911_vip_gold"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("google_id", sa.String(length=255), nullable=True))
    op.create_index("ix_admin_users_google_id", "admin_users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_admin_users_google_id", table_name="admin_users")
    op.drop_column("admin_users", "google_id")
