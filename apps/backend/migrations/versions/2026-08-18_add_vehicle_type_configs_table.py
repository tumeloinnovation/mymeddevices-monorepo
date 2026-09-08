"""add vehicle type configs table

Revision ID: a1b2c3d4e5f6
Revises: 4e3658f51ed4
Create Date: 2026-08-18 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '4e3658f51ed4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'vehicle_type_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vehicle_type', sa.String(length=50), nullable=False),
        sa.Column('max_weight_kg', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('max_volume_m3', sa.Float(), nullable=False, server_default='0.1'),
        sa.Column('max_concurrent_deliveries', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('base_speed_kmh', sa.Float(), nullable=False, server_default='30.0'),
        sa.Column('traffic_factor', sa.Float(), nullable=False, server_default='1.5'),
        sa.Column('suitable_for_fridge', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('min_radius_km', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('max_radius_km', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_vehicle_type_configs')),
        sa.UniqueConstraint('vehicle_type', name=op.f('uq_vehicle_type_configs_vehicle_type')),
    )
    op.create_index(op.f('ix_vehicle_type_configs_vehicle_type'), 'vehicle_type_configs', ['vehicle_type'], unique=False)
    op.create_index(op.f('ix_vehicle_type_configs_is_active'), 'vehicle_type_configs', ['is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_vehicle_type_configs_is_active'), table_name='vehicle_type_configs')
    op.drop_index(op.f('ix_vehicle_type_configs_vehicle_type'), table_name='vehicle_type_configs')
    op.drop_table('vehicle_type_configs')
