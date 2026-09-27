"""Create canonical organization and membership records.

Revision ID: 20260927_normalize_orgs
Revises: zzzz_final_consolidation
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect


revision: str = "20260927_normalize_orgs"
down_revision: Union[str, None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "organizations" not in tables:
        op.create_table(
            "organizations",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("name", sa.String(length=256), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
        )

    if "organization_memberships" not in tables:
        op.create_table(
            "organization_memberships",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("organization_id", sa.String(length=64), nullable=False),
            sa.Column("user_id", sa.String(length=64), nullable=False),
            sa.Column("role", sa.String(length=64), nullable=False, server_default="viewer"),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
            sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("organization_id", "user_id", name="uq_organization_membership_user"),
        )
        op.create_index(
            "ix_organization_memberships_organization_id",
            "organization_memberships",
            ["organization_id"],
        )
        op.create_index("ix_organization_memberships_user_id", "organization_memberships", ["user_id"])

    if "wallets" in tables:
        wallet_columns = {column["name"] for column in inspect(bind).get_columns("wallets")}
        if "reserved_balance" not in wallet_columns:
            op.add_column(
                "wallets",
                sa.Column("reserved_balance", sa.Float(), nullable=False, server_default="0.0"),
            )
        # Organization wallets are the canonical shared balance. Reconcile
        # duplicate legacy rows before enforcing one row per currency.
        bind.execute(
            sa.text(
                "UPDATE wallets SET currency = 'PHP' "
                "WHERE organization_id IS NOT NULL AND (currency IS NULL OR currency = '')"
            )
        )
        duplicate_groups = bind.execute(
            sa.text(
                "SELECT organization_id, currency, MIN(id) AS keep_id "
                "FROM wallets WHERE organization_id IS NOT NULL "
                "GROUP BY organization_id, currency HAVING COUNT(*) > 1"
            )
        ).fetchall()
        has_transactions = "wallet_transactions" in tables
        for organization_id, currency, keep_id in duplicate_groups:
            duplicate_ids = [row[0] for row in bind.execute(
                sa.text(
                    "SELECT id FROM wallets WHERE organization_id = :organization_id "
                    "AND currency = :currency AND id <> :keep_id"
                ),
                {"organization_id": organization_id, "currency": currency, "keep_id": keep_id},
            ).fetchall()]
            if not duplicate_ids:
                continue
            placeholders = ", ".join(f":duplicate_{index}" for index in range(len(duplicate_ids)))
            parameters = {f"duplicate_{index}": value for index, value in enumerate(duplicate_ids)}
            parameters["keep_id"] = keep_id
            if has_transactions:
                bind.execute(
                    sa.text(
                        f"UPDATE wallet_transactions SET wallet_id = :keep_id "
                        f"WHERE wallet_id IN ({placeholders})"
                    ),
                    parameters,
                )
            bind.execute(
                sa.text(
                    f"DELETE FROM wallets WHERE id IN ({placeholders})"
                ),
                parameters,
            )

        index_names = {index["name"] for index in inspect(bind).get_indexes("wallets")}
        if "uq_wallets_organization_currency" not in index_names:
            op.create_index(
                "uq_wallets_organization_currency",
                "wallets",
                ["organization_id", "currency"],
                unique=True,
            )

    if "wallet_reservations" not in tables and "wallets" in tables:
        op.create_table(
            "wallet_reservations",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("wallet_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.String(length=128), nullable=False),
            sa.Column("organization_id", sa.String(length=64), nullable=True),
            sa.Column("currency", sa.String(length=8), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("reference_id", sa.String(length=128), nullable=False),
            sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["wallet_id"], ["wallets.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("reference_id", name="uq_wallet_reservations_reference"),
        )
        op.create_index("ix_wallet_reservations_wallet_id", "wallet_reservations", ["wallet_id"])
        op.create_index("ix_wallet_reservations_user_id", "wallet_reservations", ["user_id"])
        op.create_index("ix_wallet_reservations_organization_id", "wallet_reservations", ["organization_id"])
        op.create_index(
            "ix_wallet_reservations_wallet_status",
            "wallet_reservations",
            ["wallet_id", "status"],
        )

    if "admin_users" not in tables:
        return

    organization_rows = bind.execute(
        sa.text(
            "SELECT organization_id, MAX(organization_name) "
            "FROM admin_users WHERE organization_id IS NOT NULL "
            "GROUP BY organization_id"
        )
    ).fetchall()
    for organization_id, name in organization_rows:
        bind.execute(
            sa.text(
                "INSERT INTO organizations (id, name) VALUES (:id, :name) "
                "ON CONFLICT (id) DO NOTHING"
            ),
            {"id": organization_id, "name": (name or organization_id)[:256]},
        )

    if "team_invitations" in tables:
        invitation_organizations = bind.execute(
            sa.text(
                "SELECT organization_id, MAX(organization_name) "
                "FROM team_invitations WHERE organization_id IS NOT NULL "
                "GROUP BY organization_id"
            )
        ).fetchall()
        for organization_id, name in invitation_organizations:
            bind.execute(
                sa.text(
                    "INSERT INTO organizations (id, name) VALUES (:id, :name) "
                    "ON CONFLICT (id) DO NOTHING"
                ),
                {"id": organization_id, "name": (name or organization_id)[:256]},
            )

    admin_columns = {column["name"] for column in inspect(bind).get_columns("admin_users")}
    role_expression = "COALESCE(role, 'viewer')" if "role" in admin_columns else "'viewer'"
    active_expression = (
        "CASE WHEN is_active THEN 'active' ELSE 'inactive' END"
        if "is_active" in admin_columns
        else "'active'"
    )
    membership_rows = bind.execute(
        sa.text(
            "SELECT organization_id, telegram_id, "
            f"{role_expression}, {active_expression} "
            "FROM admin_users WHERE organization_id IS NOT NULL"
        )
    ).fetchall()
    for organization_id, user_id, role, status in membership_rows:
        bind.execute(
            sa.text(
                "INSERT INTO organization_memberships "
                "(organization_id, user_id, role, status) "
                "VALUES (:organization_id, :user_id, :role, :status) "
                "ON CONFLICT (organization_id, user_id) DO NOTHING"
            ),
            {
                "organization_id": organization_id,
                "user_id": user_id,
                "role": role or "viewer",
                "status": status,
            },
        )


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())
    if "wallet_reservations" in tables:
        for index_name in (
            "ix_wallet_reservations_wallet_status",
            "ix_wallet_reservations_organization_id",
            "ix_wallet_reservations_user_id",
            "ix_wallet_reservations_wallet_id",
        ):
            if index_name in {index["name"] for index in inspect(bind).get_indexes("wallet_reservations")}:
                op.drop_index(index_name, table_name="wallet_reservations")
        op.drop_table("wallet_reservations")
    if "wallets" in tables:
        wallet_indexes = {index["name"] for index in inspect(bind).get_indexes("wallets")}
        if "uq_wallets_organization_currency" in wallet_indexes:
            op.drop_index("uq_wallets_organization_currency", table_name="wallets")
        if "reserved_balance" in {column["name"] for column in inspect(bind).get_columns("wallets")}:
            op.drop_column("wallets", "reserved_balance")
    if "organization_memberships" in tables:
        op.drop_index("ix_organization_memberships_user_id", table_name="organization_memberships")
        op.drop_index("ix_organization_memberships_organization_id", table_name="organization_memberships")
        op.drop_table("organization_memberships")
    if "organizations" in tables:
        op.drop_table("organizations")