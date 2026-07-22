"""add_approval_status_to_brands

Revision ID: cd037f9d732d
Revises: ec384794b63a
Create Date: 2026-07-10 05:06:57.206108

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd037f9d732d'
down_revision: Union[str, Sequence[str], None] = 'ec384794b63a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add approval_status column with default "approved" for existing records
    op.add_column('brands', sa.Column('approval_status', sa.String(20), nullable=False, server_default='approved'))
    # Create index for filtering by approval_status
    op.create_index('ix_brands_approval_status', 'brands', ['approval_status'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the index
    op.drop_index('ix_brands_approval_status', table_name='brands')
    # Drop the column
    op.drop_column('brands', 'approval_status')
