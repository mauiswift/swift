"""add reusable referral registration links

Revision ID: 20260909_add_referral_links
Revises: zzzz_final_consolidation
Create Date: 2026-09-09 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260909_add_referral_links"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "referral_links",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("created_by", sa.String(length=64), nullable=False),
        sa.Column("organization_id", sa.String(length=64), nullable=True),
        sa.Column("organization_name", sa.String(length=256), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_referral_links_token", "referral_links", ["token"], unique=False)
    op.create_index("ix_referral_links_created_by", "referral_links", ["created_by"], unique=False)
    op.create_index("ix_referral_links_organization_id", "referral_links", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_referral_links_organization_id", table_name="referral_links")
    op.drop_index("ix_referral_links_created_by", table_name="referral_links")
    op.drop_index("ix_referral_links_token", table_name="referral_links")
    op.drop_table("referral_links")
