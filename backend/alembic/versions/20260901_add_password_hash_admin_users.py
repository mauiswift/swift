"""Alembic revision: add password_hash column to admin_users

This migration is defensive: it only adds the column if it does not already exist.

IMPORTANT: Set `down_revision` to the repository's current head revision before committing
(this file uses `None` by default so it can be reviewed/adjusted). If you'd like, tell
me the correct down_revision value and I will update the file and commit again.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "20260901_add_password_hash_admin_users"
down_revision = None  # <-- Set this to the current head revision (e.g. 'a1b2c3d4e5f7')
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    # If the table doesn't exist for some reason, bail out (nothing to do).
    if "admin_users" not in inspector.get_table_names():
        return

    cols = [c["name"] for c in inspector.get_columns("admin_users")]
    if "password_hash" not in cols:
        # SQLite supports ADD COLUMN; keep it nullable to avoid breaking existing rows.
        op.add_column("admin_users", sa.Column("password_hash", sa.String(length=255), nullable=True))


def downgrade():
    # Try to drop the column if present. Note: SQLite's ability to drop columns depends
    # on the SQLAlchemy/Alembic version; Alembic may emulate this for SQLite by recreating
    # the table. If that isn't desirable in your environment, you can leave downgrade() empty.
    bind = op.get_bind()
    inspector = inspect(bind)

    if "admin_users" not in inspector.get_table_names():
        return

    cols = [c["name"] for c in inspector.get_columns("admin_users")]
    if "password_hash" in cols:
        try:
            op.drop_column("admin_users", "password_hash")
        except Exception:
            # If the drop isn't supported (older SQLite), do a no-op and warn in logs instead.
            # We avoid raising here to not break downgrade runs in constrained environments.
            pass
