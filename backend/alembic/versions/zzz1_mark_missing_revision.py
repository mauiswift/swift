"""Compatibility marker after the wallet permission migration."""

from typing import Sequence, Union

from alembic import op

revision: str = "zzz1_mark_v8w9x0y1z2a3"
down_revision: Union[str, Sequence[str], None] = "v8w9x0y1z2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Keep a linear migration path after the wallet permission migration."""
    pass


def downgrade() -> None:
    """No schema changes are introduced by this compatibility marker."""
    pass
