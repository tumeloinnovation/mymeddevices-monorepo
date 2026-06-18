"""merge_migration_heads

Revision ID: a8cd8b55d129
Revises: 91004e18ddae, b6a9c1d2e3f4
Create Date: 2026-06-14 22:01:28.222292

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8cd8b55d129'
down_revision: Union[str, Sequence[str], None] = ('91004e18ddae', 'b6a9c1d2e3f4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
