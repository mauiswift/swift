"""Mark v8w9x0y1z2a3 as applied - it exists but was not recorded in migration history"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

revision: str = "zzz1_mark_v8w9x0y1z2a3"
down_revision: Union[str, Sequence[str], None] = "u7v8w9x0y1z2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Insert the missing migration record into alembic_version.
    This migration already ran on the database, but wasn't recorded.
    """
    bind = op.get_bind()
    # Check if the revision is already recorded
    result = bind.execute(
        text("SELECT 1 FROM alembic_version WHERE version_num = 'v8w9x0y1z2a3'")
    ).fetchone()
    
    if not result:
        # Insert it so Alembic knows it's applied
        op.execute(text("INSERT INTO alembic_version (version_num) VALUES ('v8w9x0y1z2a3')"))


def downgrade() -> None:
    """This revision is a no-op downgrade since v8w9x0y1z2a3 should stay applied."""
    pass

