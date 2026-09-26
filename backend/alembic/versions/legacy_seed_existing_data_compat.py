"""Compatibility revision for databases stamped with the removed legacy seed migration.

The schema changes are handled by dedicated migrations. Keep this revision ID
available so existing databases can continue traversing the Alembic graph.
"""

revision = "seed_existing_data_001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
