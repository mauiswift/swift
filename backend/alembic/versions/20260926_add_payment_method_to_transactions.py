"""Persist the payment brand selected for checkout.

Revision ID: 20260926_payment_method
Revises: 20260926_official_channel, 20260926_swiftpay_qr_p2m
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision: str = "20260926_payment_method"
down_revision: Union[str, Sequence[str], None] = (
    "20260926_official_channel",
    "20260926_swiftpay_qr_p2m",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("transactions")}
    if "payment_method" not in columns:
        op.add_column("transactions", sa.Column("payment_method", sa.String(length=128), nullable=True))


def downgrade() -> None:
    columns = {column["name"] for column in inspect(op.get_bind()).get_columns("transactions")}
    if "payment_method" in columns:
        op.drop_column("transactions", "payment_method")
