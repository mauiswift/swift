"""add support ticket workflow

Revision ID: 20260907_add_support_tickets
Revises: zzzz_final_consolidation
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision: str = "20260907_add_support_tickets"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("support_tickets"):
        op.create_table(
            "support_tickets",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("ticket_number", sa.String(length=32), nullable=False),
            sa.Column("user_id", sa.String(length=64), nullable=False),
            sa.Column("user_name", sa.String(length=256), nullable=True),
            sa.Column("user_email", sa.String(length=256), nullable=True),
            sa.Column("organization_id", sa.String(length=64), nullable=True),
            sa.Column("subject", sa.String(length=200), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("category", sa.String(length=64), server_default="general", nullable=False),
            sa.Column("priority", sa.String(length=16), server_default="normal", nullable=False),
            sa.Column("status", sa.String(length=32), server_default="open", nullable=False),
            sa.Column("assigned_to", sa.String(length=64), nullable=True),
            sa.Column("messages", sa.JSON(), server_default="[]", nullable=False),
            sa.Column("last_response_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("ticket_number"),
        )
    existing_indexes = {index["name"] for index in inspect(bind).get_indexes("support_tickets")}
    for name, columns, unique in (
        ("ix_support_tickets_ticket_number", ["ticket_number"], True),
        ("ix_support_tickets_user_id", ["user_id"], False),
        ("idx_support_ticket_user_status", ["user_id", "status"], False),
        ("idx_support_ticket_status_updated", ["status", "updated_at"], False),
    ):
        if name not in existing_indexes:
            op.create_index(name, "support_tickets", columns, unique=unique)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("support_tickets"):
        for name in (
            "idx_support_ticket_status_updated",
            "idx_support_ticket_user_status",
            "ix_support_tickets_user_id",
            "ix_support_tickets_ticket_number",
        ):
            if any(index["name"] == name for index in inspect(bind).get_indexes("support_tickets")):
                op.drop_index(name, table_name="support_tickets")
        op.drop_table("support_tickets")