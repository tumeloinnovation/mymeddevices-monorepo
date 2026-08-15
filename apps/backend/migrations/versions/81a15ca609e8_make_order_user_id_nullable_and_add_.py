"""make_order_user_id_nullable_and_add_guest_token

Revision ID: 81a15ca609e8
Revises: 38a718d93274
Create Date: 2026-06-15 15:46:37.605478

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '81a15ca609e8'
down_revision: Union[str, Sequence[str], None] = '38a718d93274'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('orders', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)
    op.add_column('orders', sa.Column('guest_token', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_orders_guest_token'), 'orders', ['guest_token'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Note: downgrade might fail if there are rows with NULL user_id
    op.drop_index(op.f('ix_orders_guest_token'), table_name='orders')
    op.drop_column('orders', 'guest_token')
    op.alter_column('orders', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
