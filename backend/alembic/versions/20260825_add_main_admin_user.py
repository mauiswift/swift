"""Add main admin user (one-off data migration)

Revision ID: 20260825_add_main_admin_user
Revises: f3b4c5d6e7f8
Create Date: 2026-08-25 16:37:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '20260825_add_main_admin_user'
down_revision = 'f3b4c5d6e7f8'
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
        params = dict(telegram_id=telegram_id, name=name, email=email, password_hash=password_hash)
        update_stmt = text(
            """
            UPDATE admin_users
            SET password_hash = :password_hash,
                is_super_admin = true,
                is_active = true,
                name = :name,
                updated_at = now()
            WHERE email = :email
            """
        )
        update_result = conn.execute(update_stmt, params)
        if update_result.rowcount == 0:
            insert_stmt = text(
                """
                INSERT INTO admin_users
                    (telegram_id, telegram_username, name, email, password_hash,
                     is_active, is_super_admin, created_at, updated_at)
                VALUES
                    (:telegram_id, NULL, :name, :email, :password_hash,
                     true, true, now(), now())
                """
            )
            conn.execute(insert_stmt, params)
    elif dialect == 'sqlite':
        # SQLite: ensure the admin_users table has a 'password_hash' column before inserting.
        try:
            # Query table info for admin_users; row[1] is column name
            info = conn.execute(text("PRAGMA table_info('admin_users')")).fetchall()
            col_names = [row[1] for row in info]
        except Exception:
            col_names = []

        # Add password_hash column if missing
        if 'password_hash' not in col_names:
            try:
                conn.execute(text("ALTER TABLE admin_users ADD COLUMN password_hash TEXT"))
            except Exception:
                pass

        # Add email column if missing
        if 'email' not in col_names:
            try:
                conn.execute(text("ALTER TABLE admin_users ADD COLUMN email TEXT"))
            except Exception:
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
    """
    IMPORTANT: This is a data migration that creates production admin users.
    
    Do NOT delete user data on downgrade. This migration is idempotent and safe to re-run.
    If a rollback is needed, it should be handled manually to prevent accidental data loss.
    
    This approach ensures that:
    - Users are never deleted on deployment rollbacks
    - The migration is safe to re-apply without side effects
    - Production data integrity is maintained
    """
    pass
