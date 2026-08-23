"""add_created_at_to_ledger_and_stock_logs

Revision ID: b0cbe34fa4ae
Revises: 49377325275c
Create Date: 2026-08-17 12:40:33.319592

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0cbe34fa4ae'
down_revision: Union[str, Sequence[str], None] = ('49377325275c', 'affdb016b2a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();")
    op.execute("ALTER TABLE stock_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE ledger_transactions DROP COLUMN IF EXISTS created_at;")
    op.execute("ALTER TABLE stock_logs DROP COLUMN IF EXISTS created_at;")
