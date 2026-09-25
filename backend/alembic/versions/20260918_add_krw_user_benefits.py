"""add centralized KRW user benefit entitlement"""
from alembic import op
import sqlalchemy as sa

revision = "20260918_add_krw_user_benefits"
down_revision = "20260918_toss_virtual"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("krw_benefits_unlocked", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("admin_users", sa.Column("krw_benefits_unlocked_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("admin_users", sa.Column("krw_benefits_unlock_source", sa.String(length=128), nullable=True))


def downgrade() -> None:
    op.drop_column("admin_users", "krw_benefits_unlock_source")
    op.drop_column("admin_users", "krw_benefits_unlocked_at")
    op.drop_column("admin_users", "krw_benefits_unlocked")
