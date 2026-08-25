#!/usr/bin/env python3
import asyncio
import logging

from core.config import settings
from core.auth import hash_password
from core.database import db_manager
from models.admin_users import AdminUser
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EMAIL = "admin@drl-softechs.dev"
PASSWORD = "#Sirden1216"
TELEGRAM_ID = EMAIL  # Use email as telegram_id placeholder for web admin
NAME = "Main Admin"


async def main():
    logger.info("Initializing database connection using DATABASE_URL=%s", settings.database_url)
    await db_manager.ensure_initialized()

    async with db_manager.async_session_maker() as session:
        # Ensure tables exist
        await db_manager.create_tables()

        # Check for existing admin by email
        res = await session.execute(select(AdminUser).where(AdminUser.email == EMAIL))
        existing = res.scalars().first()
        hashed = hash_password(PASSWORD)

        if existing:
            logger.info("Admin with email %s already exists (id=%s) — updating password and granting super-admin.", EMAIL, existing.id)
            existing.password_hash = hashed
            existing.is_super_admin = True
            existing.is_active = True
            existing.name = NAME
            existing.telegram_id = existing.telegram_id or TELEGRAM_ID
            session.add(existing)
            await session.commit()
            await session.refresh(existing)
            logger.info("Updated admin id=%s", existing.id)
            print(existing.id)
            return

        admin = AdminUser(
            telegram_id=TELEGRAM_ID,
            telegram_username=None,
            name=NAME,
            email=EMAIL,
            password_hash=hashed,
            is_active=True,
            is_super_admin=True,
        )
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        logger.info("Created admin user id=%s email=%s", admin.id, admin.email)
        print(admin.id)


if __name__ == "__main__":
    asyncio.run(main())
