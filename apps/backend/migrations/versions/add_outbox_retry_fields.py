"""Add retry_count, max_retries, last_error, next_retry_at to outbox_events

Revision ID: b7a9c812d34e
Revises: ffd99724335f
Create Date: 2026-08-14 14:30:00.000000

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b7a9c812d34e'
down_revision: Union[str, Sequence[str], None] = 'ffd99724335f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add retry and error columns to outbox_events table if it exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "outbox_events" in tables:
        columns = [c["name"] for c in inspector.get_columns("outbox_events")]
        if "retry_count" not in columns:
            op.add_column("outbox_events", sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False))
        if "max_retries" not in columns:
            op.add_column("outbox_events", sa.Column("max_retries", sa.Integer(), server_default="5", nullable=False))
        if "last_error" not in columns:
            op.add_column("outbox_events", sa.Column("last_error", sa.Text(), nullable=True))
        if "next_retry_at" not in columns:
            op.add_column("outbox_events", sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True))
            op.create_index("ix_outbox_events_next_retry_at", "outbox_events", ["next_retry_at"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "outbox_events" in tables:
        columns = [c["name"] for c in inspector.get_columns("outbox_events")]
        if "next_retry_at" in columns:
            op.drop_index("ix_outbox_events_next_retry_at", table_name="outbox_events")
            op.drop_column("outbox_events", "next_retry_at")
        if "last_error" in columns:
            op.drop_column("outbox_events", "last_error")
        if "max_retries" in columns:
            op.drop_column("outbox_events", "max_retries")
        if "retry_count" in columns:
            op.drop_column("outbox_events", "retry_count")
