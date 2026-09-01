"""Alembic revision: set main admin user's password_hash from environment

This migration updates the existing main admin user's password_hash using the
value provided in the MAIN_ADMIN_PASSWORD_HASH environment variable. This avoids
committing plaintext or hashed passwords into source control.

Usage:
  MAIN_ADMIN_PASSWORD_HASH="$2b$12$..." alembic upgrade head

Behavior:
- Requires that the admin_users table and password_hash column already exist.
- Updates the admin row that matches telegram_id=7851923260 or email=admin@swiftpay.site.
- If no matching admin row exists, the migration fails with a clear error.
- If MAIN_ADMIN_PASSWORD_HASH is not set, the migration raises an error to
  avoid accidental application with an empty password.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text, inspect
import os

# revision identifiers, used by Alembic.
revision = "20260901_set_main_admin_password"
down_revision = "20260901_add_password_hash_admin_users"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)

    if "admin_users" not in inspector.get_table_names():
        raise RuntimeError("admin_users table not found; ensure prior migrations were applied")

    cols = [c["name"] for c in inspector.get_columns("admin_users")]
    if "password_hash" not in cols:
        raise RuntimeError("password_hash column not found on admin_users; run the schema migration first")

    pw = os.environ.get("MAIN_ADMIN_PASSWORD_HASH")
    if not pw:
        raise RuntimeError(
            "MAIN_ADMIN_PASSWORD_HASH environment variable is not set.\n"
            "Set MAIN_ADMIN_PASSWORD_HASH to the desired bcrypt (or app) password hash before running this migration.\n"
            "Example: MAIN_ADMIN_PASSWORD_HASH=\"$2b$12$...\" alembic upgrade head"
        )

    telegram_id = 7851923260
    email = "admin@swiftpay.site"

    # Update by telegram_id or email
    result = bind.execute(
        text(
            "UPDATE admin_users SET password_hash = :pw WHERE telegram_id = :telegram_id OR email = :email"
        ),
        {"pw": pw, "telegram_id": telegram_id, "email": email},
    )

    # SQLAlchemy's Result.rowcount may be -1 on some DBAPIs; use a follow-up select to confirm.
    try:
        updated = result.rowcount
    except Exception:
        updated = None

    if not updated or updated == 0:
        # Attempt to detect presence using SELECT
        found = bind.execute(
            text("SELECT 1 FROM admin_users WHERE telegram_id = :telegram_id OR email = :email LIMIT 1"),
            {"telegram_id": telegram_id, "email": email},
        ).fetchone()
        if not found:
            raise RuntimeError(
                "No admin user found with telegram_id=7851923260 or email=admin@swiftpay.site.\n"
                "Ensure the admin row exists before running this migration, or create it with a separate migration."
            )


def downgrade():
    # We cannot (safely) revert a password to a previous value because we don't
    # know the prior hash. Downgrade is therefore a no-op to avoid accidental lockout.
    return
