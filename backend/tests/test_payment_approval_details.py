from datetime import datetime, timezone

import pytest

from models.transactions import Transactions
from routers.payment_approvals import (
    _swiftpay_payment_details,
    get_payment_approval_details,
)
from schemas.auth import UserPermissions, UserResponse


def test_swiftpay_payment_details_extracts_transfer_accounts_from_nested_data():
    details = _swiftpay_payment_details(
        {
            "data": {
                "paymentStatus": "EXECUTED",
                "payer": {
                    "payerName": "Sample Sender",
                    "payerBank": "Example Bank",
                    "payerAccountNumber": "1234567890",
                },
                "merchant": {
                    "merchantCreditAccountName": "SwiftPay",
                    "merchantCreditAccountNumber": "0987654321",
                    "merchantCreditBankName": "Destination Bank",
                },
                "institution_reference_no": "inst-ref-1",
                "channel_reference_no": "channel-ref-1",
            }
        }
    )

    assert details == {
        "sender_name": "Sample Sender",
        "sender_bank": "Example Bank",
        "sender_account_number": "1234567890",
        "receiver_bank": "Destination Bank",
        "receiver_account_name": "SwiftPay",
        "receiver_account_number": "0987654321",
        "institution_reference_no": "inst-ref-1",
        "channel_reference_no": "channel-ref-1",
        "provider_status": "EXECUTED",
    }


@pytest.mark.asyncio
async def test_payment_approval_details_fetches_swiftpay_and_uses_saved_fallbacks(monkeypatch):
    txn = Transactions(
        id=42,
        user_id="merchant-1",
        transaction_type="payment_link",
        external_id="PUBLIC-PAY-42",
        xendit_id="swiftpay-id-42",
        amount=100,
        currency="PHP",
        status="pending",
        approval_status="pending",
        paid_at=datetime.now(timezone.utc),
        sender_name="Saved sender",
        sender_bank="Saved bank",
        bank_name="Saved destination bank",
        bank_account_number="Saved destination account",
        bank_account_name="Saved destination name",
    )

    class FakeResult:
        def scalar_one_or_none(self):
            return txn

    class FakeDb:
        async def execute(self, _query):
            return FakeResult()

    class FakeSwiftPayService:
        def is_configured(self):
            return True

        async def get_order_status(self, *, reference_no, payment_id):
            assert reference_no == txn.external_id
            assert payment_id == txn.xendit_id
            return {
                "success": True,
                "data": {
                    "payerName": "Provider sender",
                    "payerAccountNumber": "1234567890",
                    "merchantCreditAccountNumber": "0987654321",
                },
            }

    monkeypatch.setattr(
        "routers.payment_approvals.SwiftPayService",
        FakeSwiftPayService,
    )
    user = UserResponse(
        id="admin-1",
        email="admin@example.test",
        permissions=UserPermissions(is_super_admin=True),
    )

    response = await get_payment_approval_details(42, user, FakeDb())

    assert response["success"] is True
    assert response["data"]["sender_name"] == "Provider sender"
    assert response["data"]["sender_account_number"] == "1234567890"
    assert response["data"]["receiver_account_number"] == "0987654321"
    assert response["data"]["sender_bank"] == "Saved bank"
    assert response["data"]["receiver_bank"] == "Saved destination bank"
