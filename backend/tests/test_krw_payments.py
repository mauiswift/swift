"""
Tests for KRW Payment Links and Disbursements

Tests cover:
- Creating KRW payment links
- Creating KRW disbursements
- Validating Korean bank accounts
- Handling various error scenarios
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import Mock, AsyncMock, patch

from core.config import settings
from models.disbursements import Disbursements
from services.krw_payment_service import (
    KRWPaymentService,
    KRWPaymentLinkRequest,
    KRWDisbursementRequest,
    KRWDisbursementResponse,
    KRWBankInfo,
    KOREAN_BANKS,
)
from routers.krw_payments import create_krw_disbursement, create_krw_payment_link


# Set required environment variables for tests
if not settings.swiftpay_access_key:
    settings.swiftpay_access_key = "test_access_key"
if not settings.swiftpay_secret_key:
    settings.swiftpay_secret_key = "test_secret_key"
if not settings.swiftpay_base_url:
    settings.swiftpay_base_url = "https://api.pay.sandbox.live.swiftpay.ph"


class TestKRWBankInfo:
    """Test Korean bank information validation."""
    
    def test_valid_bank_info(self):
        """Test creating valid bank info."""
        bank_info = KRWBankInfo(
            bank_code="004",
            bank_name="KB Kookmin",
            account_number="12345678901",
            account_name="Kim Park"
        )
        assert bank_info.bank_code == "004"
        assert bank_info.account_number == "12345678901"
        assert bank_info.account_name == "Kim Park"
    
    def test_account_number_with_dashes(self):
        """Test account number with dashes is cleaned."""
        bank_info = KRWBankInfo(
            bank_code="004",
            bank_name="KB Kookmin",
            account_number="123-456-789-01",
            account_name="Kim Park"
        )
        assert bank_info.account_number == "12345678901"
    
    def test_invalid_account_number_empty(self):
        """Test that empty account number raises error."""
        with pytest.raises(ValueError):
            KRWBankInfo(
                bank_code="004",
                bank_name="KB Kookmin",
                account_number="",
                account_name="Kim Park"
            )
    
    def test_invalid_account_number_letters(self):
        """Test that account number with letters raises error."""
        with pytest.raises(ValueError):
            KRWBankInfo(
                bank_code="004",
                bank_name="KB Kookmin",
                account_number="1234567ABC01",
                account_name="Kim Park"
            )
    
    def test_invalid_account_number_short(self):
        """Test that short account number raises error."""
        with pytest.raises(ValueError):
            KRWBankInfo(
                bank_code="004",
                bank_name="KB Kookmin",
                account_number="123456",
                account_name="Kim Park"
            )
    
    def test_invalid_account_name_empty(self):
        """Test that empty account name raises error."""
        with pytest.raises(ValueError):
            KRWBankInfo(
                bank_code="004",
                bank_name="KB Kookmin",
                account_number="12345678901",
                account_name=""
            )


class TestKRWPaymentLinkRequest:
    """Test KRW payment link request validation."""
    
    def test_valid_payment_link_request(self):
        """Test creating valid payment link request."""
        request = KRWPaymentLinkRequest(
            amount=50000,
            reference_no="order-123",
            description="Payment for services",
            customer_name="Kim Park",
            customer_email="kim@example.com"
        )
        assert request.amount == 50000
        assert request.reference_no == "order-123"
    
    def test_amount_below_minimum(self):
        """Test that amount below minimum raises error."""
        with pytest.raises(ValueError):
            KRWPaymentLinkRequest(
                amount=500,  # Below minimum ₩1,000
                reference_no="order-123"
            )
    
    def test_amount_above_maximum(self):
        """Test that amount above maximum raises error."""
        with pytest.raises(ValueError):
            KRWPaymentLinkRequest(
                amount=200_000_000,  # Above maximum
                reference_no="order-123"
            )
    
    def test_expiry_days_default(self):
        """Test default expiry days."""
        request = KRWPaymentLinkRequest(
            amount=50000,
            reference_no="order-123"
        )
        assert request.expiry_days == 7
    
    def test_expiry_days_custom(self):
        """Test custom expiry days."""
        request = KRWPaymentLinkRequest(
            amount=50000,
            reference_no="order-123",
            expiry_days=30
        )
        assert request.expiry_days == 30

    @pytest.mark.asyncio
    async def test_krw_payment_link_uses_self_hosted_manual_approval_checkout(self):
        request = KRWPaymentLinkRequest(
            amount=50000,
            reference_no="order-manual-123",
            description="Manual KRW transfer",
            customer_name="Kim Park",
        )
        transaction = Mock()
        db = AsyncMock()
        db.get.return_value = transaction
        current_user = Mock(id="merchant-1")
        gateway_result = {
            "success": True,
            "data": {
                "transaction_id": 123,
                "payment_id": request.reference_no,
                "payment_url": "https://swiftpay.ph/checkout/order-manual-123",
                "checkout_url": "https://swiftpay.ph/checkout/order-manual-123",
                "gateway": "swiftpay_self_hosted",
                "bank_account": {
                    "bank_name": "Toss Bank",
                    "number": "123-456-7890",
                    "account_name": "SwiftPay Ventures",
                    "swift_code": "TVBKKRSEXXX",
                },
            },
        }

        with patch(
            "routers.krw_payments.PaymentGateway.create_payment",
            new=AsyncMock(return_value=gateway_result),
        ) as create_payment, patch.object(
            KRWPaymentService,
            "create_payment_link",
            new=AsyncMock(),
        ) as create_provider_link:
            response = await create_krw_payment_link(request, current_user, db)

        assert response.success is True
        assert response.payment_url == "https://swiftpay.ph/checkout/order-manual-123"
        assert response.payment_link == response.payment_url
        assert response.gateway == "swiftpay_self_hosted"
        assert response.manual_verification is True
        assert response.approval_required is True
        assert response.bank_account["bank_name"] == "Toss Bank"
        assert transaction.expires_at is not None
        create_payment.assert_awaited_once()
        assert create_payment.await_args.kwargs["metadata"] == {
            "manual_krw_checkout": True,
            "self_hosted_checkout": True,
        }
        create_provider_link.assert_not_awaited()


class TestKRWDisbursementRequest:
    """Test KRW disbursement request validation."""
    
    def test_valid_disbursement_request(self):
        """Test creating valid disbursement request."""
        bank_info = KRWBankInfo(
            bank_code="004",
            bank_name="KB Kookmin",
            account_number="12345678901",
            account_name="Kim Park"
        )
        request = KRWDisbursementRequest(
            amount=50000,
            reference_no="payout-456",
            bank_info=bank_info,
            description="Withdrawal to bank account"
        )
        assert request.amount == 50000
        assert request.bank_info.bank_code == "004"
    
    def test_priority_default(self):
        """Test default priority."""
        bank_info = KRWBankInfo(
            bank_code="004",
            bank_name="KB Kookmin",
            account_number="12345678901",
            account_name="Kim Park"
        )
        request = KRWDisbursementRequest(
            amount=50000,
            reference_no="payout-456",
            bank_info=bank_info
        )
        assert request.priority == "normal"
    
    def test_amount_below_minimum(self):
        """Test that amount below minimum raises error."""
        bank_info = KRWBankInfo(
            bank_code="004",
            bank_name="KB Kookmin",
            account_number="12345678901",
            account_name="Kim Park"
        )
        with pytest.raises(ValueError):
            KRWDisbursementRequest(
                amount=500,  # Below minimum ₩1,000
                reference_no="payout-456",
                bank_info=bank_info
            )

    @pytest.mark.asyncio
    async def test_krw_disbursement_is_queued_for_admin_approval(self):
        request = KRWDisbursementRequest(
            amount=50000,
            reference_no="payout-review-456",
            bank_info=KRWBankInfo(
                bank_code="004",
                bank_name="KB Kookmin",
                account_number="12345678901",
                account_name="Kim Park",
            ),
            description="Reviewed KRW withdrawal",
        )
        disbursement = Disbursements(
            id=456,
            user_id="merchant-1",
            external_id=request.reference_no,
            amount=request.amount,
            currency="KRW",
            bank_code=request.bank_info.bank_code,
            account_number=request.bank_info.account_number,
            account_name=request.bank_info.account_name,
            status="processing",
        )
        db = AsyncMock()
        db.scalar.return_value = disbursement
        current_user = Mock(id="merchant-1")
        wallet_service = Mock()
        wallet_service.withdraw_request = AsyncMock(
            return_value={"success": True, "reference_id": request.reference_no}
        )

        with patch("routers.krw_payments.WalletsService", return_value=wallet_service), patch(
            "routers.krw_payments.AdminNotificationService.notify_super_admins",
            new=AsyncMock(return_value=[]),
        ) as notify_admins, patch.object(
            KRWPaymentService,
            "create_disbursement",
            new=AsyncMock(),
        ) as create_provider_disbursement:
            response = await create_krw_disbursement(request, current_user, db)

        assert response.success is True
        assert response.status == "processing"
        assert response.disbursement_id == 456
        wallet_service.withdraw_request.assert_awaited_once()
        notify_admins.assert_awaited_once()
        create_provider_disbursement.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_krw_provider_payout_is_started_only_by_super_admin_approval(self):
        from routers.wallet import approve_withdrawal

        disbursement = Disbursements(
            id=456,
            user_id="merchant-1",
            external_id="payout-review-456",
            amount=50000,
            currency="KRW",
            bank_code="004",
            account_number="12345678901",
            account_name="Kim Park",
            status="processing",
        )
        db = AsyncMock()
        db.execute.return_value = Mock(
            scalar_one_or_none=Mock(return_value=disbursement)
        )
        db.commit = AsyncMock()
        current_user = Mock(
            id="super-admin-1",
            permissions=Mock(is_super_admin=True),
        )
        provider_response = KRWDisbursementResponse(
            success=True,
            provider_reference="swiftpay-krw-payout-456",
            reference_no=disbursement.external_id,
            amount=disbursement.amount,
            status="processing",
        )

        with patch(
            "services.krw_payment_service.KRWPaymentService.create_disbursement",
            new=AsyncMock(return_value=provider_response),
        ) as create_provider_disbursement, patch(
            "routers.wallet.TransactionsService"
        ) as transaction_service:
            transaction_service.return_value.create_transaction = AsyncMock()
            response = await approve_withdrawal(456, current_user, db)

        assert response["success"] is True
        assert response["status"] == "transferring"
        assert disbursement.approved_by == "super-admin-1"
        assert disbursement.xendit_id == "swiftpay-krw-payout-456"
        create_provider_disbursement.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_duplicate_php_reference_keeps_withdrawal_reserved_for_reconciliation(self):
        from routers.wallet import approve_withdrawal
        from services.swiftpay_service import SwiftPayService

        disbursement = Disbursements(
            id=789,
            user_id="merchant-1",
            external_id="payout-review-789",
            amount=500,
            currency="PHP",
            bank_code="BDO",
            account_number="1234567890",
            account_name="Jane Doe",
            status="processing",
        )
        db = AsyncMock()
        db.execute.return_value = Mock(
            scalar_one_or_none=Mock(return_value=disbursement)
        )
        current_user = Mock(
            id="super-admin-1",
            permissions=Mock(is_super_admin=True),
        )
        duplicate_response = {
            "success": False,
            "code": "DUPLICATE_MERCHANT_REFERENCE_NO",
            "already_submitted": True,
            "reference_no": disbursement.external_id,
            "error": "SwiftPay already has this disbursement reference; provider status must be reconciled",
        }

        with patch.object(
            SwiftPayService,
            "send_disbursement",
            new=AsyncMock(return_value=duplicate_response),
        ) as send_disbursement, patch(
            "routers.wallet.WalletsService"
        ) as wallet_service, patch(
            "routers.wallet.TransactionsService"
        ) as transaction_service:
            wallet_service.return_value.refund_wallet_debit = AsyncMock()
            transaction_service.return_value.create_transaction = AsyncMock()
            response = await approve_withdrawal(789, current_user, db)

        assert response["success"] is True
        assert response["status"] == "transferring"
        assert "awaiting SwiftPay reconciliation" in response["message"]
        assert disbursement.external_id == "payout-review-789"
        assert disbursement.status == "transferring"
        send_disbursement.assert_awaited_once()
        wallet_service.return_value.refund_wallet_debit.assert_not_awaited()
        db.commit.assert_awaited_once()


class TestKRWPaymentService:
    """Test KRW payment service."""
    
    def test_service_initialization(self):
        """Test service initializes with SwiftPay credentials."""
        service = KRWPaymentService()
        assert service.is_configured
        assert service.base_url == "https://api.pay.sandbox.live.swiftpay.ph"
    
    def test_format_amount(self):
        """Test amount formatting with 2 decimal places."""
        service = KRWPaymentService()
        assert service._format_amount(50000) == "50000.00"
        assert service._format_amount(50000.5) == "50000.50"
        assert service._format_amount(50000.1) == "50000.10"
    
    def test_get_auth_header(self):
        """Test HTTP Basic auth header generation."""
        service = KRWPaymentService()
        auth_header = service._get_auth_header()
        assert auth_header.startswith("Basic ")
        # Should be Base64 encoded "test_access_key:test_secret_key"
        import base64
        credentials = base64.b64decode(auth_header[6:]).decode()
        assert credentials == "test_access_key:test_secret_key"
    
    @pytest.mark.asyncio
    async def test_validate_bank_account_valid(self):
        """Test validating a valid bank account."""
        service = KRWPaymentService()
        result = await service.validate_bank_account("004", "12345678901")
        assert result["valid"]
        assert result["bank_name"] == "KB Kookmin"
        assert result["swift_code"] == "KKBKKRSE"
    
    @pytest.mark.asyncio
    async def test_validate_bank_account_invalid_code(self):
        """Test validating with invalid bank code."""
        service = KRWPaymentService()
        result = await service.validate_bank_account("999", "12345678901")
        assert not result["valid"]
        assert "Unknown bank code" in result["error"]
    
    @pytest.mark.asyncio
    async def test_validate_bank_account_invalid_format(self):
        """Test validating with invalid account format."""
        service = KRWPaymentService()
        result = await service.validate_bank_account("004", "INVALID")
        assert not result["valid"]
        assert "Invalid account number" in result["error"]
    
    @pytest.mark.asyncio
    async def test_create_payment_link_not_configured(self):
        """Test creating payment link when service not configured."""
        with patch.object(KRWPaymentService, '__init__', lambda x: None):
            service = KRWPaymentService()
            service.is_configured = False
            
            request = KRWPaymentLinkRequest(
                amount=50000,
                reference_no="order-123"
            )
            
            response = await service.create_payment_link(request, "user123")
            assert not response.success
            assert response.code == "UNCONFIGURED"
    
    @pytest.mark.asyncio
    async def test_create_disbursement_not_configured(self):
        """Test creating disbursement when service not configured."""
        with patch.object(KRWPaymentService, '__init__', lambda x: None):
            service = KRWPaymentService()
            service.is_configured = False
            
            bank_info = KRWBankInfo(
                bank_code="004",
                bank_name="KB Kookmin",
                account_number="12345678901",
                account_name="Kim Park"
            )
            request = KRWDisbursementRequest(
                amount=50000,
                reference_no="payout-456",
                bank_info=bank_info
            )
            
            response = await service.create_disbursement(request, "user123")
            assert not response.success
            assert response.code == "UNCONFIGURED"


class TestKoreanBanks:
    """Test Korean bank codes."""
    
    def test_all_supported_banks(self):
        """Test that all major Korean banks are supported."""
        required_banks = {
            "004": "KB Kookmin",
            "011": "NH Nonghyup",
            "020": "Woori",
            "027": "KEB Hana",
            "040": "Shinhan",
        }
        
        for code, name in required_banks.items():
            assert code in KOREAN_BANKS
            assert KOREAN_BANKS[code]["name"] == name
            assert "swift" in KOREAN_BANKS[code]
    
    def test_bank_swift_codes(self):
        """Test that all banks have SWIFT codes."""
        for code, info in KOREAN_BANKS.items():
            assert "swift" in info
            assert len(info["swift"]) == 8  # SWIFT codes are 8 characters


class TestKRWPaymentEndpoints:
    """Integration tests for KRW payment endpoints."""
    
    # Note: These tests would require a full FastAPI TestClient setup
    # and mocked database/auth dependencies
    
    def test_payment_link_endpoint_requires_auth(self):
        """Test that payment link endpoint requires authentication."""
        # This would be tested with actual TestClient
        pass
    
    def test_disbursement_endpoint_requires_auth(self):
        """Test that disbursement endpoint requires authentication."""
        # This would be tested with actual TestClient
        pass
    
    def test_list_banks_endpoint_public(self):
        """Test that list banks endpoint is accessible."""
        # This would be tested with actual TestClient
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
