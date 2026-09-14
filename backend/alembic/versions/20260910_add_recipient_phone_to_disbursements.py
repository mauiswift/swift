"""add recipient phone to wallet disbursements

Revision ID: 20260910_recipient_phone
down_revision: 20260909_add_referral_links
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260910_recipient_phone"
down_revision = "20260909_add_referral_links"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("disbursements")}
    if "recipient_phone" not in columns:
        op.add_column("disbursements", sa.Column("recipient_phone", sa.String(length=32), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("disbursements")}
    if "recipient_phone" in columns:
        op.drop_column("disbursements", "recipient_phone")
