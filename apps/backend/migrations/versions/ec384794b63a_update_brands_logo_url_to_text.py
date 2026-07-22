"""update_brands_logo_url_to_text

Revision ID: ec384794b63a
Revises: f6bf3bd8e0a5
Create Date: 2026-07-09 18:56:41.283735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'ec384794b63a'
down_revision: Union[str, Sequence[str], None] = '3ea050a8e91b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Change logo_url from VARCHAR(500) to TEXT to support base64 data URIs
    op.execute("ALTER TABLE brands ALTER COLUMN logo_url TYPE TEXT")


def downgrade() -> None:
    """Downgrade schema."""
    # Revert back to VARCHAR(500)
    op.execute("ALTER TABLE brands ALTER COLUMN logo_url TYPE VARCHAR(500)")
