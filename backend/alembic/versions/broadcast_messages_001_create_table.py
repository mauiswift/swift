"""Add broadcast_messages table for super admin urgent notices.

Revision ID: broadcast_messages_001
Revises: None
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'broadcast_messages_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'broadcast_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(256), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(32), nullable=False, server_default='info'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('show_on_all_pages', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_is_active_expires', 'broadcast_messages', ['is_active', 'expires_at'])
    op.create_index('idx_created_at_broadcast', 'broadcast_messages', ['created_at'])
    op.create_index('idx_priority', 'broadcast_messages', ['priority'])


def downgrade() -> None:
    op.drop_index('idx_priority', table_name='broadcast_messages')
    op.drop_index('idx_created_at_broadcast', table_name='broadcast_messages')
    op.drop_index('idx_is_active_expires', table_name='broadcast_messages')
    op.drop_table('broadcast_messages')
