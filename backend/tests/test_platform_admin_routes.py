import pytest
from fastapi import HTTPException

from dependencies.auth import get_super_admin_user
from routers import settings, storage
from schemas.auth import UserPermissions, UserResponse


def _user(*, is_super_admin: bool) -> UserResponse:
    return UserResponse(
        id="platform-admin" if is_super_admin else "merchant-admin",
        email="admin@example.test",
        role="admin",
        permissions=UserPermissions(is_super_admin=is_super_admin),
    )


@pytest.mark.asyncio
async def test_super_admin_dependency_rejects_merchant_admin():
    with pytest.raises(HTTPException) as error:
        await get_super_admin_user(_user(is_super_admin=False))

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_super_admin_dependency_accepts_platform_admin():
    user = _user(is_super_admin=True)

    assert await get_super_admin_user(user) is user


@pytest.mark.parametrize("router", [settings.router, storage.router])
def test_all_settings_and_storage_routes_require_super_admin(router):
    assert router.routes
    for route in router.routes:
        assert any(
            dependency.call is get_super_admin_user
            for dependency in route.dependant.dependencies
        ), f"{route.path} is missing the super-admin dependency"
