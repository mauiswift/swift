from unittest.mock import AsyncMock

import pytest

from routers.team_invitations import _is_active_vip_gold


@pytest.mark.asyncio
async def test_active_vip_gold_is_allowed_downline_access():
    db = AsyncMock()
    db.scalar.return_value = 1

    assert await _is_active_vip_gold("vip-user", db) is True


@pytest.mark.asyncio
async def test_non_vip_or_inactive_user_is_not_allowed_downline_access():
    db = AsyncMock()
    db.scalar.return_value = None

    assert await _is_active_vip_gold("standard-user", db) is False
