from routers.admin_users import _apply_super_admin_permissions


def test_demoting_co_super_admin_removes_super_admin_role_only():
    values = {
        "is_super_admin": False,
        "role": "super_admin",
        "can_manage_payments": True,
        "can_manage_team": True,
    }

    result = _apply_super_admin_permissions(values)

    assert result["role"] == "admin"
    assert result["is_super_admin"] is False
    assert result["can_manage_payments"] is True
    assert result["can_manage_team"] is True
