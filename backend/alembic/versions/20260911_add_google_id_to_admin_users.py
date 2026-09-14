"""Add Google account links to admin users.

Revision ID: 20260911_google_id
Revises: 20260911_vip_gold
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260911_google_id"
down_revision = "20260911_vip_gold"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("admin_users")}
    if "google_id" not in columns:
        op.add_column("admin_users", sa.Column("google_id", sa.String(length=255), nullable=True))
    indexes = {index["name"] for index in inspect(bind).get_indexes("admin_users")}
    if "ix_admin_users_google_id" not in indexes:
        op.create_index("ix_admin_users_google_id", "admin_users", ["google_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "ix_admin_users_google_id" in {index["name"] for index in inspector.get_indexes("admin_users")}:
        op.drop_index("ix_admin_users_google_id", table_name="admin_users")
    if "google_id" in {column["name"] for column in inspect(bind).get_columns("admin_users")}:
        op.drop_column("admin_users", "google_id")
