from schemas.auth import UserPermissions


def test_freeze_and_unfreeze_permissions_are_independent():
    permissions = UserPermissions(can_freeze_wallet=True, can_unfreeze_wallet=False)

    assert permissions.can_freeze_wallet is True
    assert permissions.can_unfreeze_wallet is False
