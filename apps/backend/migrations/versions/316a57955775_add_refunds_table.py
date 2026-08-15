"""add_refunds_table

Revision ID: 316a57955775
Revises: d7d73601f6f6
Create Date: 2026-06-15 14:02:07.544584

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '316a57955775'
down_revision: Union[str, Sequence[str], None] = 'd7d73601f6f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create refunds table for M-Pesa reversals and refund processing
    op.create_table(
        'refunds',
        sa.Column('transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('initiated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('reason_details', sa.Text(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('refund_fee', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('net_refund', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('reversal_id', sa.String(length=100), nullable=True, unique=True),
        sa.Column('mpesa_receipt', sa.String(length=100), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('initiated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('response_description', sa.Text(), nullable=True),
        sa.Column('response_code', sa.String(length=10), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approval_notes', sa.Text(), nullable=True),
        sa.Column('refund_metadata', sa.JSON(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refunds_status'), 'refunds', ['status'], unique=False)
    op.create_index(op.f('ix_refunds_transaction'), 'refunds', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_refunds_order'), 'refunds', ['order_id'], unique=False)
    op.create_index(op.f('ix_refunds_completed_at'), 'refunds', ['completed_at'], unique=False)
    op.create_index(op.f('ix_refunds_status_deleted'), 'refunds', ['status', 'is_deleted'], unique=False)
    op.create_index(op.f('ix_refunds_initiated_by'), 'refunds', ['initiated_by'], unique=False)
    op.create_index(op.f('ix_refunds_reversal_id'), 'refunds', ['reversal_id'], unique=False)
    op.create_index(op.f('ix_refunds_mpesa_receipt'), 'refunds', ['mpesa_receipt'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_refunds_mpesa_receipt'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_reversal_id'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_initiated_by'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_status_deleted'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_completed_at'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_order'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_transaction'), table_name='refunds')
    op.drop_index(op.f('ix_refunds_status'), table_name='refunds')
    op.drop_table('refunds')
