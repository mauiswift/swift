import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.admin_users import AdminUser
from models.team_invitations import TeamInvitation
from models.organizations import Organization, OrganizationMembership
from routers.team_invitations import (
    CompleteInvitationRequest,
    accept_invitation,
    list_team_members,
    _application_permissions,
)
from schemas.auth import UserPermissions, UserResponse


@pytest_asyncio.fixture
async def team_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Organization.__table__.create)
        await connection.run_sync(OrganizationMembership.__table__.create)
        await connection.run_sync(AdminUser.__table__.create)
        await connection.run_sync(TeamInvitation.__table__.create)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_org_team_manager_only_sees_members_of_their_organization(team_db):
    team_db.add_all(
        [
            AdminUser(
                telegram_id="owner-a",
                role="owner",
                organization_id="business-a",
                organization_name="Business A",
                can_manage_team=True,
                is_super_admin=True,
                is_active=True,
            ),
            AdminUser(
                telegram_id="member-a",
                role="manager",
                organization_id="business-a",
                organization_name="Business A",
                is_active=True,
            ),
            AdminUser(
                telegram_id="member-b",
                role="manager",
                organization_id="business-b",
                organization_name="Business B",
                is_active=True,
            ),
        ]
    )
    await team_db.flush()

    result = await list_team_members(
        current_user=UserResponse(
            id="owner-a",
            email="owner-a@example.com",
            organization_id="business-a",
            permissions=UserPermissions(is_super_admin=True, can_manage_team=True),
        ),
        db=team_db,
    )

    assert {member["telegram_id"] for member in result["members"]} == {"owner-a", "member-a"}
    assert {member["organization_id"] for member in result["members"]} == {"business-a"}
    owner = await team_db.scalar(
        select(AdminUser).where(AdminUser.telegram_id == "owner-a")
    )
    assert owner is not None
    assert owner.is_super_admin is False


@pytest.mark.asyncio
async def test_org_team_member_without_team_permission_cannot_list_members(team_db):
    team_db.add(
        AdminUser(
            telegram_id="member-a",
            role="manager",
            organization_id="business-a",
            can_manage_team=False,
        )
    )
    await team_db.flush()

    with pytest.raises(HTTPException) as error:
        await list_team_members(
            current_user=UserResponse(
                id="member-a",
                email="member-a@example.com",
                organization_id="business-a",
                permissions=UserPermissions(),
            ),
            db=team_db,
        )

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_invited_organization_owner_accepts_as_scoped_owner(team_db):
    permissions = _application_permissions("owner")
    team_db.add(
        TeamInvitation(
            email="owner@example.com",
            invitation_token="organization-owner-token",
            role="owner",
            permissions=permissions,
            status="pending",
            invited_by="platform-admin",
            organization_id="business-a",
            organization_name="Business A",
            expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
    )
    await team_db.flush()

    result = await accept_invitation(
        token="organization-owner-token",
        request=CompleteInvitationRequest(
            password="secure-password",
            confirm_password="secure-password",
            full_name="Business Owner",
        ),
        db=team_db,
    )

    account = await team_db.scalar(
        select(AdminUser).where(AdminUser.email == "owner@example.com")
    )
    assert result["success"] is True
    assert account is not None
    assert account.is_super_admin is False
    assert account.organization_id == "business-a"
    assert account.can_manage_team is True
    membership = await team_db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == "business-a",
            OrganizationMembership.user_id == account.telegram_id,
        )
    )
    assert membership is not None
    assert membership.role == "owner"
