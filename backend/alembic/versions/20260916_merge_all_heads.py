"""Merge all active migration heads into one linear target.

Revision ID: 20260916_merge_all_heads
Revises: 001, 001_pos_terminals, 20260825_add_main_admin_user, 20260901_set_main_admin_password, 20260910_add_approval_tracking, 20260910_add_downline_tables, 20260911_add_currency_to_bank_deposits, 20260911_add_failed_passkey_attempt_tracking, 20260913_add_approval_fields_to_disbursements, 20260913_withdrawal_fees, 20260914_wallet_currency_registry, add_collection_currency, add_currency_to_broadcast_messages, add_uq_api_configs_service_key, admin_notifications_001, broadcast_messages_001, reports_001, seed_existing_data_001, v1w2x3y4z5a6
Create Date: 2026-09-16
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260916_merge_all_heads"
down_revision: str | Sequence[str] | None = (
    "001",
    "001_pos_terminals",
    "20260825_add_main_admin_user",
    "20260901_set_main_admin_password",
    "20260910_add_approval_tracking",
    "20260910_add_downline_tables",
    "20260911_add_currency_to_bank_deposits",
    "20260911_add_failed_passkey_attempt_tracking",
    "20260913_add_approval_fields_to_disbursements",
    "20260913_withdrawal_fees",
    "20260914_wallet_currency_registry",
    "add_collection_currency",
    "add_currency_to_broadcast_messages",
    "add_uq_api_configs_service_key",
    "admin_notifications_001",
    "broadcast_messages_001",
    "reports_001",
    "seed_existing_data_001",
    "v1w2x3y4z5a6",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
