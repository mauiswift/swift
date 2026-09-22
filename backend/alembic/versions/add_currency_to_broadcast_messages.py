"""Add currency boundaries to broadcast messages."""

from alembic import op
import sqlalchemy as sa


revision = "currency_broadcast"
down_revision = "zzzz_final_consolidation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("broadcast_messages")}
    if "currency" not in columns:
        op.add_column(
            "broadcast_messages",
            sa.Column("currency", sa.String(length=8), nullable=False, server_default="ALL"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("broadcast_messages")}
    if "currency" in columns:
        op.drop_column("broadcast_messages", "currency")
