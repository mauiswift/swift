"""Add the official Telegram channel to bot settings.

Revision ID: 20260926_official_channel
Revises: zzzz_final_consolidation
Create Date: 2026-09-26 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision: str = "20260926_official_channel"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_columns = {column["name"] for column in inspect(bind).get_columns("bot_settings")}
    if "official_channel_username" not in existing_columns:
        op.add_column(
            "bot_settings",
            sa.Column(
                "official_channel_username",
                sa.String(),
                nullable=True,
                server_default="PayBotPH",
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    existing_columns = {column["name"] for column in inspect(bind).get_columns("bot_settings")}
    if "official_channel_username" in existing_columns:
        op.drop_column("bot_settings", "official_channel_username")
