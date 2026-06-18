"""add_place_id_to_addresses

Revision ID: 0627d3c3e41e
Revises: 38e8e1ae1db1
Create Date: 2026-06-15 19:52:27.065761

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0627d3c3e41e'
down_revision: Union[str, Sequence[str], None] = '38e8e1ae1db1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add place_id column to addresses table."""
    op.add_column('addresses', sa.Column('place_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_addresses_place_id'), 'addresses', ['place_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema - Remove place_id column from addresses table."""
    op.drop_index(op.f('ix_addresses_place_id'), table_name='addresses')
    op.drop_column('addresses', 'place_id')
