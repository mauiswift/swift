"""Add admin_notifications table for super admin dashboard alerts.

Revision ID: admin_notifications_001
Revises: 
Create Date: 2026-08-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'admin_notifications_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'admin_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.String(64), nullable=False),
        sa.Column('notification_type', sa.String(64), nullable=False),
        sa.Column('title', sa.String(256), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('user_id', sa.String(64), nullable=True),
        sa.Column('user_name', sa.String(256), nullable=True),
        sa.Column('resource_type', sa.String(64), nullable=True),
        sa.Column('resource_id', sa.String(256), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('priority', sa.String(16), nullable=False, server_default='normal'),
        sa.Column('action_url', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_admin_id_read', 'admin_notifications', ['admin_id', 'is_read'])
    op.create_index('idx_created_at', 'admin_notifications', ['created_at'])
    op.create_index('idx_notification_type', 'admin_notifications', ['notification_type'])


def downgrade() -> None:
    op.drop_index('idx_notification_type', table_name='admin_notifications')
    op.drop_index('idx_created_at', table_name='admin_notifications')
    op.drop_index('idx_admin_id_read', table_name='admin_notifications')
    op.drop_table('admin_notifications')
