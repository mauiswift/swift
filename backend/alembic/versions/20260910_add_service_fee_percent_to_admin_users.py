"""add per-user incoming service fee

Revision ID: 20260910_service_fee_percent
down_revision: 20260910_recipient_phone
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260910_service_fee_percent"
down_revision = "20260910_recipient_phone"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    try:
        cols = [c["name"] for c in inspector.get_columns("admin_users")]
    except Exception:
        cols = []

    if "service_fee_percent" not in cols:
        op.add_column(
            "admin_users",
            sa.Column("service_fee_percent", sa.Float(), nullable=False, server_default="0.4"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        cols = [c["name"] for c in inspector.get_columns("admin_users")]
    except Exception:
        cols = []

    if "service_fee_percent" in cols:
        op.drop_column("admin_users", "service_fee_percent")
