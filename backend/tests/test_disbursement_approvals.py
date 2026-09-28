from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import HTTPException

from models.disbursements import Disbursements
from routers.disbursements import (
    DisbursementsData,
    cancel_disbursements,
    create_disbursement_request,
)


@pytest.mark.asyncio
async def test_entity_disbursement_creation_reserves_funds_and_notifies_admins():
    data = DisbursementsData(
        external_id="admin-review-123",
        amount=500,
        currency="PHP",
        bank_code="BDO",
        account_number="1234567890",
        account_name="Test Merchant",
        recipient_phone="+639171234567",
    )
    row = Disbursements(
        id=123,
        user_id="merchant-1",
        external_id="admin-review-123",
        amount=500,
        currency="PHP",
        bank_code="BNOR",
        account_number="1234567890",
        account_name="Test Merchant",
        recipient_phone="+63-91-712-34567",
        status="processing",
    )
    db = AsyncMock()
    db.scalar.return_value = row
    current_user = Mock(id="merchant-1", name="Merchant", permissions=Mock())
    wallet_service = Mock()
    wallet_service.withdraw_request = AsyncMock(
        return_value={"success": True, "reference_id": "admin-review-123"}
    )

    with patch("routers.disbursements.WalletsService", return_value=wallet_service), patch(
        "routers.disbursements.AdminNotificationService.notify_super_admins",
        new=AsyncMock(return_value=[]),
    ) as notify_admins:
        result = await create_disbursement_request(data, current_user, db)

    assert result is row
    wallet_service.withdraw_request.assert_awaited_once_with(
        user_id="merchant-1",
        amount=500,
        bank_name="BDO",
        bank_code="BNOR",
        account_number="1234567890",
        account_name="Test Merchant",
        recipient_phone="+63-91-712-34567",
        note="Disbursement request",
        currency="PHP",
        external_reference="admin-review-123",
    )
    notify_admins.assert_awaited_once()


@pytest.mark.asyncio
async def test_cancel_disbursement_cannot_refund_twice():
    disbursement = Disbursements(
        id=124,
        user_id="merchant-1",
        external_id="cancel-once-124",
        amount=500,
        processing_fee=15,
        currency="PHP",
        status="processing",
        description="Bank transfer",
    )
    result = Mock()
    result.scalar_one_or_none.return_value = disbursement
    db = AsyncMock()
    db.execute.return_value = result
    user = Mock(id="merchant-1", permissions=None)
    wallet_service = Mock()
    wallet_service.refund_wallet_debit = AsyncMock()

    with patch("services.wallets.WalletsService", return_value=wallet_service):
        canceled = await cancel_disbursements(124, user, db)
        assert canceled is disbursement

        with pytest.raises(HTTPException) as error:
            await cancel_disbursements(124, user, db)

    assert error.value.status_code == 400
    wallet_service.refund_wallet_debit.assert_awaited_once_with(
        "merchant-1",
        515,
        "PHP",
        "cancel-once-124-refund",
        "Withdrawal refund: Bank transfer",
    )
