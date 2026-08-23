"""add zone configs table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-18 17:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'zone_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('zone_code', sa.String(length=20), nullable=False),
        sa.Column('zone_name', sa.String(length=100), nullable=False),
        sa.Column('center_latitude', sa.Float(), nullable=False),
        sa.Column('center_longitude', sa.Float(), nullable=False),
        sa.Column('radius_km', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('traffic_coefficient', sa.Float(), nullable=False, server_default='1.2'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_zone_configs')),
        sa.UniqueConstraint('zone_code', name=op.f('uq_zone_configs_zone_code')),
    )
    op.create_index(op.f('ix_zone_configs_zone_code'), 'zone_configs', ['zone_code'], unique=False)
    op.create_index(op.f('ix_zone_configs_is_active'), 'zone_configs', ['is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_zone_configs_is_active'), table_name='zone_configs')
    op.drop_index(op.f('ix_zone_configs_zone_code'), table_name='zone_configs')
    op.drop_table('zone_configs')
