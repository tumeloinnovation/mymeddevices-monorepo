"""add_brands_and_tags

Revision ID: 3c017dd19c21
Revises: add_email_tables
Create Date: 2026-06-13 12:26:12.913342

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '3c017dd19c21'
down_revision: Union[str, Sequence[str], None] = 'add_email_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create brands table
    op.create_table(
        'brands',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('website_url', sa.String(length=500), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_brands_slug'), 'brands', ['slug'], unique=True)
    op.create_index(op.f('ix_brands_id'), 'brands', ['id'], unique=False)

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_tags_slug'), 'tags', ['slug'], unique=True)
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)

    # Create product_tags many-to-many relationship table
    op.create_table(
        'product_tags',
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.PrimaryKeyConstraint('product_id', 'tag_id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE')
    )

    # Add brand_id foreign key column to products table
    op.add_column('products', sa.Column('brand_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_products_brands',
        'products', 'brands',
        ['brand_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index(op.f('ix_products_brand_id'), 'products', ['brand_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop brand_id column from products
    op.drop_index(op.f('ix_products_brand_id'), table_name='products')
    op.drop_constraint('fk_products_brands', 'products', type_='foreignkey')
    op.drop_column('products', 'brand_id')

    # Drop product_tags table
    op.drop_table('product_tags')

    # Drop tags table
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_index(op.f('ix_tags_slug'), table_name='tags')
    op.drop_table('tags')

    # Drop brands table
    op.drop_index(op.f('ix_brands_id'), table_name='brands')
    op.drop_index(op.f('ix_brands_slug'), table_name='brands')
    op.drop_table('brands')
