"""Add per-user exchange-rate, withdrawal, and collection fee settings.

Revision ID: a1b2c3d4e5f6
Revises: merch_api_cfg_settle
Create Date: 2026-09-19 04:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "merch_api_cfg_settle"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _col_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
            ),
            {"t": table, "c": column},
        ).fetchone() is not None
    result = bind.execute(text(f"PRAGMA table_info({table})"))
    return any(row[1] == column for row in result)


def upgrade() -> None:
    for column_name, default_value in (
        ("exchange_rate_fee_percent", 0.0),
        ("withdrawal_fee_percent", 0.0),
        ("collection_fee_percent", 0.0),
    ):
        if not _col_exists("admin_users", column_name):
            op.add_column(
                "admin_users",
                sa.Column(column_name, sa.Float, nullable=False, server_default=str(default_value), default=default_value),
            )


def downgrade() -> None:
    for column_name in (
        "exchange_rate_fee_percent",
        "withdrawal_fee_percent",
        "collection_fee_percent",
    ):
        if _col_exists("admin_users", column_name):
            op.drop_column("admin_users", column_name)
