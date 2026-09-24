"""add wallet action permissions to custom roles

Revision ID: 20260924_wallet_perms
Revises: zzzz_final_consolidation
Create Date: 2026-09-24 09:55:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision: str = "20260924_wallet_perms"
down_revision: Union[str, None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("custom_roles")}
    for name in (
        "can_credit_wallet",
        "can_debit_wallet",
        "can_freeze_wallet",
        "can_unfreeze_wallet",
    ):
        if name not in columns:
            op.add_column(
                "custom_roles",
                sa.Column(name, sa.Boolean(), nullable=False, server_default=sa.text("false")),
            )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("custom_roles")}
    for name in (
        "can_unfreeze_wallet",
        "can_freeze_wallet",
        "can_debit_wallet",
        "can_credit_wallet",
    ):
        if name in columns:
            op.drop_column("custom_roles", name)
