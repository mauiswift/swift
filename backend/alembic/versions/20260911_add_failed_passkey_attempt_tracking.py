"""add failed passkey tracking for wallet freeze enforcement

Revision ID: 20260911_add_failed_passkey_attempt_tracking
Revises: 20260911_add_passkeys
Create Date: 2026-09-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260911_add_failed_passkey_attempt_tracking"
down_revision = "20260911_add_passkeys"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("admin_users")}
    if "passkey_failed_attempts" not in columns:
        op.add_column(
            "admin_users",
            sa.Column("passkey_failed_attempts", sa.Integer(), server_default="0", nullable=False),
        )


def downgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("admin_users")}
    if "passkey_failed_attempts" in columns:
        op.drop_column("admin_users", "passkey_failed_attempts")
