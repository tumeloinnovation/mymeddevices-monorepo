"""Add return_requests table

Revision ID: 38e8e1ae1db1
Revises: 81dd38716335
Create Date: 2026-06-15 19:30:00.000000

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = '38e8e1ae1db1'
down_revision: Union[str, Sequence[str], None] = '81dd38716335'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'return_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('return_number', sa.String(50), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'status',
            sa.Enum('pending', 'approved', 'rejected', 'processing', 'completed', 'refunded', name='return_status'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('reason', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('items', postgresql.JSONB, nullable=False, server_default='[]'),
        sa.Column('refund_method', sa.String(50), nullable=False, server_default='original'),
        sa.Column('refund_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('refund_transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('shipping_label', sa.Text(), nullable=True),
        sa.Column('tracking_number', sa.String(100), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_return_requests_return_number'), 'return_requests', ['return_number'], unique=True)
    op.create_index(op.f('ix_return_requests_status'), 'return_requests', ['status'], unique=False)
    op.create_index(op.f('ix_return_requests_customer_id'), 'return_requests', ['customer_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_return_requests_customer_id'), table_name='return_requests')
    op.drop_index(op.f('ix_return_requests_status'), table_name='return_requests')
    op.drop_index(op.f('ix_return_requests_return_number'), table_name='return_requests')
    op.drop_table('return_requests')
    op.execute('DROP TYPE IF EXISTS return_status')
