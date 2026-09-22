"""Store referral sponsor separately from team invitations."""

from alembic import op
import sqlalchemy as sa

revision = "20260922_referral_upline_kyb"
down_revision = "20260922_registration_links"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "kyb_registrations",
        sa.Column("referral_upline_id", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "ix_kyb_registrations_referral_upline_id",
        "kyb_registrations",
        ["referral_upline_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_kyb_registrations_referral_upline_id", table_name="kyb_registrations")
    op.drop_column("kyb_registrations", "referral_upline_id")
