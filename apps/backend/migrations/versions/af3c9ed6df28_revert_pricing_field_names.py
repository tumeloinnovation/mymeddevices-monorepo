"""revert_pricing_field_names

Revision ID: af3c9ed6df28
Revises: 001_rename_pricing_fields
Create Date: 2026-08-09 12:27:50.464023

"""
from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'af3c9ed6df28'
down_revision: Union[str, Sequence[str], None] = '001_rename_pricing_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Revert pricing column names back to original names."""
    # Revert vendor_payout -> base_price
    op.alter_column('products', 'vendor_payout', new_column_name='base_price')

    # Revert customer_price -> price
    op.alter_column('products', 'customer_price', new_column_name='price')

    # Revert wholesale_price -> cost_price
    op.alter_column('products', 'wholesale_price', new_column_name='cost_price')


def downgrade() -> None:
    """Re-apply the renamed column names."""
    # Re-apply base_price -> vendor_payout
    op.alter_column('products', 'base_price', new_column_name='vendor_payout')

    # Re-apply price -> customer_price
    op.alter_column('products', 'price', new_column_name='customer_price')

    # Re-apply cost_price -> wholesale_price
    op.alter_column('products', 'cost_price', new_column_name='wholesale_price')
