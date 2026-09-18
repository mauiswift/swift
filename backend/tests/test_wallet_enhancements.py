"""
Test suite for wallet and SMS enhancements
Tests cover: SMS notifications, admin wallet operations, payment processing improvements
"""
import pytest
from datetime import datetime, timezone


class TestSMSNotifications:
    """Test SMS notification functionality"""

    @pytest.mark.asyncio
    async def test_sms_service_initialization(self):
        """Test that SMS service initializes correctly"""
        from services.notification_service import SMSService
        from core.config import settings
        
        assert SMSService is not None
        assert settings.sms_provider in ["semaphore", "twilio"]
        assert settings.sms_enable_notifications is not None

    @pytest.mark.asyncio
    async def test_sms_methods_exist(self):
        """Test that all required SMS methods exist"""
        from services.notification_service import SMSService
        
        methods = [
            "send_sms",
            "notify_bank_of_failure",
            "notify_user_of_failed_transfer",
            "notify_user_of_successful_transfer",
            "notify_user_of_disbursement",
            "notify_user_of_topup",
        ]
        
        for method in methods:
            assert hasattr(SMSService, method), f"Missing SMS method: {method}"


class TestWalletModels:
    """Test wallet model enhancements"""

    def test_wallet_admin_columns(self):
        """Test that wallet model has admin operation columns"""
        from models.wallets import Wallets
        
        columns = {col.name for col in Wallets.__table__.columns}
        
        required_cols = [
            "is_frozen",
            "freeze_reason",
            "total_credits",
            "total_debits",
            "transaction_count",
            "last_activity",
        ]
        
        for col in required_cols:
            assert col in columns, f"Missing column: {col}"

    def test_wallet_indices(self):
        """Test that wallet has proper indices for admin operations"""
        from models.wallets import Wallets
        
        indices = {idx.name for idx in Wallets.__table__.indexes}
        
        required_indices = ["idx_wallets_user_currency", "idx_wallets_status"]
        
        for idx in required_indices:
            assert idx in indices, f"Missing index: {idx}"

    def test_top_up_transactions_are_included_in_reconciliation_ledger(self):
        """Approved super-admin top-ups must not be erased by reconciliation."""
        from services.wallets import _LEDGER_TRANSACTION_TYPES

        assert "top_up" in _LEDGER_TRANSACTION_TYPES

    def test_utc_serialization_normalizes_activity_timestamps(self):
        """Activity timestamps should be normalized to UTC before sending to the frontend."""
        from utils.datetime import serialize_utc_datetime
        from datetime import timedelta

        aware_value = datetime(2024, 1, 2, 8, 30, 0, tzinfo=timezone(timedelta(hours=8)))

        assert serialize_utc_datetime(aware_value) == "2024-01-02T00:30:00+00:00"

    def test_payment_credit_note_hides_admin_approval_details(self):
        """Wallet payment labels should be generic and not expose approval context."""
        from services.wallet_transaction_labeling import WalletTransactionLabelingService

        label = WalletTransactionLabelingService.generate_credit_note(
            gateway_label="admin-manual",
            gross_amount=86.0,
            description="Payment to SwiftPay PH",
            transaction_type="payment_link",
            reference_id="ref-123",
            approval_note="Approved via Telegram bot",
            currency="KRW",
        )

        assert label == "Payment Received"


class TestDisbursementModels:
    """Test disbursement model enhancements"""

    def test_disbursement_settlement_columns(self):
        """Test that disbursement model has settlement columns"""
        from models.disbursements import Disbursements
        
        columns = {col.name for col in Disbursements.__table__.columns}
        
        required_cols = [
            "settlement_batch_id",
            "settlement_priority",
            "processing_fee",
            "net_amount",
            "scheduled_at",
            "processed_at",
            "completed_at",
            "failure_reason",
            "retry_count",
        ]
        
        for col in required_cols:
            assert col in columns, f"Missing column: {col}"

    def test_disbursement_indices(self):
        """Test that disbursement has proper indices for settlement"""
        from models.disbursements import Disbursements
        
        indices = {idx.name for idx in Disbursements.__table__.indexes}
        
        required_indices = ["idx_disbursements_settlement_batch"]
        
        for idx in required_indices:
            assert idx in indices, f"Missing index: {idx}"


