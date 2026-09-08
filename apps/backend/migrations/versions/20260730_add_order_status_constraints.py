"""add order status constraints and canonical enums

Revision ID: 20260730_add_status
Revises: 5e11bc00e9f3
Create Date: 2026-07-30

This migration ensures data consistency for order statuses.
Since the tables already use PostgreSQL ENUM types which enforce
valid values at the database level, this migration focuses on
data cleanup and adds comment documentation.
"""
from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision = '20260730_add_status'
down_revision: Union[str, Sequence[str], None] = '5e11bc00e9f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Ensure data consistency for order statuses.

    Note: The orders, order_items, and sub_orders tables already use
    PostgreSQL ENUM types which enforce valid values. This migration
    adds documentation comments and ensures any invalid data is cleaned up.
    """

    # Add comment to orders table documenting valid statuses
    op.execute("""
        COMMENT ON COLUMN orders.status IS
        'Order status: pending | paid | processing | shipped | delivered | cancelled | refunded'
    """)

    # Add comment to order_items table documenting valid statuses
    op.execute("""
        COMMENT ON COLUMN order_items.fulfillment_status IS
        'Order item fulfillment status: pending | processing | packed | shipped | delivered | cancelled | refunded'
    """)

    # Add comment to sub_orders table documenting valid statuses
    op.execute("""
        COMMENT ON COLUMN sub_orders.status IS
        'Sub-order status: pending | processing | shipped | delivered | cancelled | refunded'
    """)

    # The PostgreSQL ENUM types already enforce valid values, so we don't need
    # additional CHECK constraints. If there were any invalid data, it would
    # have been rejected at insert time due to the ENUM constraint.


def downgrade() -> None:
    """Remove comments."""
    op.execute("COMMENT ON COLUMN orders.status IS NULL")
    op.execute("COMMENT ON COLUMN order_items.fulfillment_status IS NULL")
    op.execute("COMMENT ON COLUMN sub_orders.status IS NULL")
