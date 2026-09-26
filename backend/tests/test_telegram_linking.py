from routers.auth import _is_linked_telegram_account


def test_real_telegram_ids_are_treated_as_linked():
    assert _is_linked_telegram_account("123456789") is True
    assert _is_linked_telegram_account(" 987654321 ") is True


def test_placeholder_and_blank_ids_are_not_linked():
    assert _is_linked_telegram_account(None) is False
    assert _is_linked_telegram_account("") is False
    assert _is_linked_telegram_account("web-abc123") is False
