"""Keep the original requested currency amount for top-up approvals."""

from alembic import op
import sqlalchemy as sa


revision = "20260930_topup_quote"
down_revision = "20260920_topup_hash"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "topup_requests",
        sa.Column("requested_amount", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("topup_requests", "requested_amount")