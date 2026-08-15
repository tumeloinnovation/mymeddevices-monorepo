"""remove_compare_at_price

Revision ID: 35fd07218952
Revises: b4d0b13eb535
Create Date: 2026-06-25 19:07:42.736830

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '35fd07218952'
down_revision: Union[str, Sequence[str], None] = 'b4d0b13eb535'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('products', 'compare_at_price')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('products', sa.Column('compare_at_price', sa.NUMERIC(precision=12, scale=2), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
