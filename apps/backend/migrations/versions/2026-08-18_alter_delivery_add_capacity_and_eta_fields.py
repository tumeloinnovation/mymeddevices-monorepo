"""alter delivery add capacity and eta fields

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-08-18 17:03:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6g7h8i9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6g7h8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add capacity fields for vehicle matching
    op.add_column('deliveries', sa.Column('weight_kg', sa.Float(), nullable=True))
    op.add_column('deliveries', sa.Column('volume_m3', sa.Float(), nullable=True))

    # Add multi-drop support fields
    op.add_column('deliveries', sa.Column('drop_sequence', sa.Integer(), nullable=True))
    op.add_column('deliveries', sa.Column('multi_drop_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Add priority and ETA fields
    op.add_column('deliveries', sa.Column('priority', sa.String(length=20), nullable=False, server_default='normal'))
    op.add_column('deliveries', sa.Column('traffic_coefficient', sa.Float(), nullable=True))
    op.add_column('deliveries', sa.Column('estimated_arrival_at_pickup', sa.DateTime(timezone=True), nullable=True))

    # Create indexes for multi-drop and priority queries
    op.create_index('ix_deliveries_multi_drop_id', 'deliveries', ['multi_drop_id'], unique=False, postgresql_where='multi_drop_id IS NOT NULL')
    op.create_index(op.f('ix_deliveries_priority'), 'deliveries', ['priority', 'status'], unique=False)

    # Add priority constraint
    op.execute("ALTER TABLE deliveries ADD CONSTRAINT chk_deliveries_priority CHECK (priority IN ('urgent', 'normal', 'low'))")

    # Set default priority for existing records
    op.execute("UPDATE deliveries SET priority = 'normal' WHERE priority IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS chk_deliveries_priority")

    op.drop_index(op.f('ix_deliveries_priority'), table_name='deliveries')
    op.drop_index('ix_deliveries_multi_drop_id', table_name='deliveries')

    op.drop_column('deliveries', 'estimated_arrival_at_pickup')
    op.drop_column('deliveries', 'traffic_coefficient')
    op.drop_column('deliveries', 'priority')
    op.drop_column('deliveries', 'multi_drop_id')
    op.drop_column('deliveries', 'drop_sequence')
    op.drop_column('deliveries', 'volume_m3')
    op.drop_column('deliveries', 'weight_kg')
