"""Alembic revision: set main admin user's password_hash and create admin row if missing

This migration sets the main admin user's password_hash using the
value provided in the MAIN_ADMIN_PASSWORD_HASH environment variable. If the
admin row (matched by telegram_id or email) does not exist, it will be
created with sensible defaults (is_active and is_super_admin set to true),
but only if there is currently no super-admin in the database — this prevents
accidentally adding a second super-admin.

Usage:
  MAIN_ADMIN_PASSWORD_HASH="$2b$12$..." alembic upgrade head

Behavior:
- Requires that the admin_users table and password_hash column already exist.
- Inserts the admin row when missing only if no existing row has is_super_admin = true.
- Then updates the password_hash for the target identity (telegram_id or email).
- Works with both PostgreSQL and SQLite.
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
    if "email" not in cols:
        op.add_column("admin_users", sa.Column("email", sa.String(length=256), nullable=True))
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

    # Target admin identity (keeps current values as requested)
    # Telegram IDs are stored as strings in the schema. Keeping this value as
    # text is required by asyncpg/PostgreSQL parameter typing.
    telegram_id = "7851923260"
    name = "在"
    email = "admin@swiftpay.site"

    dialect = bind.dialect.name

    # Check for existing super-admin: if one exists, we will NOT insert a new super-admin.
    if dialect == "postgresql":
        super_stmt = text("SELECT 1 FROM admin_users WHERE is_super_admin = true LIMIT 1")
    else:
        # SQLite and others use 1 for true
        super_stmt = text("SELECT 1 FROM admin_users WHERE is_super_admin = 1 LIMIT 1")

    try:
        has_super = bind.execute(super_stmt).fetchone() is not None
    except Exception:
        # If the column doesn't exist or query fails, be conservative and treat as having a super-admin
        has_super = True

    allow_insert = not has_super

    # 1) Ensure the admin row exists. Insert if missing AND allowed.
    if allow_insert:
        if dialect == "postgresql":
            insert_stmt = text(
                "INSERT INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at) "
                "VALUES (:telegram_id, NULL, :name, :email, :pw, true, true, now(), now()) "
                "ON CONFLICT (email) DO NOTHING"
            )
            try:
                bind.execute(insert_stmt, {"telegram_id": telegram_id, "name": name, "email": email, "pw": pw})
            except Exception:
                bind.execute(
                    text(
                        "INSERT INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at) "
                        "VALUES (:telegram_id, NULL, :name, :email, :pw, true, true, now(), now())"
                    ),
                    {"telegram_id": telegram_id, "name": name, "email": email, "pw": pw},
                )
        else:
            try:
                bind.execute(
                    text(
                        "INSERT OR IGNORE INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at) "
                        "VALUES (:telegram_id, NULL, :name, :email, :pw, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
                    ),
                    {"telegram_id": telegram_id, "name": name, "email": email, "pw": pw},
                )
            except Exception:
                info = bind.execute(text("PRAGMA table_info('admin_users')")).fetchall()
                col_names = [r[1] for r in info]
                if "email" not in col_names:
                    try:
                        bind.execute(text("ALTER TABLE admin_users ADD COLUMN email TEXT"))
                    except Exception:
                        pass
                bind.execute(
                    text(
                        "INSERT INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at) "
                        "VALUES (:telegram_id, NULL, :name, :email, :pw, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
                    ),
                    {"telegram_id": telegram_id, "name": name, "email": email, "pw": pw},
                )

    # 2) Ensure password_hash is set for the admin row(s) (update existing or just-inserted rows)
    update_result = bind.execute(
        text(
            "UPDATE admin_users SET password_hash = :pw, is_active = 1, is_super_admin = 1, name = :name "
            "WHERE telegram_id = :telegram_id OR email = :email"
        ),
        {"pw": pw, "telegram_id": telegram_id, "email": email, "name": name},
    )

    # Verify at least one row matched (some DBAPIs don't provide rowcount reliably)
    rowcount = None
    try:
        rowcount = update_result.rowcount
    except Exception:
        pass

    if not rowcount or rowcount == 0:
        found = bind.execute(
            text("SELECT 1 FROM admin_users WHERE telegram_id = :telegram_id OR email = :email LIMIT 1"),
            {"telegram_id": telegram_id, "email": email},
        ).fetchone()
        if not found:
            # If we did not insert because a super-admin exists, surface a helpful error explaining why no row was created.
            if not allow_insert:
                raise RuntimeError(
                    "No admin user matching the target identity was found, and the database already contains a super-admin so a new super-admin will not be created.\n"
                    "If you want to update an existing admin, ensure the target telegram_id or email is correct, or temporarily remove the existing super-admin flag to allow insertion."
                )
            raise RuntimeError(
                "Failed to insert or update the admin user. No admin user exists with the provided telegram_id or email after attempted insert."
            )


def downgrade():
    # We cannot (safely) revert a password to a previous value because we don't
    # know the prior hash. Downgrade is therefore a no-op to avoid accidental lockout.
    return