class TestAdminWalletRouter:
    """Test admin wallet router"""

    def test_admin_router_exists(self):
        """Test that admin wallets router is properly defined"""
        from routers.admin_wallets import router
        
        assert router is not None
        assert len(router.routes) > 0

    def test_admin_router_endpoints(self):
        """Test that admin wallets router has expected endpoints"""
        from routers.admin_wallets import router
        
        route_paths = {route.path for route in router.routes}
        
        required_endpoints = [
            "/user/{user_id}/analytics",
            "/freeze",
            "/unfreeze",
            "/reconcile",
            "/batch-credit",
            "/list-frozen",
        ]
        
        for endpoint in required_endpoints:
            # Check if any route matches (some may have prefix applied)
            found = any(endpoint in path for path in route_paths)
            assert found, f"Missing endpoint: {endpoint}"

    def test_manual_withdrawal_approval_route_registered(self):
        """Manual withdrawals should have an approve route so admins can process them."""
        from routers.wallet import router

        route_paths = {route.path for route in router.routes}
        assert "/api/v1/wallet/admin/withdrawals/{disb_id}/approve" in route_paths


class TestConfigSMS:
    """Test SMS configuration"""

    def test_sms_config_fields(self):
        """Test that SMS configuration fields exist"""
        from core.config import settings
        
        config_fields = [
            "sms_provider",
            "semaphore_api_key",
            "semaphore_api_url",
            "twilio_account_sid",
            "twilio_auth_token",
            "twilio_phone_number",
            "sms_max_retries",
            "sms_retry_delay_ms",
            "sms_enable_notifications",
        ]
        
        for field in config_fields:
            assert hasattr(settings, field), f"Missing config field: {field}"

    def test_sms_defaults(self):
        """Test SMS configuration defaults"""
        from core.config import settings
        
        assert settings.sms_provider in ["semaphore", "twilio"]
        assert settings.semaphore_api_url == "https://api.semaphore.co/api/v4"
        assert settings.sms_max_retries >= 1
        assert isinstance(settings.sms_enable_notifications, bool)


class TestDisbursementsService:
    """Test disbursements service enhancements"""

    @pytest.mark.asyncio
    async def test_disbursements_service_methods(self):
        """Test that disbursements service has new methods"""
        from services.disbursements import DisbursementsService
        from sqlalchemy.ext.asyncio import AsyncSession
        from unittest.mock import AsyncMock
        
        # Create mock DB session
        mock_db = AsyncMock(spec=AsyncSession)
        service = DisbursementsService(mock_db)
        
        required_methods = [
            "calculate_fee",
            "create_settlement_batch",
            "mark_settlement_completed",
            "get_settlement_stats",
        ]
        
        for method in required_methods:
            assert hasattr(service, method), f"Missing method: {method}"


