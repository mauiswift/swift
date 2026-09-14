"""Add approval tracking fields to disbursements."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '20260913_add_approval_fields_to_disbursements'
down_revision = '20260910_recipient_phone'
branch_labels = None
depends_on = None


def upgrade():
    """Add note and approved_by columns to disbursements table."""
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("disbursements")}
    if "note" not in columns:
        op.add_column('disbursements', sa.Column('note', sa.String(), nullable=True))
    if "approved_by" not in columns:
        op.add_column('disbursements', sa.Column('approved_by', sa.String(), nullable=True))


def downgrade():
    """Remove note and approved_by columns from disbursements table."""
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("disbursements")}
    if "approved_by" in columns:
        op.drop_column('disbursements', 'approved_by')
    if "note" in columns:
        op.drop_column('disbursements', 'note')
