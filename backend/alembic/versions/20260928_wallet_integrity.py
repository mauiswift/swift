"""Enforce unique wallet owners and withdrawal references.

Revision ID: 20260928_wallet_integrity
Revises: 20260927_normalize_orgs
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260928_wallet_integrity"
down_revision: Union[str, None] = "20260927_normalize_orgs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_unique_name(bind, table_name: str, name: str) -> bool:
    inspector = inspect(bind)
    constraints = inspector.get_unique_constraints(table_name)
    indexes = inspector.get_indexes(table_name)
    return any(item.get("name") == name for item in constraints + indexes)


def _duplicate_group_count(bind, query: str) -> int:
    return int(bind.execute(sa.text(query)).scalar_one() or 0)


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())

    if "wallets" in tables:
        duplicate_wallets = _duplicate_group_count(
            bind,
            "SELECT COUNT(*) FROM ("
            "SELECT user_id, currency FROM wallets "
            "GROUP BY user_id, currency HAVING COUNT(*) > 1"
            ") AS duplicate_groups",
        )
        if duplicate_wallets:
            raise RuntimeError(
                f"Cannot enforce wallet uniqueness: {duplicate_wallets} duplicate "
                "(user_id, currency) groups require balance reconciliation."
            )
        if not _has_unique_name(bind, "wallets", "uq_wallets_user_currency"):
            op.create_index(
                "uq_wallets_user_currency",
                "wallets",
                ["user_id", "currency"],
                unique=True,
            )

    if "disbursements" in tables:
        duplicate_references = _duplicate_group_count(
            bind,
            "SELECT COUNT(*) FROM ("
            "SELECT external_id FROM disbursements "
            "WHERE external_id IS NOT NULL "
            "GROUP BY external_id HAVING COUNT(*) > 1"
            ") AS duplicate_groups",
        )
        if duplicate_references:
            raise RuntimeError(
                f"Cannot enforce withdrawal reference uniqueness: {duplicate_references} "
                "duplicate external_id groups require reconciliation."
            )
        if not _has_unique_name(bind, "disbursements", "uq_disbursements_external_id"):
            op.create_index(
                "uq_disbursements_external_id",
                "disbursements",
                ["external_id"],
                unique=True,
            )


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())
    for table_name, index_name in (
        ("disbursements", "uq_disbursements_external_id"),
        ("wallets", "uq_wallets_user_currency"),
    ):
        if table_name in tables and any(
            index.get("name") == index_name
            for index in inspect(bind).get_indexes(table_name)
        ):
            op.drop_index(index_name, table_name=table_name)