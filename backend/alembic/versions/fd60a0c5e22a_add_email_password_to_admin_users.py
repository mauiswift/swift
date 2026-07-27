"""add email and password_hash to admin_users

Revision ID: a1b2c3d4e5f6
Revises: 77eb8934e7d1
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "fd60a0c5e22a"
down_revision: Union[str, Sequence[str], None] = "77eb8934e7d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=:t"),
            {"t": name},
        ).fetchone() is not None
    return bind.execute(
        text("SELECT 1 FROM sqlite_master WHERE type='table' AND name=:t"), {"t": name}
    ).fetchone() is not None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
            ),
            {"t": table, "c": column},
        ).fetchone() is not None
    return bind.execute(text(f"PRAGMA table_info('{table}')")).fetchall() and any(
        r[1] == column for r in bind.execute(text(f"PRAGMA table_info('{table}')")).fetchall()
    )


def _index_exists(name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text("SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname=:n"),
            {"n": name},
        ).fetchone() is not None
    return bind.execute(
        text("SELECT 1 FROM sqlite_master WHERE type='index' AND name=:n"), {"n": name}
    ).fetchone() is not None


def upgrade() -> None:
    if _table_exists("admin_users"):
        if not _column_exists("admin_users", "email"):
            op.add_column("admin_users", sa.Column("email", sa.String(length=256), nullable=True))
        if not _index_exists("ix_admin_users_email"):
            op.create_index("ix_admin_users_email", "admin_users", ["email"], unique=True)
        if not _column_exists("admin_users", "password_hash"):
            op.add_column("admin_users", sa.Column("password_hash", sa.String(length=256), nullable=True))


def downgrade() -> None:
    if _table_exists("admin_users"):
        if _column_exists("admin_users", "password_hash"):
            op.drop_column("admin_users", "password_hash")
        if _index_exists("ix_admin_users_email"):
            op.drop_index("ix_admin_users_email", table_name="admin_users")
        if _column_exists("admin_users", "email"):
            op.drop_column("admin_users", "email")
