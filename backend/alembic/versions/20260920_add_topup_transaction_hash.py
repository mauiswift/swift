"""store blockchain transaction hashes on USDT top-up requests"""
from alembic import op
import sqlalchemy as sa


revision = "20260920_topup_hash"
down_revision = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("topup_requests", sa.Column("tx_hash", sa.String(length=128), nullable=True))
    op.create_index("ix_topup_requests_tx_hash", "topup_requests", ["tx_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_topup_requests_tx_hash", table_name="topup_requests")
    op.drop_column("topup_requests", "tx_hash")