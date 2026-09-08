"""remove_regulatory_fields_from_products

Revision ID: 49377325275c
Revises: a2b3c4d5e6f7
Create Date: 2026-08-16 14:22:29.088876

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49377325275c'
down_revision: Union[str, Sequence[str], None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_column("kmpdb_registration_number")
        batch_op.drop_column("ppb_classification")
        batch_op.drop_column("ce_marking_or_fda_clearance")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(sa.Column("kmpdb_registration_number", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("ppb_classification", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("ce_marking_or_fda_clearance", sa.String(length=255), nullable=True))
