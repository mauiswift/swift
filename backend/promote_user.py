import asyncio
import logging
from sqlalchemy import select
from core.database import db_manager
from models.admin_users import AdminUser
from models.auth import User
from services.auth import _get_platform_organization

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def promote():
    user_id = "8135505065"

    await db_manager.init_db()
    async with db_manager.async_session_maker() as db:
        # 1. Ensure User record exists
        res_u = await db.execute(select(User).where(User.id == user_id))
        user = res_u.scalar_one_or_none()
        if not user:
            logger.info("Creating User record...")
            user = User(id=user_id, email=f"{user_id}@telegram.bot", name="TG User", role="admin")
            db.add(user)
        else:
            user.role = "admin"

        # 2. Ensure AdminUser record exists
        res_a = await db.execute(select(AdminUser).where(AdminUser.telegram_id == user_id))
        admin = res_a.scalar_one_or_none()
        if not admin:
            logger.info("Creating AdminUser record...")
            platform_org_id, platform_org_name = _get_platform_organization()
            admin = AdminUser(
                telegram_id=user_id,
                name="TG Admin",
                is_active=True,
                is_super_admin=True,
                can_manage_payments=True,
                can_manage_disbursements=True,
                can_view_reports=True,
                can_manage_wallet=True,
                can_manage_transactions=True,
                can_manage_bot=True,
                can_approve_topups=True,
                organization_id=platform_org_id,
                organization_name=platform_org_name,
                added_by="manual"
            )
            db.add(admin)
        else:
            logger.info("Updating AdminUser record...")
            platform_org_id, platform_org_name = _get_platform_organization()
            admin.is_active = True
            admin.is_super_admin = True
            admin.can_manage_payments = True
            admin.can_manage_disbursements = True
            admin.can_view_reports = True
            admin.can_manage_wallet = True
            admin.can_manage_transactions = True
            admin.can_manage_bot = True
            admin.can_approve_topups = True
            admin.organization_id = platform_org_id
            admin.organization_name = platform_org_name

        await db.commit()
        logger.info(f"User {user_id} promoted to Super Admin successfully.")

    await db_manager.close_db()

if __name__ == "__main__":
    asyncio.run(promote())
