"""Add optional Google and Telegram identity links to KYB registrations.

Revision ID: 20260922_registration_links
Revises: 20260922_transaction_otp
"""

from alembic import op
import sqlalchemy as sa

revision = "20260922_registration_links"
down_revision = "20260922_transaction_otp"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("kyb_registrations", sa.Column("telegram_user_id", sa.String(length=64), nullable=True))
    op.add_column("kyb_registrations", sa.Column("google_id", sa.String(length=255), nullable=True))
    op.create_index("ix_kyb_registrations_telegram_user_id", "kyb_registrations", ["telegram_user_id"], unique=True)
    op.create_index("ix_kyb_registrations_google_id", "kyb_registrations", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_kyb_registrations_google_id", table_name="kyb_registrations")
    op.drop_index("ix_kyb_registrations_telegram_user_id", table_name="kyb_registrations")
    op.drop_column("kyb_registrations", "google_id")
    op.drop_column("kyb_registrations", "telegram_user_id")
