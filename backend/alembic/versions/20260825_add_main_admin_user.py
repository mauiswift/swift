"""Add main admin user (one-off data migration)

Revision ID: 20260825_add_main_admin_user
Revises: 
Create Date: 2026-08-25 16:37:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '20260825_add_main_admin_user'
down_revision = None
branch_labels = None
dependencies = None


def upgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name

    # Admin user details
    email = 'admin@drl-softechs.dev'
    telegram_id = 'admin@drl-softechs.dev'
    name = 'Main Admin'
    password_hash = '$2b$12$6.9xh6PIqkYaAhogMtn6vOCfPdA8lLDDEbhd4NhfRLaQwiiwyAYdm'  # bcrypt hash of provided password

    if dialect == 'postgresql':
        stmt = text(
            """
            INSERT INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at)
            VALUES (:telegram_id, NULL, :name, :email, :password_hash, true, true, now(), now())
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                is_super_admin = true,
                is_active = true,
                name = EXCLUDED.name,
                updated_at = now();
            """
        )
        conn.execute(stmt, dict(telegram_id=telegram_id, name=name, email=email, password_hash=password_hash))
    elif dialect == 'sqlite':
        # SQLite: ensure the admin_users table has an 'email' column before inserting.
        try:
            # Query table info for admin_users; row[1] is column name
            info = conn.execute(text("PRAGMA table_info('admin_users')")).fetchall()
            col_names = [row[1] for row in info]
        except Exception:
            col_names = []

        if 'email' not in col_names:
            # Add the column if missing (SQLite supports simple ALTER TABLE ADD COLUMN)
            try:
                conn.execute(text("ALTER TABLE admin_users ADD COLUMN email TEXT"))
            except Exception:
                # If the table itself does not exist yet, skip adding column — insertion below will create row after table is created
                pass

        # Use INSERT OR IGNORE followed by UPDATE to avoid replacing the row id
        insert_stmt = text(
            "INSERT OR IGNORE INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at) "
            "VALUES (:telegram_id, NULL, :name, :email, :password_hash, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
        )
        conn.execute(insert_stmt, dict(telegram_id=telegram_id, name=name, email=email, password_hash=password_hash))
        update_stmt = text(
            "UPDATE admin_users SET password_hash = :password_hash, is_super_admin = 1, is_active = 1, name = :name, updated_at = CURRENT_TIMESTAMP WHERE email = :email;"
        )
        conn.execute(update_stmt, dict(password_hash=password_hash, name=name, email=email))
    else:
        # Generic SQL: try UPSERT via standard SQL if supported, otherwise fall back to insert-or-update pattern
        try:
            stmt = text(
                "INSERT INTO admin_users (telegram_id, telegram_username, name, email, password_hash, is_active, is_super_admin, created_at, updated_at) "
                "VALUES (:telegram_id, NULL, :name, :email, :password_hash, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
            conn.execute(stmt, dict(telegram_id=telegram_id, name=name, email=email, password_hash=password_hash))
        except Exception:
            # Last resort: attempt an update
            upd = text(
                "UPDATE admin_users SET password_hash = :password_hash, is_super_admin = 1, is_active = 1, name = :name, updated_at = CURRENT_TIMESTAMP WHERE email = :email;"
            )
            conn.execute(upd, dict(password_hash=password_hash, name=name, email=email))


def downgrade():
    conn = op.get_bind()
    stmt = text("DELETE FROM admin_users WHERE email = :email")
    conn.execute(stmt, dict(email='admin@drl-softechs.dev'))
