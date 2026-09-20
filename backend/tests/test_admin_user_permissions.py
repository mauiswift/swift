from routers.admin_users import SUPER_ADMIN_PERMISSION_FIELDS, _apply_super_admin_permissions


def test_promoting_to_super_admin_grants_all_admin_permissions():
    values = {
        "is_super_admin": True,
        **{field: False for field in SUPER_ADMIN_PERMISSION_FIELDS},
    }

    result = _apply_super_admin_permissions(values)

    assert result["role"] == "super_admin"
    assert all(result[field] is True for field in SUPER_ADMIN_PERMISSION_FIELDS)


def test_regular_admin_permissions_remain_explicit():
    values = {
        "is_super_admin": False,
        "can_manage_payments": True,
        "can_manage_team": False,
    }

    result = _apply_super_admin_permissions(values)

    assert result == values