class TestWalletsService:
    """Test wallets service enhancements"""

    @pytest.mark.asyncio
    async def test_wallets_service_methods(self):
        """Test that wallets service has new admin methods"""
        from services.wallets import WalletsService
        from sqlalchemy.ext.asyncio import AsyncSession
        from unittest.mock import AsyncMock
        
        # Create mock DB session
        mock_db = AsyncMock(spec=AsyncSession)
        service = WalletsService(mock_db)
        
        required_methods = [
            "freeze_wallet",
            "unfreeze_wallet",
            "get_wallet_analytics",
            "reconcile_wallet",
            "batch_credit_wallets",
            "update_wallet_analytics",
        ]
        
        for method in required_methods:
            assert hasattr(service, method), f"Missing method: {method}"

    @pytest.mark.asyncio
    async def test_withdraw_request_handles_null_available_balance(self):
        """Legacy wallets can have a NULL available balance; withdrawals should still submit."""
        from services.wallets import WalletsService
        from unittest.mock import AsyncMock, MagicMock

        db = AsyncMock()
        service = WalletsService(db)

        wallet = MagicMock()
        wallet.id = 42
        wallet.user_id = "tg-123"
        wallet.currency = "PHP"
        wallet.balance = 60000.0
        wallet.available_balance = None
        wallet.pending_balance = None
        wallet.is_frozen = False
        wallet.freeze_reason = None
        wallet.total_debits = 0.0
        wallet.transaction_count = 0
        wallet.last_activity = None
        wallet.updated_at = None

        db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=wallet)))
        db.commit = AsyncMock()
        db.refresh = AsyncMock()
        db.add = MagicMock()

        service._resolve_effective_wallet_owner = AsyncMock(return_value=("tg-123", None))
        service._ensure_wallet_active = AsyncMock()
        service.publish_wallet_event = AsyncMock()

        result = await service.withdraw_request(
            user_id="123",
            amount=5000.0,
            bank_name="BDO",
            account_number="1234567890",
            account_name="Juan Dela Cruz",
            note="Manual withdrawal test",
        )

        assert result["success"] is True
        assert result["balance"] == 55000.0
        assert wallet.available_balance == 55000.0

    @pytest.mark.asyncio
    async def test_withdraw_request_allows_zero_security_deposit_minimum(self):
        """A zero configured minimum should not block the withdrawal flow."""
        from core.config import settings
        from services.wallets import WalletsService
        from unittest.mock import AsyncMock, MagicMock

        original_min = getattr(settings, "php_security_deposit_min", 0.0)
        settings.php_security_deposit_min = 0.0

        try:
            db = AsyncMock()
            service = WalletsService(db)

            wallet = MagicMock()
            wallet.id = 42
            wallet.user_id = "tg-123"
            wallet.currency = "PHP"
            wallet.balance = 25000.0
            wallet.available_balance = 25000.0
            wallet.pending_balance = 0.0
            wallet.is_frozen = False
            wallet.freeze_reason = None
            wallet.total_debits = 0.0
            wallet.transaction_count = 0
            wallet.last_activity = None
            wallet.updated_at = None

            db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=wallet)))
            db.commit = AsyncMock()
            db.refresh = AsyncMock()
            db.add = MagicMock()

            service._resolve_effective_wallet_owner = AsyncMock(return_value=("tg-123", None))
            service._ensure_wallet_active = AsyncMock()
            service.publish_wallet_event = AsyncMock()

            result = await service.withdraw_request(
                user_id="123",
                amount=5000.0,
                bank_name="BDO",
                account_number="1234567890",
                account_name="Juan Dela Cruz",
                note="Manual withdrawal test",
            )

            assert result["success"] is True
            assert result["balance"] == 20000.0
            assert wallet.available_balance == 20000.0
        finally:
            settings.php_security_deposit_min = original_min

    @pytest.mark.asyncio
    async def test_withdraw_request_starts_in_processing_status(self):
        """Submitted withdrawals should be represented as processing from the moment they are created."""
        from services.wallets import WalletsService
        from unittest.mock import AsyncMock, MagicMock

        db = AsyncMock()
        service = WalletsService(db)

        wallet = MagicMock()
        wallet.id = 42
        wallet.user_id = "tg-123"
        wallet.currency = "PHP"
        wallet.balance = 60000.0
        wallet.available_balance = 60000.0
        wallet.pending_balance = 0.0
        wallet.is_frozen = False
        wallet.freeze_reason = None
        wallet.total_debits = 0.0
        wallet.transaction_count = 0
        wallet.last_activity = None
        wallet.updated_at = None

        db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=wallet)))
        db.commit = AsyncMock()
        db.refresh = AsyncMock()
        db.add = MagicMock()

        service._resolve_effective_wallet_owner = AsyncMock(return_value=("tg-123", None))
        service._ensure_wallet_active = AsyncMock()
        service.publish_wallet_event = AsyncMock()

        await service.withdraw_request(
            user_id="123",
            amount=5000.0,
            bank_name="BDO",
            account_number="1234567890",
            account_name="Juan Dela Cruz",
            note="Manual withdrawal test",
        )

        created_disb = db.add.call_args[0][0]
        assert created_disb.status == "processing"

    @pytest.mark.asyncio
    async def test_new_usdt_wallet_is_frozen_until_600_topup(self):
        """New USDT wallets should start frozen and self-unlock after reaching the onboarding threshold."""
        from services import wallets as wallets_module
        from services.wallets import WalletsService
        from unittest.mock import AsyncMock, MagicMock

        db = AsyncMock()
        service = WalletsService(db)
        db.flush = AsyncMock()

        wallet = MagicMock()
        wallet.id = 100
        wallet.user_id = "tg-123"
        wallet.currency = "USD"
        wallet.balance = 0.0
        wallet.available_balance = 0.0
        wallet.pending_balance = 0.0
        wallet.is_frozen = True
        wallet.freeze_reason = "Top up 600 USDT to enable all wallet features."
        wallet.total_credits = 0.0
        wallet.total_debits = 0.0
        wallet.transaction_count = 0
        wallet.last_activity = None
        wallet.updated_at = None

        service.get_or_create_wallet = AsyncMock(return_value=wallet)
        service._ensure_wallet_active = AsyncMock()
        wallets_module.get_wallet_currency_limits = AsyncMock(return_value={
            "minimum_deposit": 0.0,
            "max_incoming": 0.0,
            "minimum_balance": 0.0,
            "max_withdrawal_daily": 0.0,
            "max_withdrawal_monthly": 0.0,
        })

        await service.credit_wallet(
            user_id="123",
            amount=600.0,
            currency="USDT",
            transaction_type="top_up",
            reference_id="topup-600",
            note="First top-up",
        )

        assert wallet.is_frozen is False
        assert wallet.freeze_reason is None
        assert wallet.balance == 600.0

    @pytest.mark.asyncio
    async def test_frozen_wallet_blocks_outgoing_only(self):
        """Freezing should block outbound activity but still allow incoming funds."""
        from services import wallets as wallets_module
        from services.wallets import WalletsService
        from unittest.mock import AsyncMock, MagicMock

        db = AsyncMock()
        service = WalletsService(db)

        wallet = MagicMock()
        wallet.id = 99
        wallet.user_id = "tg-123"
        wallet.currency = "PHP"
        wallet.balance = 1000.0
        wallet.available_balance = 1000.0
        wallet.pending_balance = 0.0
        wallet.is_frozen = True
        wallet.freeze_reason = "manual review"
        wallet.total_credits = 0.0
        wallet.total_debits = 0.0
        wallet.transaction_count = 0
        wallet.last_activity = None
        wallet.updated_at = None

        service.get_or_create_wallet = AsyncMock(return_value=wallet)
        service._ensure_wallet_active = AsyncMock(side_effect=ValueError("Wallet is frozen"))
        wallets_module.get_wallet_currency_limits = AsyncMock(return_value={
            "minimum_deposit": 0.0,
            "max_incoming": 0.0,
            "minimum_balance": 0.0,
            "max_withdrawal_daily": 0.0,
            "max_withdrawal_monthly": 0.0,
        })

        result = await service.credit_wallet(
            user_id="123",
            amount=250.0,
            currency="PHP",
            transaction_type="deposit",
            reference_id="incoming-1",
            note="deposit",
        )
        assert result.balance == 1250.0

        with pytest.raises(ValueError):
            await service.debit_wallet(
                user_id="123",
                amount=50.0,
                currency="PHP",
                transaction_type="withdraw",
                reference_id="outgoing-1",
                note="withdraw",
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
