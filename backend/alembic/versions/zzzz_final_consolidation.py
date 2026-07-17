"""Final consolidation of all migration heads

Revision ID: zzzz_final_consolidation
Revises: 001, 855c2ec2a47f, z9999_merge_heads, z9y8x7w6v5u4, add_uq_api_configs_service_key, t6u7v8w9x0y1
Create Date: 2026-07-16 21:15:00.000000

This migration merges all divergent branches into a single linear head.
Broken cycle at u1v2w3x4y5z6 (removed t6u7v8w9x0y1 dependency).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'zzzz_final_consolidation'
down_revision: Union[str, Sequence[str], None] = (
    '001',
    '855c2ec2a47f',
    'z9999_merge_heads',
    'z9y8x7w6v5u4',
    'add_uq_api_configs_service_key',
    't6u7v8w9x0y1',
    '001_pos_terminals'
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
