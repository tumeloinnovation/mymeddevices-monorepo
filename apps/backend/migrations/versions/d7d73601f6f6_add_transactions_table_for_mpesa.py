"""add_transactions_table_for_mpesa

Revision ID: d7d73601f6f6
Revises: 093af45eb8c9
Create Date: 2026-06-15 13:57:29.380885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd7d73601f6f6'
down_revision: Union[str, Sequence[str], None] = '093af45eb8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create transactions table for M-Pesa STK Push and detailed payment tracking
    op.create_table(
        'transactions',
        sa.Column('payment_method_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('fee', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('merchant_request_id', sa.String(length=100), nullable=True, unique=True),
        sa.Column('checkout_request_id', sa.String(length=100), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('response_description', sa.Text(), nullable=True),
        sa.Column('response_code', sa.String(length=10), nullable=True),
        sa.Column('customer_message', sa.Text(), nullable=True),
        sa.Column('mpesa_receipt', sa.String(length=100), nullable=True, unique=True),
        sa.Column('transaction_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('transaction_metadata', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('max_retries_reached', sa.Boolean(), nullable=False),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_payment_method_id'), 'transactions', ['payment_method_id'], unique=False)
    op.create_index(op.f('ix_transactions_status'), 'transactions', ['status'], unique=False)
    op.create_index(op.f('ix_transactions_merchant_request'), 'transactions', ['merchant_request_id'], unique=False)
    op.create_index(op.f('ix_transactions_checkout_request'), 'transactions', ['checkout_request_id'], unique=False)
    op.create_index(op.f('ix_transactions_phone'), 'transactions', ['phone_number'], unique=False)
    op.create_index(op.f('ix_transactions_order'), 'transactions', ['order_id'], unique=False)
    op.create_index(op.f('ix_transactions_date'), 'transactions', ['transaction_date'], unique=False)
    op.create_index(op.f('ix_transactions_status_deleted'), 'transactions', ['status', 'is_deleted'], unique=False)
    op.create_index(op.f('ix_transactions_transaction_type'), 'transactions', ['transaction_type'], unique=False)
    op.create_index(op.f('ix_transactions_vendor_id'), 'transactions', ['vendor_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_transactions_vendor_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_transaction_type'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_status_deleted'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_date'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_order'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_phone'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_checkout_request'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_merchant_request'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_status'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_payment_method_id'), table_name='transactions')
    op.drop_table('transactions')
