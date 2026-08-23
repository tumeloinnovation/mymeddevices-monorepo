"""Fix outboxstatus enum values and add dead_letter

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-08-23 16:30:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "d0e1f2a3b4c5"
down_revision: Union[str, Sequence[str], None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # Safely convert outboxstatus enum in Postgres to lowercase with dead_letter support
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status TYPE VARCHAR(50) USING LOWER(status::text)")
        op.execute("DROP TYPE IF EXISTS outboxstatus")
        op.execute("CREATE TYPE outboxstatus AS ENUM ('pending', 'processed', 'failed', 'dead_letter')")
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status TYPE outboxstatus USING status::outboxstatus")
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status SET DEFAULT 'pending'::outboxstatus")


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status TYPE VARCHAR(50) USING UPPER(status::text)")
        op.execute("DROP TYPE IF EXISTS outboxstatus")
        op.execute("CREATE TYPE outboxstatus AS ENUM ('PENDING', 'PROCESSED', 'FAILED')")
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status TYPE outboxstatus USING status::outboxstatus")
        op.execute("ALTER TABLE outbox_events ALTER COLUMN status SET DEFAULT 'PENDING'::outboxstatus")
