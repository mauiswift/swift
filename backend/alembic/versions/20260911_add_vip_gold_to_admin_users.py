"""add per-user VIP Gold flag

Revision ID: 20260911_vip_gold
Revises: 20260911_downline_service_fee
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260911_vip_gold"
down_revision = "20260911_downline_service_fee"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = [column["name"] for column in inspect(bind).get_columns("admin_users")]
    if "vip_gold" not in columns:
        op.add_column("admin_users", sa.Column("vip_gold", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    bind = op.get_bind()
    columns = [column["name"] for column in inspect(bind).get_columns("admin_users")]
    if "vip_gold" in columns:
        op.drop_column("admin_users", "vip_gold")
