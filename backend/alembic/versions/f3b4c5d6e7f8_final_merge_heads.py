"""final merge heads - consolidate all parallel branches

Revision ID: f3b4c5d6e7f8
Revises: ('e1f2a3b4c5d6', 'u1v2w3x4y5z6', 'a3f1e2d4c5b6')
Create Date: 2026-07-16 02:02:00.000000

Consolidates all parallel migration branches into single chain:
  - e1f2a3b4c5d6 (admin PIN columns)
  - u1v2w3x4y5z6 (merge: r9e8d7c6b5a4 + t6u7v8w9x0y1)
  - a3f1e2d4c5b6 (USDT send requests)

This eliminates the "Multiple head revisions" error.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = ('e1f2a3b4c5d6', 'u1v2w3x4y5z6', 'a3f1e2d4c5b6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
