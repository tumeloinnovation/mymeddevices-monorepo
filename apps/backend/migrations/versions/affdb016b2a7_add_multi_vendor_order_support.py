"""add_multi_vendor_order_support

Revision ID: affdb016b2a7
Revises: cd037f9d732d
Create Date: 2026-07-30 07:51:52.988078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'affdb016b2a7'
down_revision: Union[str, None] = 'cd037f9d732d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create sub_orders table
    op.create_table(
        'sub_orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('parent_order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subtotal_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('tracking_number', sa.String(length=100), nullable=True),
        sa.Column('tracking_url', sa.String(length=500), nullable=True),
        sa.Column('shipped_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('vendor_notes', sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(['parent_order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_sub_orders_parent_order', 'sub_orders', ['parent_order_id'])
    op.create_index('ix_sub_orders_vendor', 'sub_orders', ['vendor_id'])
    op.create_index('ix_sub_orders_status', 'sub_orders', ['status'])
    op.create_index('ix_sub_orders_parent_vendor', 'sub_orders', ['parent_order_id', 'vendor_id'])

    # Add sub_order_id to order_items
    op.add_column('order_items',
        sa.Column('sub_order_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_index('ix_order_items_sub_order_id', 'order_items', ['sub_order_id'])
    op.create_foreign_key('order_items_sub_order_id_fkey', 'order_items', 'sub_orders', ['sub_order_id'], ['id'], ondelete='CASCADE')

    # Create vendor_ledgers table
    op.create_table(
        'vendor_ledgers',
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('balance', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0.00'),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('vendor_id')
    )
    op.create_index('ix_vendor_ledgers_vendor_id', 'vendor_ledgers', ['vendor_id'])

    # Create ledger_transactions table
    op.create_table(
        'ledger_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sub_order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('gross_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('platform_fee_rate', sa.Numeric(precision=5, scale=4), nullable=False, server_default='0.1000'),
        sa.Column('platform_fee_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('net_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('transaction_type', sa.String(length=20), nullable=False, server_default='credit'),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('processed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sub_order_id'], ['sub_orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['processed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ledger_transactions_vendor_id', 'ledger_transactions', ['vendor_id'])
    op.create_index('ix_ledger_transactions_sub_order_id', 'ledger_transactions', ['sub_order_id'])
    op.create_index('ix_ledger_transactions_type', 'ledger_transactions', ['transaction_type'])
    op.create_index('ix_ledger_transactions_reference_id', 'ledger_transactions', ['reference_id'])

    # Create stock_logs table
    op.create_table(
        'stock_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quantity_change', sa.Integer(), nullable=False),
        sa.Column('previous_quantity', sa.Integer(), nullable=False),
        sa.Column('new_quantity', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=20), nullable=False),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('processed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendor_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['processed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_stock_logs_product_id', 'stock_logs', ['product_id'])
    op.create_index('ix_stock_logs_vendor_id', 'stock_logs', ['vendor_id'])
    op.create_index('ix_stock_logs_reason', 'stock_logs', ['reason'])
    op.create_index('ix_stock_logs_reference_id', 'stock_logs', ['reference_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop in reverse order of creation
    op.drop_table('stock_logs')
    op.drop_table('ledger_transactions')
    op.drop_table('vendor_ledgers')

    # Remove sub_order_id from order_items
    op.drop_constraint('order_items_sub_order_id_fkey', 'order_items')
    op.drop_index('ix_order_items_sub_order_id', 'order_items')
    op.drop_column('order_items', 'sub_order_id')

    op.drop_table('sub_orders')

