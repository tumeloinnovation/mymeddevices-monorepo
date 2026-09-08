"""Add order_number sequence for atomic order number generation

Revision ID: add_order_number_seq
Revises: d59e7e7fcc05
Create Date: 2026-08-13 14:00:00.000000

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'add_order_number_seq'
down_revision: Union[str, Sequence[str], None] = 'd59e7e7fcc05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add sequence for atomic order number generation."""
    # 1. Create a PostgreSQL sequence starting at 100000 (or max existing order_number + 1)
    # First, get the current max order_number to ensure we start above it
    connection = op.get_bind()
    max_order_result = connection.execute(sa.text("SELECT COALESCE(MAX(order_number), 99999) FROM orders"))
    max_order = max_order_result.scalar() or 99999
    start_value = max_order + 1

    # Create the sequence
    op.execute(sa.text(f"CREATE SEQUENCE order_number_seq START WITH {start_value} INCREMENT BY 1"))

    # 2. Set the sequence as the default value for order_number column
    # For new rows, order_number will default to nextval('order_number_seq')
    op.execute(sa.text("ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq')"))

    # 3. Set the sequence to start from the current max value
    # This ensures the next order gets order_number = max + 1
    op.execute(sa.text(f"SELECT setval('order_number_seq', {start_value}, false)"))

    # 4. Make order_number NOT NULL (since it now has a default)
    # First, update any NULL values to use the sequence
    op.execute(sa.text("""
        UPDATE orders
        SET order_number = nextval('order_number_seq')
        WHERE order_number IS NULL
    """))

    # Now make it NOT NULL
    op.alter_column('orders', 'order_number',
                    existing_type=sa.Integer(),
                    nullable=False,
                    existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema - Remove sequence and default."""
    # 1. Remove the default value from order_number
    op.execute(sa.text("ALTER TABLE orders ALTER COLUMN order_number DROP DEFAULT"))

    # 2. Make order_number nullable again (to match previous state)
    op.alter_column('orders', 'order_number',
                    existing_type=sa.Integer(),
                    nullable=True,
                    existing_nullable=False)

    # 3. Drop the sequence
    op.execute(sa.text("DROP SEQUENCE IF EXISTS order_number_seq"))
