"""add order item fulfillment fields

Revision ID: d0e84711c147
Revises: 81a15ca609e8
Create Date: 2026-06-15 17:10:29.028358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd0e84711c147'
down_revision: Union[str, Sequence[str], None] = '81a15ca609e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add OrderItem fulfillment fields for vendor tracking."""
    # Add fulfillment status, tracking number, and tracking URL to order items
    op.add_column('order_items', sa.Column('fulfillment_status', sa.String(length=20), server_default='pending', nullable=False))
    op.add_column('order_items', sa.Column('tracking_number', sa.String(length=100), nullable=True))
    op.add_column('order_items', sa.Column('tracking_url', sa.String(length=500), nullable=True))
    op.create_index(op.f('ix_order_items_fulfillment_status'), 'order_items', ['fulfillment_status'], unique=False)


def downgrade() -> None:
    """Downgrade schema - remove OrderItem fulfillment fields."""
    # Remove fulfillment status, tracking number, and tracking URL from order items
    op.drop_index(op.f('ix_order_items_fulfillment_status'), table_name='order_items')
    op.drop_column('order_items', 'tracking_url')
    op.drop_column('order_items', 'tracking_number')
    op.drop_column('order_items', 'fulfillment_status')
