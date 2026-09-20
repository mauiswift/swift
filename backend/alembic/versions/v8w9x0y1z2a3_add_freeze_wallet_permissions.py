"""add separate wallet freeze and unfreeze permissions"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

revision: str = "v8w9x0y1z2a3"
down_revision: Union[str, Sequence[str], None] = "u7v8w9x0y1z2"
branch_labels = None
depends_on = None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:table_name AND column_name=:column_name"
            ),
            {"table_name": table, "column_name": column},
        ).fetchone() is not None
    return any(row[1] == column for row in bind.execute(text(f"PRAGMA table_info({table})")))


def upgrade() -> None:
    for column in ("can_freeze_wallet", "can_unfreeze_wallet"):
        if not _column_exists("admin_users", column):
            op.add_column(
                "admin_users",
                sa.Column(column, sa.Boolean(), nullable=False, server_default="false"),
            )

    # Existing super admins historically bypassed these checks. Preserve their
    # current access while making the permissions revocable going forward.
    op.execute(
        "UPDATE admin_users SET "
        "can_credit_wallet = TRUE, can_debit_wallet = TRUE, "
        "can_freeze_wallet = TRUE, can_unfreeze_wallet = TRUE "
        "WHERE is_super_admin = TRUE"
    )


def downgrade() -> None:
    for column in ("can_unfreeze_wallet", "can_freeze_wallet"):
        if _column_exists("admin_users", column):
            op.drop_column("admin_users", column)
