"""Add sender details to manually approved transactions."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260910_sender_details"
down_revision = "20260910_service_fee_percent"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("transactions")}
    if "sender_name" not in columns:
        op.add_column("transactions", sa.Column("sender_name", sa.String(), nullable=True))
    if "sender_bank" not in columns:
        op.add_column("transactions", sa.Column("sender_bank", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("transactions")}
    if "sender_bank" in columns:
        op.drop_column("transactions", "sender_bank")
    if "sender_name" in columns:
        op.drop_column("transactions", "sender_name")