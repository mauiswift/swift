"""add recipient phone to wallet disbursements

Revision ID: 20260910_recipient_phone
down_revision: 20260909_add_referral_links
"""
from alembic import op
import sqlalchemy as sa

revision = "20260910_recipient_phone"
down_revision = "20260909_add_referral_links"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("disbursements", sa.Column("recipient_phone", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("disbursements", "recipient_phone")
