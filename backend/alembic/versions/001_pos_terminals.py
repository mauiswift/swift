"""
No-op Alembic migration stub for missing revision `001_pos_terminals`.

This file exists to satisfy historical references in the migration graph
when the original migration file is missing from the repository. It performs
no schema changes.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_pos_terminals'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Intentionally no-op. This stub satisfies Alembic's revision graph.
    return


def downgrade() -> None:
    # No-op
    return
