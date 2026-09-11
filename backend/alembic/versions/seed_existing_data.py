"""Seed existing user data with service_fee_percent and downline support.

Revision ID: seed_existing_data_001
Revises: (last migration)
Create Date: 2026-09-11 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime
from sqlalchemy.orm import sessionmaker

# revision identifiers, used by Alembic.
revision = 'seed_existing_data_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add service_fee_percent to existing admin users and create downline relationships."""
    bind = op.get_bind()
    Session = sessionmaker(bind=bind)
    session = Session()

    try:
        # Ensure admin_users table has service_fee_percent column
        connection = op.get_bind()
        inspector = sa.inspect(connection)
        admin_users_columns = [col['name'] for col in inspector.get_columns('admin_users')]
        
        if 'service_fee_percent' not in admin_users_columns:
            op.add_column('admin_users', 
                sa.Column('service_fee_percent', sa.Float, default=0.4, nullable=False, server_default='0.4'))

        # Update existing admin users with default service_fee_percent
        connection.execute(
            sa.text("""
                UPDATE admin_users 
                SET service_fee_percent = 0.4 
                WHERE service_fee_percent IS NULL
            """)
        )

        # Create downline table if it doesn't exist
        if not inspector.has_table('downline'):
            op.create_table(
                'downline',
                sa.Column('id', sa.Integer, primary_key=True),
                sa.Column('upline_user_id', sa.String(255), nullable=False),
                sa.Column('downline_user_id', sa.String(255), nullable=False),
                sa.Column('level', sa.Integer, default=1, nullable=False),
                sa.Column('is_direct', sa.Boolean, default=True, nullable=False),
                sa.Column('status', sa.String(50), default='active', nullable=False),
                sa.Column('total_commissions', sa.Float, default=0.0),
                sa.Column('pending_commissions', sa.Float, default=0.0),
                sa.Column('last_activity_at', sa.DateTime),
                sa.Column('created_at', sa.DateTime, default=datetime.utcnow, nullable=False),
                sa.Column('updated_at', sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False),
                sa.UniqueConstraint('upline_user_id', 'downline_user_id', name='uq_downline_relationship'),
                sa.Index('idx_upline_user_id', 'upline_user_id'),
                sa.Index('idx_downline_user_id', 'downline_user_id'),
            )

        # Seed example downline relationships from referral data
        # This assumes referral_links table exists
        inspector = sa.inspect(connection)
        if inspector.has_table('referral_links'):
            # Create relationships from referrer to users registered via referral link
            downline_exists = connection.execute(
                sa.text("SELECT COUNT(*) as cnt FROM downline")
            ).scalar()
            
            if downline_exists == 0:
                # Seed with example data if you have referral relationships
                # This is optional and depends on your actual data
                pass

        session.commit()
        print("✓ Service fee percent column added to admin_users")
        print("✓ Downline table created")
        print("✓ Schema migration complete")

    except Exception as e:
        session.rollback()
        print(f"✗ Error during seeding: {e}")
        raise
    finally:
        session.close()


def downgrade() -> None:
    """Downgrade: Remove service_fee_percent column and downline table."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Drop downline table if exists
    if inspector.has_table('downline'):
        op.drop_table('downline')
    
    # Remove service_fee_percent column if exists
    admin_users_columns = [col['name'] for col in inspector.get_columns('admin_users')]
    if 'service_fee_percent' in admin_users_columns:
        op.drop_column('admin_users', 'service_fee_percent')
