"""add configurable withdrawal fees per currency

Revision ID: 20260913_withdrawal_fees
Revises: 20260911_vip_gold
Branch labels: None
Depends on: None
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260913_withdrawal_fees"
down_revision = "20260911_vip_gold"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("admin_users")}

    # Add withdrawal fee columns if they don't exist
    fee_columns = {
        "withdrawal_fee_php": (sa.Float(), 15.0),
        "withdrawal_fee_krw": (sa.Float(), 1500.0),
        "withdrawal_fee_usdt": (sa.Float(), 1.0),
        "withdrawal_fee_cny": (sa.Float(), 10.0),
        "withdrawal_fee_usd": (sa.Float(), 1.0),
    }

    for col_name, (col_type, default_value) in fee_columns.items():
        if col_name not in columns:
            op.add_column(
                "admin_users",
                sa.Column(
                    col_name,
                    col_type,
                    nullable=False,
                    server_default=str(default_value),
                    default=default_value,
                ),
            )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("admin_users")}

    # Remove withdrawal fee columns
    fee_columns = [
        "withdrawal_fee_php",
        "withdrawal_fee_krw",
        "withdrawal_fee_usdt",
        "withdrawal_fee_cny",
        "withdrawal_fee_usd",
    ]

    for col_name in fee_columns:
        if col_name in columns:
            op.drop_column("admin_users", col_name)
