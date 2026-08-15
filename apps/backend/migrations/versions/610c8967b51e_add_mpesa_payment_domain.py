"""add_mpesa_payment_domain

Revision ID: 610c8967b51e
Revises: f9b441419ba2
Create Date: 2026-06-14 05:36:32.110358

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '610c8967b51e'
down_revision: Union[str, Sequence[str], None] = 'f9b441419ba2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create payment_methods table
    op.create_table(
        'payment_methods',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('is_default', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='active'),
        sa.Column('mpesa_shortcode', sa.String(length=20), nullable=True),
        sa.Column('mpesa_business_name', sa.String(length=100), nullable=True),
        sa.Column('mpesa_environment', sa.String(length=20), nullable=True, server_default='simulation'),
        sa.Column('fee_type', sa.String(length=20), nullable=True, server_default='percentage'),
        sa.Column('fee_value', sa.Numeric(precision=12, scale=2), nullable=True, server_default='0.0'),
        sa.Column('fee_min', sa.Numeric(precision=12, scale=2), nullable=True, server_default='0.0'),
        sa.Column('fee_max', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('min_amount', sa.Numeric(precision=12, scale=2), nullable=True, server_default='1.0'),
        sa.Column('max_amount', sa.Numeric(precision=12, scale=2), nullable=True, server_default='150000.0'),
        sa.Column('processing_time_seconds', sa.Integer(), nullable=True, server_default='30'),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='3'),
        sa.Column('display_order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('icon_url', sa.String(length=500), nullable=True),
        sa.Column('display_label', sa.String(length=100), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, server_default='false'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payment_methods_provider_status'), 'payment_methods', ['provider', 'status'], unique=False)
    op.create_index(op.f('ix_payment_methods_status_deleted'), 'payment_methods', ['status', 'is_deleted'], unique=False)

    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('payment_method_id', postgresql.UUID(), nullable=False),
        sa.Column('order_id', postgresql.UUID(), nullable=True),
        sa.Column('vendor_id', postgresql.UUID(), nullable=True),
        sa.Column('transaction_type', sa.String(length=20), nullable=True, server_default='payment'),
        sa.Column('status', sa.String(length=30), nullable=True, server_default='pending'),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True, server_default='KES'),
        sa.Column('fee', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('merchant_request_id', sa.String(length=100), nullable=True),
        sa.Column('checkout_request_id', sa.String(length=100), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('response_description', sa.Text(), nullable=True),
        sa.Column('response_code', sa.String(length=10), nullable=True),
        sa.Column('customer_message', sa.Text(), nullable=True),
        sa.Column('mpesa_receipt', sa.String(length=100), nullable=True),
        sa.Column('transaction_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('max_retries_reached', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, server_default='false'),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_request_id'),
        sa.UniqueConstraint('mpesa_receipt'),
    )
    op.create_index(op.f('ix_transactions_checkout_request'), 'transactions', ['checkout_request_id'], unique=False)
    op.create_index(op.f('ix_transactions_date'), 'transactions', ['transaction_date'], unique=False)
    op.create_index(op.f('ix_transactions_merchant_request'), 'transactions', ['merchant_request_id'], unique=False)
    op.create_index(op.f('ix_transactions_order'), 'transactions', ['order_id'], unique=False)
    op.create_index(op.f('ix_transactions_phone'), 'transactions', ['phone_number'], unique=False)
    op.create_index(op.f('ix_transactions_status'), 'transactions', ['status'], unique=False)
    op.create_index(op.f('ix_transactions_status_deleted'), 'transactions', ['status', 'is_deleted'], unique=False)

    # Create payment_callbacks table
    op.create_table(
        'payment_callbacks',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(), nullable=False),
        sa.Column('merchant_request_id', sa.String(length=100), nullable=True),
        sa.Column('checkout_request_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='pending'),
        sa.Column('result_code', sa.Integer(), nullable=True),
        sa.Column('result_description', sa.Text(), nullable=True),
        sa.Column('raw_callback', sa.JSON(), nullable=True),
        sa.Column('response_description', sa.Text(), nullable=True),
        sa.Column('callback_metadata', sa.JSON(), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('verification_error', sa.Text(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('headers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payment_callbacks_merchant'), 'payment_callbacks', ['merchant_request_id'], unique=False)
    op.create_index(op.f('ix_payment_callbacks_status'), 'payment_callbacks', ['status'], unique=False)
    op.create_index(op.f('ix_payment_callbacks_transaction'), 'payment_callbacks', ['transaction_id'], unique=False)

    # Create refunds table
    op.create_table(
        'refunds',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('transaction_id', postgresql.UUID(), nullable=False),
        sa.Column('order_id', postgresql.UUID(), nullable=True),
        sa.Column('initiated_by', postgresql.UUID(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='pending'),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('reason_details', sa.Text(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True, server_default='KES'),
        sa.Column('refund_fee', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('net_refund', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('reversal_id', sa.String(length=100), nullable=True),
        sa.Column('mpesa_receipt', sa.String(length=100), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('initiated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('response_description', sa.Text(), nullable=True),
        sa.Column('response_code', sa.String(length=10), nullable=True),
        sa.Column('approved_by', postgresql.UUID(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approval_notes', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, server_default='false'),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reversal_id'),
    )
    op.create_index(op.f('ix_refunds_date'), 'refunds', ['initiated_at'], unique=False)
    op.create_index(op.f('ix_refunds_order'), 'refunds', ['order_id'], unique=False)
    op.create_index(op.f('ix_refunds_status'), 'refunds', ['status'], unique=False)
    op.create_index(op.f('ix_refunds_status_deleted'), 'refunds', ['status', 'is_deleted'], unique=False)
    op.create_index(op.f('ix_refunds_transaction'), 'refunds', ['transaction_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_refunds_transaction'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_status_deleted'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_status'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_order'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_date'), table_name='refunds')
    op.drop_table('refunds')

    op.drop_index(op.f('ix_payment_callbacks_transaction'), table_name='payment_callbacks')
    op.drop_index(op.f('ix_payment_callbacks_status'), table_name='payment_callbacks')
    op.drop_index(op.f('ix_payment_callbacks_merchant'), table_name='payment_callbacks')
    op.drop_table('payment_callbacks')

    op.drop_index(op.f('ix_transactions_status_deleted'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_status'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_phone'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_order'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_merchant_request'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_date'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_checkout_request'), table_name='transactions')
    op.drop_table('transactions')

    op.drop_index(op.f('ix_payment_methods_status_deleted'), table_name='payment_methods')
    op.drop_index(op.f('ix_payment_methods_provider_status'), table_name='payment_methods')
    op.drop_table('payment_methods')
