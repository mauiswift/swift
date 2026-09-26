"""Persist SwiftPay QR P2M metadata for approval and reconciliation."""

from alembic import op
import sqlalchemy as sa


revision = "20260926_swiftpay_qr_p2m"
down_revision = "20260913_disbursement_approval"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "disbursements",
        sa.Column("swiftpay_transfer_type", sa.String(), nullable=True),
    )
    op.add_column(
        "disbursements",
        sa.Column("swiftpay_merchant_information", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("disbursements", "swiftpay_merchant_information")
    op.drop_column("disbursements", "swiftpay_transfer_type")
