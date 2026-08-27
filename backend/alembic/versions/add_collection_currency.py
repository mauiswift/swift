"""Add store collection currency for gateway routing."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

revision = "add_collection_currency"
down_revision = "add_store_branding_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        exists = bind.execute(text(
            "SELECT 1 FROM information_schema.columns WHERE table_schema='public' "
            "AND table_name='merchant_api_configs' AND column_name='collection_currency'"
        )).fetchone()
    else:
        exists = any(
            row[1] == "collection_currency"
            for row in bind.execute(text("PRAGMA table_info(merchant_api_configs)"))
        )
    if not exists:
        op.add_column(
            "merchant_api_configs",
            sa.Column("collection_currency", sa.String(length=3), nullable=False, server_default="PHP"),
        )


def downgrade() -> None:
    op.drop_column("merchant_api_configs", "collection_currency")