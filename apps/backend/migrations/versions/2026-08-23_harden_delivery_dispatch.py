"""harden delivery dispatch

Revision ID: a7b8c9d0e1f2
Revises: f6g7h8i9j0k1
Create Date: 2026-08-23 00:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f6g7h8i9j0k1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add idempotency key and prevent duplicate active deliveries."""
    op.add_column(
        "deliveries",
        sa.Column("dispatch_idempotency_key", sa.String(length=100), nullable=True),
    )
    op.create_unique_constraint(
        "uq_deliveries_dispatch_idempotency_key",
        "deliveries",
        ["dispatch_idempotency_key"],
    )
    op.create_index(
        "uq_deliveries_order_active",
        "deliveries",
        ["order_id"],
        unique=True,
        postgresql_where=sa.text("is_deleted IS NOT TRUE"),
    )


def downgrade() -> None:
    """Remove dispatch hardening constraints."""
    op.drop_index("uq_deliveries_order_active", table_name="deliveries")
    op.drop_constraint("uq_deliveries_dispatch_idempotency_key", "deliveries", type_="unique")
    op.drop_column("deliveries", "dispatch_idempotency_key")
