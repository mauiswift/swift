"""add per-downline service fee

Revision ID: 20260911_downline_service_fee
Revises: 20260910_sender_details
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260911_downline_service_fee"
down_revision = "20260910_sender_details"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("downline"):
        return
    columns = [column["name"] for column in inspector.get_columns("downline")]
    if "service_fee_percent" not in columns:
        op.add_column(
            "downline",
            sa.Column("service_fee_percent", sa.Float(), nullable=False, server_default="0.0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("downline"):
        return
    columns = [column["name"] for column in inspector.get_columns("downline")]
    if "service_fee_percent" in columns:
        op.drop_column("downline", "service_fee_percent")
