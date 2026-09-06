"""add Telegram preferred currency

Revision ID: add_admin_user_preferred_currency
Revises: zzzz_final_consolidation
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "add_admin_user_preferred_currency"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column("preferred_currency", sa.String(length=8), nullable=False, server_default="PHP"),
    )


def downgrade() -> None:
    op.drop_column("admin_users", "preferred_currency")
