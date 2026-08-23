"""remediation cart variants and integrity

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-08-15 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd9e0f1a2b3c4'
down_revision: Union[str, None] = 'c8d9e0f1a2b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add product_variant_id to cart_items table
    with op.batch_alter_table('cart_items', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('product_variant_id', postgresql.UUID(as_uuid=True), nullable=True)
        )
        batch_op.create_foreign_key(
            'fk_cart_items_product_variant_id',
            'product_variants',
            ['product_variant_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_index(
            'ix_cart_items_product_variant_id',
            ['product_variant_id'],
            unique=False,
        )
        batch_op.create_unique_constraint(
            'uq_cart_items_cart_product_variant',
            ['cart_id', 'product_id', 'product_variant_id'],
        )

    # 2. Modify ticket_replies.user_id to SET NULL on delete
    with op.batch_alter_table('ticket_replies', schema=None) as batch_op:
        batch_op.alter_column('user_id', existing_type=postgresql.UUID(as_uuid=True), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('ticket_replies', schema=None) as batch_op:
        batch_op.alter_column('user_id', existing_type=postgresql.UUID(as_uuid=True), nullable=False)

    with op.batch_alter_table('cart_items', schema=None) as batch_op:
        batch_op.drop_constraint('uq_cart_items_cart_product_variant', type_='unique')
        batch_op.drop_index('ix_cart_items_product_variant_id')
        batch_op.drop_constraint('fk_cart_items_product_variant_id', type_='foreignkey')
        batch_op.drop_column('product_variant_id')
