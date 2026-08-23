"""Add missing created_at column to offer_inventories

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-08-16 11:05:00.000000

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add created_at column to offer_inventories
    op.add_column(
        'offer_inventories',
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_column('offer_inventories', 'created_at')
