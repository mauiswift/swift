"""
System Roles Initialization

Seed the built-in predefined roles as system (is_system=True) templates in the
custom_roles table. These roles have locked permission combinations and cannot
be deleted or have their permission flags changed via the admin CRUD APIs.

This module is safe to call multiple times (idempotent upserts by name).
"""
from typing import Dict
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.roles import PREDEFINED_ROLES
from models.custom_roles import CustomRole
from core.database import db_manager

logger = logging.getLogger(__name__)


async def initialize_system_roles():
    """Ensure predefined roles exist in the custom_roles table.

    This function is idempotent and safe to call on every startup.
    """
    if not db_manager.async_session_maker:
        logger.warning("Database session maker not initialized, skipping system role seeding")
        return

    async with db_manager.async_session_maker() as db:  # type: AsyncSession
        for role_enum, perms in PREDEFINED_ROLES.items():
            name = role_enum.value
            # Map only the permission fields that exist on CustomRole
            role_fields: Dict[str, bool] = {
                "is_super_admin": perms.get("is_super_admin", False),
                "can_manage_payments": perms.get("can_manage_payments", False),
                "can_manage_disbursements": perms.get("can_manage_disbursements", False),
                "can_view_reports": perms.get("can_view_reports", False),
                "can_manage_wallet": perms.get("can_manage_wallet", False),
                "can_manage_transactions": perms.get("can_manage_transactions", False),
                "can_manage_bot": perms.get("can_manage_bot", False),
                "can_approve_topups": perms.get("can_approve_topups", False),
                "can_manage_team": perms.get("can_manage_team", False),
                "can_credit_wallet": perms.get("can_credit_wallet", False),
                "can_debit_wallet": perms.get("can_debit_wallet", False),
                "can_freeze_wallet": perms.get("can_freeze_wallet", False),
                "can_unfreeze_wallet": perms.get("can_unfreeze_wallet", False),
            }

            # Upsert by name
            result = await db.execute(select(CustomRole).where(CustomRole.name == name))
            existing = result.scalar_one_or_none()

            if existing:
                # Ensure it is marked as system and permissions match the locked configuration
                changed = False
                if not existing.is_system:
                    existing.is_system = True
                    changed = True
                for k, v in role_fields.items():
                    if getattr(existing, k, None) != v:
                        setattr(existing, k, v)
                        changed = True
                if changed:
                    logger.info("Updating system role '%s' to locked configuration", name)
                    await db.commit()
                else:
                    # nothing to do
                    await db.refresh(existing)
            else:
                # Create new system role
                new_role = CustomRole(
                    name=name,
                    description=f"Built-in role: {name}",
                    color="blue",
                    is_system=True,
                    created_by="system",
                    **role_fields,
                )
                db.add(new_role)
                await db.commit()
                logger.info("Created system role '%s'", name)
    logger.info("System roles seeding complete")
