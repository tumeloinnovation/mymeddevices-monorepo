"""
add email tables

Revision ID: add_email_tables
Revises: a1922e3258f9
Create Date: 2024-06-12 00:00:00.000000

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'add_email_tables'
down_revision: Union[str, None] = 'a1922e3258f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create email_branding table
    op.create_table(
        'email_branding',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False, server_default='MyMedDevices'),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('primary_color', sa.String(length=7), nullable=False, server_default='#007bff'),
        sa.Column('secondary_color', sa.String(length=7), nullable=True),
        sa.Column('footer_text', sa.Text(), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=False, server_default='support@mymeddevices.com'),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('social_links', sa.JSON(), nullable=True),
        sa.Column('brand_voice', sa.String(length=100), nullable=True, server_default='professional'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_branding_id'), 'email_branding', ['id'], unique=False)

    # Create email_templates table
    op.create_table(
        'email_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_key', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('preheader', sa.Text(), nullable=True),
        sa.Column('content_json', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_templates_id'), 'email_templates', ['id'], unique=False)
    op.create_index(op.f('ix_email_templates_template_key'), 'email_templates', ['template_key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_email_templates_template_key'), table_name='email_templates')
    op.drop_index(op.f('ix_email_templates_id'), table_name='email_templates')
    op.drop_table('email_templates')
    op.drop_index(op.f('ix_email_branding_id'), table_name='email_branding')
    op.drop_table('email_branding')
