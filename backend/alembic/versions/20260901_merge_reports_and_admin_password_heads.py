"""Merge the reports migration and main-admin password migration heads.

This file resolves the multiple-head Alembic graph that was created by unrelated
branches being merged at different times. It keeps the migration chain linear so
startup can run without the "Multiple head revisions are present" error.
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "admin_reports_merge"
down_revision: Union[str, Sequence[str], None] = (
    "reports_001",
    "20260901_set_main_admin_password",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
