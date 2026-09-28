import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from models.wallets import Wallets
from routers.merchant_api import ApiConfigUpdate, get_merchant_api_config, update_merchant_api_config
from schemas.auth import UserPermissions, UserResponse
from services.wallets import WalletsService


def _merchant_user(user_id: str, role: str, *, can_edit_profile: bool = True) -> UserResponse:
    return UserResponse(
        id=user_id,
        email=f"{user_id}@example.test",
        role=role,
        organization_id="merchant-org",
        organization_name="Shared Merchant",
        permissions=UserPermissions(
            can_manage_wallet=True,
            can_manage_team=can_edit_profile,
        ),
    )


@pytest.mark.asyncio
async def test_team_members_share_wallet_and_store_profile_but_keep_member_api_keys():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    tables = [AdminUser.__table__, MerchantApiConfig.__table__, Wallets.__table__]
    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: AdminUser.metadata.create_all(sync_connection, tables=tables)
        )

    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as db:
            db.add_all([
                AdminUser(
                    telegram_id="merchant-owner",
                    email="merchant-owner@example.test",
                    role="owner",
                    organization_id="merchant-org",
                    organization_name="Shared Merchant",
                    is_active=True,
                ),
                AdminUser(
                    telegram_id="merchant-member",
                    email="merchant-member@example.test",
                    role="viewer",
                    organization_id="merchant-org",
                    organization_name="Shared Merchant",
                    is_active=True,
                ),
                MerchantApiConfig(
                    organization_id="merchant-org",
                    user_id="merchant-owner",
                    store_name="Shared Merchant",
                    store_logo_url="/logos/original.png",
                    permanent_link_slug="shared-merchant",
                    test_access_key="OWNER_TEST_KEY",
                ),
                MerchantApiConfig(
                    organization_id="merchant-org",
                    user_id="merchant-member",
                    store_name="Member-only name",
                    store_logo_url="/logos/member.png",
                    permanent_link_slug="member-store",
                    test_access_key="MEMBER_TEST_KEY",
                ),
                Wallets(
                    user_id="org:merchant-org",
                    organization_id="merchant-org",
                    currency="PHP",
                    balance=120,
                    available_balance=100,
                    pending_balance=20,
                ),
            ])
            await db.flush()

            owner_profile = await get_merchant_api_config(_merchant_user("merchant-owner", "owner"), db)
            member_profile = await get_merchant_api_config(_merchant_user("merchant-member", "viewer"), db)

            assert member_profile.store_name == owner_profile.store_name == "Shared Merchant"
            assert member_profile.store_logo_url == owner_profile.store_logo_url == "/logos/original.png"
            assert member_profile.permanent_link_slug == owner_profile.permanent_link_slug == "shared-merchant"
            assert owner_profile.user_id == "merchant-owner"
            assert member_profile.user_id == "merchant-member"
            assert owner_profile.test_access_key == "OWNER_TEST_KEY"
            assert member_profile.test_access_key == "MEMBER_TEST_KEY"

            updated = await update_merchant_api_config(
                ApiConfigUpdate(store_name="Updated Merchant", store_logo_url="/logos/updated.png"),
                _merchant_user("merchant-member", "viewer"),
                db,
            )
            owner_after_update = await get_merchant_api_config(_merchant_user("merchant-owner", "owner"), db)

            assert updated.store_name == owner_after_update.store_name == "Updated Merchant"
            assert updated.store_logo_url == owner_after_update.store_logo_url == "/logos/updated.png"
            assert updated.test_access_key == "MEMBER_TEST_KEY"

            with pytest.raises(HTTPException) as error:
                await update_merchant_api_config(
                    ApiConfigUpdate(store_name="Viewer overwrite"),
                    _merchant_user("merchant-viewer", "viewer", can_edit_profile=False),
                    db,
                )
            assert error.value.status_code == 403

            viewer_profile = await get_merchant_api_config(
                _merchant_user("merchant-viewer", "viewer", can_edit_profile=False), db
            )
            assert viewer_profile.store_name == "Updated Merchant"
            shared_profiles = await db.scalars(
                select(MerchantApiConfig).where(
                    MerchantApiConfig.organization_id == "merchant-org",
                    MerchantApiConfig.user_id.is_(None),
                )
            )
            assert len(shared_profiles.all()) == 1

            owner_wallet = await WalletsService(db).get_balance("merchant-owner", "PHP")
            member_wallet = await WalletsService(db).get_balance("merchant-member", "PHP")
            assert owner_wallet["wallet_id"] == member_wallet["wallet_id"]
            assert owner_wallet["balance"] == member_wallet["balance"] == 120
    finally:
        await engine.dispose()