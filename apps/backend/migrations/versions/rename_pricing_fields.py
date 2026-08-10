"""rename_pricing_fields

Revision ID: 001_rename_pricing_fields
Revises: cd037f9d732d
Create Date: 2026-08-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_rename_pricing_fields'
down_revision: Union[str, Sequence[str], None] = '9d98d1af99e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - rename pricing columns to clearer names."""
    # Rename base_price -> vendor_payout
    op.alter_column('products', 'base_price', new_column_name='vendor_payout')

    # Rename cost_price -> wholesale_price
    op.alter_column('products', 'cost_price', new_column_name='wholesale_price')

    # Rename price -> customer_price
    op.alter_column('products', 'price', new_column_name='customer_price')


def downgrade() -> None:
    """Downgrade schema - revert column name changes."""
    # Revert vendor_payout -> base_price
    op.alter_column('products', 'vendor_payout', new_column_name='base_price')

    # Revert wholesale_price -> cost_price
    op.alter_column('products', 'wholesale_price', new_column_name='cost_price')

    # Revert customer_price -> price
    op.alter_column('products', 'customer_price', new_column_name='price')
