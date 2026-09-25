"""Store customer-facing checkout amount separately from processing amount."""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import inspect
import sqlalchemy as sa


revision: str = "20260917_checkout_amount"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("transactions")}
    if "original_amount" not in columns:
        op.add_column("transactions", sa.Column("original_amount", sa.Float(), nullable=True))
    if "original_currency" not in columns:
        op.add_column("transactions", sa.Column("original_currency", sa.String(), nullable=True))


def downgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("transactions")}
    if "original_currency" in columns:
        op.drop_column("transactions", "original_currency")
    if "original_amount" in columns:
        op.drop_column("transactions", "original_amount")
