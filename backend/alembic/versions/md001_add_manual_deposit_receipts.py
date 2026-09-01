"""Alembic migration: add manual_deposit_receipts table

Revision ID: md001_add_manual_deposit_receipts
Revises: m1n2o3p4q5r6
Create Date: 2026-09-01 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


revision: str = "md001_add_manual_deposit_receipts"
down_revision: Union[str, Sequence[str], None] = "m1n2o3p4q5r6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return (
            bind.execute(
                text("SELECT 1 FROM information_schema.tables WHERE table_name=:t"), {"t": name}
            ).fetchone()
            is not None
        )
    return (
        bind.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"), {"t": name}).fetchone()
        is not None
    )


def upgrade() -> None:
    if not _table_exists("manual_deposit_receipts"):
        op.create_table(
            "manual_deposit_receipts",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("user_id", sa.String(), nullable=True),
            sa.Column("uploaded_by", sa.String(), nullable=True),
            sa.Column("transaction_id", sa.Integer(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'pending'")),
            sa.Column("amount", sa.Float(), nullable=True),
            sa.Column("currency", sa.String(), nullable=True),
            sa.Column("reference", sa.String(), nullable=True),
            sa.Column("deposited_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("file_path", sa.String(), nullable=False),
            sa.Column("metadata", sa.JSON(), nullable=True),
            sa.Column("note", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=True),
        )
        op.create_index(op.f("ix_manual_deposit_user_id"), "manual_deposit_receipts", ["user_id"], unique=False)
        op.create_index(op.f("ix_manual_deposit_status"), "manual_deposit_receipts", ["status"], unique=False)


def downgrade() -> None:
    if _table_exists("manual_deposit_receipts"):
        op.drop_index(op.f("ix_manual_deposit_user_id"), table_name="manual_deposit_receipts")
        op.drop_index(op.f("ix_manual_deposit_status"), table_name="manual_deposit_receipts")
        op.drop_table("manual_deposit_receipts")
