"""Allow merchant store profiles to be owned by individual users."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision: str = "v1w2x3y4z5a6"
down_revision: Union[str, Sequence[str], None] = "merch_api_cfg_settle"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_merchant_api_configs_organization_id", table_name="merchant_api_configs")
    op.add_column("merchant_api_configs", sa.Column("user_id", sa.String(length=64), nullable=True))
    op.add_column("merchant_api_configs", sa.Column("store_slug", sa.String(length=128), nullable=False, server_default="3"))
    op.create_index("ix_merchant_api_configs_organization_id", "merchant_api_configs", ["organization_id"], unique=False)
    op.create_index("ix_merchant_api_configs_user_id", "merchant_api_configs", ["user_id"], unique=False)

    bind = op.get_bind()
    configs = bind.execute(text("SELECT id, organization_id FROM merchant_api_configs WHERE user_id IS NULL")).fetchall()
    for config_id, organization_id in configs:
        owner_id = bind.execute(
            text(
                "SELECT telegram_id FROM admin_users "
                "WHERE organization_id = :organization_id AND is_active = true "
                "ORDER BY is_super_admin ASC, id ASC LIMIT 1"
            ),
            {"organization_id": organization_id},
        ).scalar()
        if owner_id is not None:
            bind.execute(
                text("UPDATE merchant_api_configs SET user_id = :user_id WHERE id = :config_id"),
                {"user_id": str(owner_id), "config_id": config_id},
            )


def downgrade() -> None:
    op.drop_index("ix_merchant_api_configs_user_id", table_name="merchant_api_configs")
    op.drop_index("ix_merchant_api_configs_organization_id", table_name="merchant_api_configs")
    op.drop_column("merchant_api_configs", "store_slug")
    op.drop_column("merchant_api_configs", "user_id")
    op.create_index("ix_merchant_api_configs_organization_id", "merchant_api_configs", ["organization_id"], unique=True)