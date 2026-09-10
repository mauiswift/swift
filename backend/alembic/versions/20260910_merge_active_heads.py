"""Merge the active migration branches into one deployment head."""

from typing import Sequence, Union

from alembic import op


revision: str = "20260910_merge_active_heads"
down_revision: Union[str, Sequence[str], None] = (
    "20260910_sender_details",
    "20260908_sync_topup_currency",
    "add_admin_user_preferred_currency",
    "add_currency_to_broadcast_messages",
    "20260901_merge_reports_and_admin_password_heads",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass