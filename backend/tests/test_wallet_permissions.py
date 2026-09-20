from schemas.auth import UserPermissions


def test_credit_and_debit_permissions_are_independent():
    permissions = UserPermissions(can_credit_wallet=True, can_debit_wallet=False)

    assert permissions.can_credit_wallet is True
    assert permissions.can_debit_wallet is False
