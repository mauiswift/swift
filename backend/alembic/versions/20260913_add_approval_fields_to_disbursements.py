"""Add approval tracking fields to disbursements."""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260913_add_approval_fields_to_disbursements'
down_revision = '20260910_add_recipient_phone_to_disbursements'
branch_labels = None
depends_on = None


def upgrade():
    """Add note and approved_by columns to disbursements table."""
    op.add_column('disbursements', sa.Column('note', sa.String(), nullable=True))
    op.add_column('disbursements', sa.Column('approved_by', sa.String(), nullable=True))


def downgrade():
    """Remove note and approved_by columns from disbursements table."""
    op.drop_column('disbursements', 'approved_by')
    op.drop_column('disbursements', 'note')
