"""add communication preference columns

Revision ID: 81dd38716335
Revises: d0e84711c147
Create Date: 2026-06-15 19:05:34.080622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '81dd38716335'
down_revision: Union[str, Sequence[str], None] = 'd0e84711c147'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('customer_profiles', sa.Column('email_order_updates', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('customer_profiles', sa.Column('email_promotions', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('customer_profiles', sa.Column('email_newsletter', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('customer_profiles', sa.Column('email_security', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('customer_profiles', sa.Column('sms_order_updates', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('customer_profiles', sa.Column('sms_promotions', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('customer_profiles', sa.Column('sms_security', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('customer_profiles', sa.Column('email_frequency', sa.String(length=20), server_default='instant', nullable=False))


def downgrade() -> None:
    op.drop_column('customer_profiles', 'email_frequency')
    op.drop_column('customer_profiles', 'sms_security')
    op.drop_column('customer_profiles', 'sms_promotions')
    op.drop_column('customer_profiles', 'sms_order_updates')
    op.drop_column('customer_profiles', 'email_security')
    op.drop_column('customer_profiles', 'email_newsletter')
    op.drop_column('customer_profiles', 'email_promotions')
    op.drop_column('customer_profiles', 'email_order_updates')
