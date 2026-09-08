"""merge migration heads

Revision ID: ffd99724335f
Revises: 50eb45e3690b, add_mobile_money_payments, add_order_number_seq
Create Date: 2026-08-13 22:06:45.567932

"""
from collections.abc import Sequence
from typing import Union

# revision identifiers, used by Alembic.
revision: str = 'ffd99724335f'
down_revision: Union[str, Sequence[str], None] = ('50eb45e3690b', 'add_mobile_money_payments', 'add_order_number_seq')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
