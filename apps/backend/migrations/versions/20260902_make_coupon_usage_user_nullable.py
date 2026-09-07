"""Make coupon_usages.user_id nullable for guest checkout usage tracking

Guest checkouts now record coupon usage (so global usage limits hold for
guests) without an associated user account.

NOTE: this revision chains onto a1b2c3d4e5f6 (add_user_notifications).
The migration graph currently contains a cycle among the 2026-08-18..25
logistics/notification revisions which must be repaired before `alembic
upgrade head` can run.

Revision ID: c4e6a8f0b2d4
Revises: a1b2c3d4e5f6
Create Date: 2026-09-02

"""

from collections.abc import Sequence
from typing import Union

from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c4e6a8f0b2d4"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "coupon_usages",
        "user_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    # Delete guest usage rows first so the NOT NULL constraint can be restored
    op.execute("DELETE FROM coupon_usages WHERE user_id IS NULL")
    op.alter_column(
        "coupon_usages",
        "user_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
