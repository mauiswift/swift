"""add reports table

Revision ID: reports_001
Revises: fa274bd5907b
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'reports_001'
down_revision = 'fa274bd5907b'
branch_labels = None
depends_on = None


def upgrade():
    # Create the reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(255), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('report_type', sa.String(), nullable=False),
        sa.Column('report_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('file_url', sa.String(), nullable=True),
        sa.Column('summary', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_report_date'), 'reports', ['report_date'], unique=False)
    op.create_index(op.f('ix_reports_report_type'), 'reports', ['report_type'], unique=False)
    op.create_index(op.f('ix_reports_user_id'), 'reports', ['user_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_reports_user_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_report_type'), table_name='reports')
    op.drop_index(op.f('ix_reports_report_date'), table_name='reports')
    op.drop_table('reports')
