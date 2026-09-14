"""add passkey credentials and challenges

Revision ID: 20260911_add_passkeys
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260911_add_passkeys"
down_revision = "20260911_google_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("admin_users")}
    for column in (
        sa.Column("passkey_credential_id", sa.String(length=512), nullable=True),
        sa.Column("passkey_public_key", sa.String(length=2048), nullable=True),
        sa.Column("passkey_sign_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("passkey_transports", sa.String(length=128), nullable=True),
    ):
        if column.name not in columns:
            op.add_column("admin_users", column)

    index_names = {index["name"] for index in inspector.get_indexes("admin_users")}
    if "ix_admin_users_passkey_credential_id" not in index_names:
        op.create_index("ix_admin_users_passkey_credential_id", "admin_users", ["passkey_credential_id"], unique=True)

    if not inspector.has_table("passkey_challenges"):
        op.create_table(
            "passkey_challenges",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("challenge", sa.String(length=512), nullable=False),
            sa.Column("user_id", sa.String(length=64), nullable=True),
            sa.Column("purpose", sa.String(length=32), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_passkey_challenges_challenge", "passkey_challenges", ["challenge"], unique=True)
        op.create_index("ix_passkey_challenges_user_id", "passkey_challenges", ["user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("passkey_challenges"):
        index_names = {index["name"] for index in inspector.get_indexes("passkey_challenges")}
        for index_name in ("ix_passkey_challenges_user_id", "ix_passkey_challenges_challenge"):
            if index_name in index_names:
                op.drop_index(index_name, table_name="passkey_challenges")
        op.drop_table("passkey_challenges")
    index_names = {index["name"] for index in inspector.get_indexes("admin_users")}
    if "ix_admin_users_passkey_credential_id" in index_names:
        op.drop_index("ix_admin_users_passkey_credential_id", table_name="admin_users")
    columns = {column["name"] for column in inspector.get_columns("admin_users")}
    for column_name in ("passkey_transports", "passkey_sign_count", "passkey_public_key", "passkey_credential_id"):
        if column_name in columns:
            op.drop_column("admin_users", column_name)
