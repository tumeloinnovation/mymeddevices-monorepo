"""add_payment_methods_table

Revision ID: 093af45eb8c9
Revises: 66e673fbbb40
Create Date: 2026-06-15 13:40:06.799039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '093af45eb8c9'
down_revision: Union[str, Sequence[str], None] = '66e673fbbb40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create payment_methods table (admin-configured payment methods)
    op.create_table(
        'payment_methods',
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('mpesa_shortcode', sa.String(length=20), nullable=True),
        sa.Column('mpesa_business_name', sa.String(length=100), nullable=True),
        sa.Column('mpesa_environment', sa.String(length=50), nullable=False),
        sa.Column('fee_type', sa.String(length=50), nullable=False),
        sa.Column('fee_value', sa.Float(), nullable=False),
        sa.Column('fee_min', sa.Float(), nullable=False),
        sa.Column('fee_max', sa.Float(), nullable=True),
        sa.Column('min_amount', sa.Float(), nullable=False),
        sa.Column('max_amount', sa.Float(), nullable=False),
        sa.Column('processing_time_seconds', sa.Integer(), nullable=False),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('display_label', sa.String(length=100), nullable=True),
        sa.Column('provider_metadata', sa.Text(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_methods_id'), 'payment_methods', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_payment_methods_id'), table_name='payment_methods')
    op.drop_table('payment_methods')
