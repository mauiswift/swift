"""Merge multiple head revisions

Revision ID: z9999_merge_heads
Revises: k1l2m3n4o5p6, 8aa3587f0f7e
Create Date: 2026-07-16 03:05:00.000000

This migration resolves the multiple head revisions issue by merging divergent
migration branches. No DDL changes are made - this is a branch merge only.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "z9999_merge_heads"
down_revision: Union[str, Sequence[str], None] = ["k1l2m3n4o5p6", "8aa3587f0f7e"]
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
