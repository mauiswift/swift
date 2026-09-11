"""add passkey credentials and challenges

Revision ID: 20260911_add_passkeys
"""

from alembic import op
import sqlalchemy as sa


revision = "20260911_add_passkeys"
down_revision = "20260911_google_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("passkey_credential_id", sa.String(length=512), nullable=True))
    op.add_column("admin_users", sa.Column("passkey_public_key", sa.String(length=2048), nullable=True))
    op.add_column("admin_users", sa.Column("passkey_sign_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("admin_users", sa.Column("passkey_transports", sa.String(length=128), nullable=True))
    op.create_index("ix_admin_users_passkey_credential_id", "admin_users", ["passkey_credential_id"], unique=True)
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
    op.drop_index("ix_passkey_challenges_user_id", table_name="passkey_challenges")
    op.drop_index("ix_passkey_challenges_challenge", table_name="passkey_challenges")
    op.drop_table("passkey_challenges")
    op.drop_index("ix_admin_users_passkey_credential_id", table_name="admin_users")
    op.drop_column("admin_users", "passkey_transports")
    op.drop_column("admin_users", "passkey_sign_count")
    op.drop_column("admin_users", "passkey_public_key")
    op.drop_column("admin_users", "passkey_credential_id")
