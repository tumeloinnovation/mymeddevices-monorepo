"""Fix orderstatus and shipmentstatus enum values to lowercase

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-08-23 16:40:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # 1. Update orderstatus enum
        op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(50) USING LOWER(status::text)")
        op.execute("DROP TYPE IF EXISTS orderstatus")
        op.execute(
            "CREATE TYPE orderstatus AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')"
        )
        op.execute("ALTER TABLE orders ALTER COLUMN status TYPE orderstatus USING status::orderstatus")
        op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::orderstatus")

        # 2. Update shipmentstatus enum
        op.execute("ALTER TABLE shipments ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE shipments ALTER COLUMN status TYPE VARCHAR(50) USING LOWER(status::text)")
        op.execute("DROP TYPE IF EXISTS shipmentstatus")
        op.execute(
            "CREATE TYPE shipmentstatus AS ENUM ('created', 'in_transit', 'delivered', 'exception')"
        )
        op.execute("ALTER TABLE shipments ALTER COLUMN status TYPE shipmentstatus USING status::shipmentstatus")
        op.execute("ALTER TABLE shipments ALTER COLUMN status SET DEFAULT 'created'::shipmentstatus")


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # 1. Downgrade orderstatus enum
        op.execute("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(50) USING UPPER(status::text)")
        op.execute("DROP TYPE IF EXISTS orderstatus")
        op.execute(
            "CREATE TYPE orderstatus AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')"
        )
        op.execute("ALTER TABLE orders ALTER COLUMN status TYPE orderstatus USING status::orderstatus")
        op.execute("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PENDING'::orderstatus")

        # 2. Downgrade shipmentstatus enum
        op.execute("ALTER TABLE shipments ALTER COLUMN status DROP DEFAULT")
        op.execute("ALTER TABLE shipments ALTER COLUMN status TYPE VARCHAR(50) USING UPPER(status::text)")
        op.execute("DROP TYPE IF EXISTS shipmentstatus")
        op.execute(
            "CREATE TYPE shipmentstatus AS ENUM ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION')"
        )
        op.execute("ALTER TABLE shipments ALTER COLUMN status TYPE shipmentstatus USING status::shipmentstatus")
        op.execute("ALTER TABLE shipments ALTER COLUMN status SET DEFAULT 'CREATED'::shipmentstatus")
