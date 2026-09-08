"""add logistics domain tables

Revision ID: 4e3658f51ed4
Revises: b0cbe34fa4ae
Create Date: 2026-08-18 16:57:27.375552

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4e3658f51ed4'
down_revision: Union[str, Sequence[str], None] = 'b0cbe34fa4ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create deliveries table
    op.create_table(
        'deliveries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('logistics_type', sa.Enum('company_rider', 'courier', 'self_pickup', name='logisticstype'), nullable=False),
        sa.Column('status', sa.Enum('created', 'assigned', 'routed', 'at_vendor', 'in_transit', 'nearby', 'delivered', 'failed_attempt', 'cancelled', 'exception', name='deliverystatus'), nullable=False),
        sa.Column('assigned_driver_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('route_coordinates', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('calculated_distance_km', sa.Float(), nullable=True),
        sa.Column('estimated_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('delivery_address', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('tracking_number', sa.String(length=100), nullable=True),
        sa.Column('tracking_url', sa.String(length=500), nullable=True),
        sa.Column('carrier', sa.String(length=50), nullable=True),
        sa.Column('estimated_delivery', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_delivery', sa.DateTime(timezone=True), nullable=True),
        sa.Column('shipping_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('delivery_notes', sa.String(length=500), nullable=True),
        sa.Column('customer_phone', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], name=op.f('fk_deliveries_order_id'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_driver_id'], ['users.id'], name=op.f('fk_deliveries_assigned_driver_id'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_deliveries')),
        sa.UniqueConstraint('tracking_number', name=op.f('uq_deliveries_tracking_number')),
    )
    op.create_index(op.f('ix_deliveries_assigned_driver_id'), 'deliveries', ['assigned_driver_id'], unique=False)
    op.create_index(op.f('ix_deliveries_logistics_type'), 'deliveries', ['logistics_type'], unique=False)
    op.create_index(op.f('ix_deliveries_order_id'), 'deliveries', ['order_id'], unique=False)
    op.create_index(op.f('ix_deliveries_status'), 'deliveries', ['status'], unique=False)

    # Create delivery_stops table
    op.create_table(
        'delivery_stops',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('delivery_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stop_sequence', sa.Integer(), nullable=False),
        sa.Column('stop_type', sa.String(length=50), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('vendor_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='pending'),
        sa.Column('arrived_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('departed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], name=op.f('fk_delivery_stops_delivery_id'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.id'], name=op.f('fk_delivery_stops_vendor_id'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_delivery_stops')),
    )
    op.create_index(op.f('ix_delivery_stops_delivery_id'), 'delivery_stops', ['delivery_id'], unique=False)

    # Create delivery_proofs table
    op.create_table(
        'delivery_proofs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('delivery_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('proof_type', sa.Enum('signature', 'photo', 'gps_coordinate', 'notes', name='prooftype'), nullable=False),
        sa.Column('proof_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('captured_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('captured_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], name=op.f('fk_delivery_proofs_delivery_id'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['captured_by_user_id'], ['users.id'], name=op.f('fk_delivery_proofs_captured_by_user_id'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_delivery_proofs')),
    )
    op.create_index(op.f('ix_delivery_proofs_delivery_id'), 'delivery_proofs', ['delivery_id'], unique=False)

    # Create driver_profiles table
    op.create_table(
        'driver_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('available', 'busy', 'offline', 'on_break', name='driverstatus'), nullable=False, server_default='offline'),
        sa.Column('vehicle_type', sa.String(length=50), nullable=True),
        sa.Column('vehicle_plate', sa.String(length=20), nullable=True),
        sa.Column('vehicle_color', sa.String(length=50), nullable=True),
        sa.Column('current_latitude', sa.Float(), nullable=True),
        sa.Column('current_longitude', sa.Float(), nullable=True),
        sa.Column('total_deliveries', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('successful_deliveries', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_rating', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_driver_profiles_user_id'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_driver_profiles')),
        sa.UniqueConstraint('user_id', name=op.f('uq_driver_profiles_user_id')),
    )
    op.create_index(op.f('ix_driver_profiles_status'), 'driver_profiles', ['status'], unique=False)
    op.create_index(op.f('ix_driver_profiles_user_id'), 'driver_profiles', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_driver_profiles_user_id'), table_name='driver_profiles')
    op.drop_index(op.f('ix_driver_profiles_status'), table_name='driver_profiles')
    op.drop_table('driver_profiles')

    op.drop_index(op.f('ix_delivery_proofs_delivery_id'), table_name='delivery_proofs')
    op.drop_table('delivery_proofs')

    op.drop_index(op.f('ix_delivery_stops_delivery_id'), table_name='delivery_stops')
    op.drop_table('delivery_stops')

    op.drop_index(op.f('ix_deliveries_status'), table_name='deliveries')
    op.drop_index(op.f('ix_deliveries_order_id'), table_name='deliveries')
    op.drop_index(op.f('ix_deliveries_logistics_type'), table_name='deliveries')
    op.drop_index(op.f('ix_deliveries_assigned_driver_id'), table_name='deliveries')
    op.drop_table('deliveries')
