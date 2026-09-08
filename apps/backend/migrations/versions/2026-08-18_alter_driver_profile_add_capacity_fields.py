"""alter driver profile add capacity fields

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-08-18 17:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add capacity tracking fields
    op.add_column('driver_profiles', sa.Column('max_concurrent_deliveries', sa.Integer(), nullable=False, server_default='3'))
    op.add_column('driver_profiles', sa.Column('current_deliveries_count', sa.Integer(), nullable=False, server_default='0'))

    # Add location fallback fields
    op.add_column('driver_profiles', sa.Column('home_base_latitude', sa.Float(), nullable=True))
    op.add_column('driver_profiles', sa.Column('home_base_longitude', sa.Float(), nullable=True))
    op.add_column('driver_profiles', sa.Column('last_known_latitude', sa.Float(), nullable=True))
    op.add_column('driver_profiles', sa.Column('last_known_longitude', sa.Float(), nullable=True))
    op.add_column('driver_profiles', sa.Column('last_location_update_at', sa.DateTime(timezone=True), nullable=True))

    # Add vehicle capacity fields
    op.add_column('driver_profiles', sa.Column('vehicle_capacity_weight_kg', sa.Float(), nullable=True))
    op.add_column('driver_profiles', sa.Column('vehicle_capacity_volume_m3', sa.Float(), nullable=True))
    op.add_column('driver_profiles', sa.Column('preferred_zone', sa.String(length=50), nullable=True))
    op.add_column('driver_profiles', sa.Column('verified_vehicle', sa.Boolean(), nullable=False, server_default='false'))

    # Create indexes for performance
    op.create_index(op.f('ix_driver_profiles_status_capacity'), 'driver_profiles', ['status', 'current_deliveries_count'], unique=False)
    op.create_index('ix_driver_profiles_preferred_zone', 'driver_profiles', ['preferred_zone'], unique=False, postgresql_where='preferred_zone IS NOT NULL')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_driver_profiles_preferred_zone', table_name='driver_profiles')
    op.drop_index(op.f('ix_driver_profiles_status_capacity'), table_name='driver_profiles')

    op.drop_column('driver_profiles', 'verified_vehicle')
    op.drop_column('driver_profiles', 'preferred_zone')
    op.drop_column('driver_profiles', 'vehicle_capacity_volume_m3')
    op.drop_column('driver_profiles', 'vehicle_capacity_weight_kg')
    op.drop_column('driver_profiles', 'last_location_update_at')
    op.drop_column('driver_profiles', 'last_known_longitude')
    op.drop_column('driver_profiles', 'last_known_latitude')
    op.drop_column('driver_profiles', 'home_base_longitude')
    op.drop_column('driver_profiles', 'home_base_latitude')
    op.drop_column('driver_profiles', 'current_deliveries_count')
    op.drop_column('driver_profiles', 'max_concurrent_deliveries')
