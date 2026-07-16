"""Consolidate all migration heads into single chain

This migration merges all parallel migration branches that developed
due to concurrent development. It establishes a single linear path forward.

Revision ID: z9y8x7w6v5u4
Revises: ('f4e19613f3a8', 'u1v2w3x4y5z6')
Create Date: 2026-07-16 01:55:00.000000

Merged branches:
  - Main branch ending at f4e19613f3a8
  - Merge branch u1v2w3x4y5z6 (which itself merged r9e8d7c6b5a4 and t6u7v8w9x0y1)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'z9y8x7w6v5u4'
down_revision: Union[str, Sequence[str], None] = ('f4e19613f3a8', 'u1v2w3x4y5z6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No schema changes; consolidation only."""
    pass


def downgrade() -> None:
    """No schema changes to revert."""
    pass
