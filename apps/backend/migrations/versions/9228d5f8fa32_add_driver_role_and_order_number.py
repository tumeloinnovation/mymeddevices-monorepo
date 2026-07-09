"""add_driver_role_and_order_number

Revision ID: 9228d5f8fa32
Revises: f6bf3bd8e0a5
Create Date: 2026-06-26 13:52:08.175422

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9228d5f8fa32'
down_revision: Union[str, Sequence[str], None] = 'f6bf3bd8e0a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Update check constraint for user role
    op.drop_constraint("check_user_role", "users", type_="check")
    op.create_check_constraint(
        "check_user_role",
        "users",
        "role IN ('admin', 'worker', 'vendor', 'customer', 'guest', 'driver')"
    )

    # 2. Add order_number column
    op.add_column('orders', sa.Column('order_number', sa.Integer(), nullable=True))

    # 3. Backfill order numbers for existing orders
    connection = op.get_bind()
    # Check if there are any orders first
    res = connection.execute(sa.text("SELECT COUNT(*) FROM orders")).scalar()
    if res and res > 0:
        connection.execute(sa.text(
            "WITH numbered_orders AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 100000 as rnum FROM orders) "
            "UPDATE orders SET order_number = numbered_orders.rnum FROM numbered_orders WHERE orders.id = numbered_orders.id"
        ))

    # 4. Create unique index on order_number
    op.create_index(op.f('ix_orders_order_number'), 'orders', ['order_number'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Revert order_number unique index and column
    op.drop_index(op.f('ix_orders_order_number'), table_name='orders')
    op.drop_column('orders', 'order_number')

    # 2. Revert check constraint for user role
    op.drop_constraint("check_user_role", "users", type_="check")
    op.create_check_constraint(
        "check_user_role",
        "users",
        "role IN ('admin', 'worker', 'vendor', 'customer', 'guest')"
    )
