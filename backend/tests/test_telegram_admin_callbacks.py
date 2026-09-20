"""Regression tests for Telegram admin approval callback routing."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from routers.telegram_admin_callbacks import (
    TelegramCallbackUpdate,
    handle_topup_callback,
    handle_withdrawal_callback,
)


def _update(callback_data: str) -> TelegramCallbackUpdate:
    return TelegramCallbackUpdate(
        update_id=1,
        callback_query={"id": "callback-1", "data": callback_data},
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("action", ["approve_topup", "reject_topup"])
async def test_topup_callback_uses_real_approval_processor(action):
    processor_result = {"ok": True}
    db = MagicMock()
    with patch(
        "routers.telegram_admin_callbacks.process_approval_callback",
        new=AsyncMock(return_value=processor_result),
    ) as processor:
        result = await handle_topup_callback(_update(f"{action}:123"), db)

    assert result == processor_result
    processor.assert_awaited_once_with(
        {"id": "callback-1", "data": f"{action}:123"},
        db,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("action", ["approve_withdrawal", "reject_withdrawal"])
async def test_withdrawal_callback_uses_real_approval_processor(action):
    processor_result = {"ok": True}
    db = MagicMock()
    with patch(
        "routers.telegram_admin_callbacks.process_approval_callback",
        new=AsyncMock(return_value=processor_result),
    ) as processor:
        result = await handle_withdrawal_callback(_update(f"{action}:456"), db)

    assert result == processor_result
    processor.assert_awaited_once_with(
        {"id": "callback-1", "data": f"{action}:456"},
        db,
    )


@pytest.mark.asyncio
async def test_dedicated_approval_callbacks_reject_unrecognized_actions():
    db = MagicMock()

    with patch(
        "routers.telegram_admin_callbacks.process_approval_callback",
        new=AsyncMock(),
    ) as processor:
        topup_result = await handle_topup_callback(_update("approve_payment:123"), db)
        withdrawal_result = await handle_withdrawal_callback(
            _update("approve_topup:123"),
            db,
        )

    assert topup_result == {
        "ok": False,
        "error": "Unknown topup approval action",
    }
    assert withdrawal_result == {
        "ok": False,
        "error": "Unknown withdrawal approval action",
    }
    processor.assert_not_awaited()
