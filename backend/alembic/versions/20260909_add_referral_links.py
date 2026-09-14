"""add reusable referral registration links

Revision ID: 20260909_add_referral_links
Revises: zzzz_final_consolidation
Create Date: 2026-09-09 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision: str = "20260909_add_referral_links"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if not inspect(bind).has_table("referral_links"):
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
    existing = {index["name"] for index in inspect(bind).get_indexes("referral_links")}
    for name, column in (
        ("ix_referral_links_token", "token"),
        ("ix_referral_links_created_by", "created_by"),
        ("ix_referral_links_organization_id", "organization_id"),
    ):
        if name not in existing:
            op.create_index(name, "referral_links", [column], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    if inspect(bind).has_table("referral_links"):
        for name in (
            "ix_referral_links_organization_id",
            "ix_referral_links_created_by",
            "ix_referral_links_token",
        ):
            if name in {index["name"] for index in inspect(bind).get_indexes("referral_links")}:
                op.drop_index(name, table_name="referral_links")
        op.drop_table("referral_links")
