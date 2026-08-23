"""Add promotions and marketing campaigns tables

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-08-16 00:00:00.000000

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e0f1a2b3c4d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create promotions table
    op.create_table(
        'promotions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('promotion_type', sa.Enum('percentage', 'fixed', 'free_shipping', 'bundle', 'flash_sale', name='promotion_type'), nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('min_order_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('max_discount_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('banner_text', sa.String(length=255), nullable=True),
        sa.Column('badge_text', sa.String(length=100), nullable=True),
        sa.Column('applicable_category_ids', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('applicable_product_ids', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('usage_limit', sa.Integer(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_promotions_code'), 'promotions', ['code'], unique=True)
    op.create_index(op.f('ix_promotions_is_active'), 'promotions', ['is_active'], unique=False)
    op.create_index(op.f('ix_promotions_promotion_type'), 'promotions', ['promotion_type'], unique=False)

    # 2. Create sms_campaigns table
    op.create_table(
        'sms_campaigns',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('sender_id', sa.String(length=50), nullable=False, server_default='MYMEDDEVICE'),
        sa.Column('target_audience', sa.String(length=50), nullable=False, server_default='all'),
        sa.Column('recipient_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', name='sms_campaign_status'), nullable=False, server_default='draft'),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cost_kes', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_sms_campaigns_status'), 'sms_campaigns', ['status'], unique=False)

    # 3. Create email_campaigns table
    op.create_table(
        'email_campaigns',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('preview_text', sa.String(length=255), nullable=True),
        sa.Column('html_content', sa.Text(), nullable=False),
        sa.Column('target_audience', sa.String(length=50), nullable=False, server_default='all'),
        sa.Column('recipient_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('open_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('click_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', name='email_campaign_status'), nullable=False, server_default='draft'),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_email_campaigns_status'), 'email_campaigns', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_email_campaigns_status'), table_name='email_campaigns')
    op.drop_table('email_campaigns')
    op.execute('DROP TYPE IF EXISTS email_campaign_status')

    op.drop_index(op.f('ix_sms_campaigns_status'), table_name='sms_campaigns')
    op.drop_table('sms_campaigns')
    op.execute('DROP TYPE IF EXISTS sms_campaign_status')

    op.drop_index(op.f('ix_promotions_promotion_type'), table_name='promotions')
    op.drop_index(op.f('ix_promotions_is_active'), table_name='promotions')
    op.drop_index(op.f('ix_promotions_code'), table_name='promotions')
    op.drop_table('promotions')
    op.execute('DROP TYPE IF EXISTS promotion_type')
