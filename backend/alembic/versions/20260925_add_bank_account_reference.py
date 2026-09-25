"""track the reference used for a transaction's assigned KRW account"""
from alembic import op
import sqlalchemy as sa


revision = "20260925_bank_account_reference"
down_revision = "20260925_toss_account_pool"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "transactions",
        sa.Column("bank_account_reference", sa.String(length=256), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("transactions", "bank_account_reference")
