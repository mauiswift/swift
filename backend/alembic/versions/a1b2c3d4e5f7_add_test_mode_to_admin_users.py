"""Add test_mode toggle to AdminUser for sandbox/live switching

Revision ID: a1b2c3d4e5f6
Revises: zzzz_final_consolidation
Create Date: 2026-07-21 05:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_cols = {c["name"] for c in inspect(bind).get_columns("admin_users")}
    if "test_mode" not in existing_cols:
        op.add_column(
            "admin_users",
            sa.Column("test_mode", sa.Boolean(), nullable=False, server_default='true'),
        )


def downgrade() -> None:
    op.drop_column("admin_users", "test_mode")
