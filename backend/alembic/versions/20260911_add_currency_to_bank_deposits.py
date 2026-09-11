"""Add currency to manual bank deposit requests."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260911_add_currency_to_bank_deposits"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("bank_deposit_requests")}
    if "currency" not in columns:
        op.add_column(
            "bank_deposit_requests",
            sa.Column("currency", sa.String(), nullable=False, server_default="PHP"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("bank_deposit_requests")}
    if "currency" in columns:
        op.drop_column("bank_deposit_requests", "currency")
