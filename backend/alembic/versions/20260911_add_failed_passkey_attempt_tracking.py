"""add failed passkey tracking for wallet freeze enforcement

Revision ID: 20260911_passkey_attempts
Revises: 20260911_add_passkeys
Create Date: 2026-09-11
"""

from alembic import op
import sqlalchemy as sa


revision = "20260911_passkey_attempts"
down_revision = "20260911_add_passkeys"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column("passkey_failed_attempts", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("admin_users", "passkey_failed_attempts")
