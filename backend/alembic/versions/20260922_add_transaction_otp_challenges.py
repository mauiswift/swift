"""Add transaction email OTP challenges.

Revision ID: 20260922_transaction_otp
Revises: 20260922_password_reset
"""

from alembic import op
import sqlalchemy as sa

revision = "20260922_transaction_otp"
down_revision = "20260922_password_reset"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "transaction_otp_challenges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("admin_user_id", sa.Integer(), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("reference", sa.String(length=128), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_transaction_otp_challenges_admin_user_id", "transaction_otp_challenges", ["admin_user_id"])
    op.create_index("ix_transaction_otp_challenges_reference", "transaction_otp_challenges", ["reference"], unique=True)
    op.create_index("ix_transaction_otp_challenges_expires_at", "transaction_otp_challenges", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_transaction_otp_challenges_expires_at", table_name="transaction_otp_challenges")
    op.drop_index("ix_transaction_otp_challenges_reference", table_name="transaction_otp_challenges")
    op.drop_index("ix_transaction_otp_challenges_admin_user_id", table_name="transaction_otp_challenges")
    op.drop_table("transaction_otp_challenges")
