"""add_payment_callbacks_table

Revision ID: 38a718d93274
Revises: 316a57955775
Create Date: 2026-06-15 14:04:45.831162

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '38a718d93274'
down_revision: Union[str, Sequence[str], None] = '316a57955775'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create payment_callbacks table for M-Pesa Daraja API callbacks
    op.create_table(
        'payment_callbacks',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('merchant_request_id', sa.String(length=100), nullable=True),
        sa.Column('checkout_request_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('result_code', sa.Integer(), nullable=True),
        sa.Column('result_description', sa.Text(), nullable=True),
        sa.Column('raw_callback', sa.JSON(), nullable=True),
        sa.Column('response_description', sa.Text(), nullable=True),
        sa.Column('callback_metadata', sa.JSON(), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=False),
        sa.Column('verification_error', sa.Text(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('headers', sa.JSON(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_callbacks_transaction'), 'payment_callbacks', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_payment_callbacks_status'), 'payment_callbacks', ['status'], unique=False)
    op.create_index(op.f('ix_payment_callbacks_merchant'), 'payment_callbacks', ['merchant_request_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_payment_callbacks_merchant'), table_name='payment_callbacks')
    op.drop_index(op.f('ix_payment_callbacks_status'), table_name='payment_callbacks')
    op.drop_index(op.f('ix_payment_callbacks_transaction'), table_name='payment_callbacks')
    op.drop_table('payment_callbacks')
