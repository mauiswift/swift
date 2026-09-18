"""persist selected manual transfer account details on transactions"""
from alembic import op
import sqlalchemy as sa

revision = "20260918_add_transaction_transfer_accounts"
down_revision = "20260918_add_tatum_usdt_addresses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("transactions", sa.Column("bank_name", sa.String(length=128), nullable=True))
    op.add_column("transactions", sa.Column("bank_account_number", sa.String(length=128), nullable=True))
    op.add_column("transactions", sa.Column("bank_account_name", sa.String(length=256), nullable=True))


def downgrade() -> None:
    op.drop_column("transactions", "bank_account_name")
    op.drop_column("transactions", "bank_account_number")
    op.drop_column("transactions", "bank_name")
