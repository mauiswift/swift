#!/usr/bin/env python3
"""
Create or update a dashboard admin user in the application database.

Usage (from repository root, with same environment as the app so DB config is available):

  python scripts/create_admin.py --id admin --email admin@example.com --password "S3cureP@ssw0rd" --super --force

Notes:
- Avoid storing plaintext passwords. Use this script only on a machine with secure access to the DB and environment.
- In production the script requires --force to avoid accidental runs.
"""

import argparse
import asyncio
import os
import sys
from typing import Optional

from sqlalchemy import select

from core.auth import hash_password
from core.database import db_manager

# initialize_database is safe to import and idempotent if DB already exists
try:
    from services.database import initialize_database
except Exception:
    initialize_database = None

# Models
from models.auth import User
from models.admin_users import AdminUser


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Create or update an admin user in the app database")
    p.add_argument("--id", required=True, help="Stable user id / telegram id to use (e.g. 'admin')")
    p.add_argument("--email", required=True, help="Admin email address")
    p.add_argument("--password", required=True, help="Plaintext password to hash and store")
    p.add_argument("--name", default=None, help="Display name for the admin user")
    p.add_argument("--super", action="store_true", help="Mark the admin as super-admin (full rights)")
    p.add_argument("--force", action="store_true", help="Bypass the production safeguard")
    return p.parse_args()


async def main(
    uid: str,
    email: str,
    password: str,
    name: Optional[str],
    is_super: bool,
    force: bool,
) -> None:
    env = (os.getenv("ENVIRONMENT") or os.getenv("environment") or "").lower()
    if env in ("production", "prod", "live") and not force:
        print("Refusing to run in production without --force. Set --force to proceed.")
        sys.exit(2)

    if initialize_database:
        try:
            await initialize_database()
        except Exception as exc:
            print("Failed to initialize database:", exc)
            raise

    if not db_manager.async_session_maker:
        print("Database session maker not available. Ensure DATABASE_URL and app environment are set.")
        sys.exit(3)

    pwd_hash = hash_password(password)

    async with db_manager.async_session_maker() as db:
        # Upsert User
        res = await db.execute(select(User).where(User.id == uid))
        user = res.scalar_one_or_none()
        if not user:
            user = User(id=uid, email=email, name=name or email, role="admin" if is_super else "user")
            db.add(user)
            print(f"Creating User: id={uid} email={email}")
        else:
            user.email = email
            if name:
                user.name = name
            if is_super and user.role != "admin":
                user.role = "admin"
            print(f"Updating User: id={uid}")

        # Upsert AdminUser
        res = await db.execute(select(AdminUser).where(AdminUser.telegram_id == uid))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = AdminUser(
                telegram_id=uid,
                telegram_username=uid,
                name=name or email,
                email=email,
                password_hash=pwd_hash,
                is_active=True,
                is_super_admin=is_super,
                added_by="script",
            )
            db.add(admin)
            print(f"Creating AdminUser: telegram_id={uid} email={email} super={is_super}")
        else:
            admin.email = email
            admin.name = name or admin.name
            admin.password_hash = pwd_hash
            admin.is_super_admin = is_super
            admin.is_active = True
            print(f"Updating AdminUser: telegram_id={uid} (super={is_super})")

        await db.commit()

    print("Done. Admin user is created/updated. Please delete or rotate the plaintext password used to run this script.")


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(main(args.id, args.email, args.password, args.name, args.super, args.force))
