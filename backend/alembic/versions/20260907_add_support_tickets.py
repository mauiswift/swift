"""add support ticket workflow

Revision ID: 20260907_add_support_tickets
Revises: zzzz_final_consolidation
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260907_add_support_tickets"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
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
    op.create_index("ix_support_tickets_ticket_number", "support_tickets", ["ticket_number"], unique=True)
    op.create_index("ix_support_tickets_user_id", "support_tickets", ["user_id"], unique=False)
    op.create_index("idx_support_ticket_user_status", "support_tickets", ["user_id", "status"], unique=False)
    op.create_index("idx_support_ticket_status_updated", "support_tickets", ["status", "updated_at"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_support_ticket_status_updated", table_name="support_tickets")
    op.drop_index("idx_support_ticket_user_status", table_name="support_tickets")
    op.drop_index("ix_support_tickets_user_id", table_name="support_tickets")
    op.drop_index("ix_support_tickets_ticket_number", table_name="support_tickets")
    op.drop_table("support_tickets")