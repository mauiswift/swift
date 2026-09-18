"""add Tatum-managed USDT deposit addresses and chain transfers"""
from alembic import op
import sqlalchemy as sa

revision = "20260918_add_tatum_usdt_addresses"
down_revision = "20260918_add_toss_virtual_account_application"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usdt_deposit_addresses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("address", sa.String(length=64), nullable=False),
        sa.Column("derivation_index", sa.Integer(), nullable=False),
        sa.Column("network", sa.String(length=16), server_default="TRON", nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("last_scanned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_usdt_deposit_address_user"),
        sa.UniqueConstraint("address", name="uq_usdt_deposit_address_address"),
        sa.UniqueConstraint("derivation_index", name="uq_usdt_deposit_address_index"),
    )
    op.create_index("ix_usdt_deposit_addresses_user_id", "usdt_deposit_addresses", ["user_id"])
    op.create_index("ix_usdt_deposit_addresses_address", "usdt_deposit_addresses", ["address"])
    op.create_table(
        "usdt_chain_transfers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("address", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=False),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("amount_usdt", sa.String(length=64), nullable=False),
        sa.Column("from_address", sa.String(length=64), nullable=True),
        sa.Column("to_address", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="confirmed", nullable=False),
        sa.Column("raw_payload", sa.Text(), nullable=True),
        sa.Column("observed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tx_hash", name="uq_usdt_chain_transfer_hash"),
    )
    op.create_index("ix_usdt_chain_transfers_user_id", "usdt_chain_transfers", ["user_id"])
    op.create_index("ix_usdt_chain_transfers_address", "usdt_chain_transfers", ["address"])
    op.create_index("ix_usdt_chain_transfers_tx_hash", "usdt_chain_transfers", ["tx_hash"])


def downgrade() -> None:
    op.drop_index("ix_usdt_chain_transfers_tx_hash", table_name="usdt_chain_transfers")
    op.drop_index("ix_usdt_chain_transfers_address", table_name="usdt_chain_transfers")
    op.drop_index("ix_usdt_chain_transfers_user_id", table_name="usdt_chain_transfers")
    op.drop_table("usdt_chain_transfers")
    op.drop_index("ix_usdt_deposit_addresses_address", table_name="usdt_deposit_addresses")
    op.drop_index("ix_usdt_deposit_addresses_user_id", table_name="usdt_deposit_addresses")
    op.drop_table("usdt_deposit_addresses")
