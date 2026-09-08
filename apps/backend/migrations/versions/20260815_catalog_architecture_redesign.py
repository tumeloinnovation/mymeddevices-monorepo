"""catalog architecture redesign

Revision ID: c8d9e0f1a2b3
Revises: b7a9c812d34e
Create Date: 2026-08-15 13:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b7a9c812d34e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create manufacturers table
    op.create_table(
        'manufacturers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False, unique=True),
        sa.Column('country_of_origin', sa.String(2), nullable=True),
        sa.Column('website_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_manufacturers_slug', 'manufacturers', ['slug'])

    # 2. Add manufacturer_id to brands
    op.add_column('brands', sa.Column('manufacturer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('manufacturers.id', ondelete='SET NULL'), nullable=True))
    op.create_index('ix_brands_manufacturer_id', 'brands', ['manufacturer_id'])

    # 3. Add tax_category_code and min_warranty_months to categories
    op.add_column('categories', sa.Column('tax_category_code', sa.String(50), nullable=False, server_default='STANDARD_VAT_16'))
    op.add_column('categories', sa.Column('min_warranty_months', sa.Integer(), nullable=False, server_default='0'))

    # 4. Create category_attribute_definitions
    op.create_table(
        'category_attribute_definitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('data_type', sa.String(30), nullable=False, server_default='STRING'),
        sa.Column('unit', sa.String(30), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_variant_defining', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_filterable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_searchable', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('category_id', 'code', name='uq_category_attribute_code'),
    )
    op.create_index('ix_category_attribute_defs_cat', 'category_attribute_definitions', ['category_id'])

    # 5. Create attribute_allowed_values
    op.create_table(
        'attribute_allowed_values',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('attribute_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('category_attribute_definitions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('value', sa.String(255), nullable=False),
        sa.Column('display_label', sa.String(255), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.UniqueConstraint('attribute_id', 'value', name='uq_attribute_allowed_value'),
    )
    op.create_index('ix_attribute_allowed_values_attr', 'attribute_allowed_values', ['attribute_id'])

    # 6. Add columns to products
    op.add_column('products', sa.Column('manufacturer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('manufacturers.id', ondelete='SET NULL'), nullable=True))
    op.add_column('products', sa.Column('manufacturer_model_number', sa.String(100), nullable=True))
    op.create_index('ix_products_manufacturer_id', 'products', ['manufacturer_id'])
    op.create_index('ix_products_manufacturer_model', 'products', ['manufacturer_id', 'manufacturer_model_number'])

    # 7. Add columns to product_variants and relax legacy constraints
    op.alter_column('product_variants', 'stock_quantity', nullable=True, server_default='0')
    op.add_column('product_variants', sa.Column('variant_slug', sa.String(255), nullable=True))
    op.add_column('product_variants', sa.Column('gtin_or_ean', sa.String(50), nullable=True))
    op.add_column('product_variants', sa.Column('attributes_summary', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('product_variants', sa.Column('dimensions_cm', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_index('ix_product_variants_slug', 'product_variants', ['product_id', 'variant_slug'])
    op.create_index('ix_product_variants_gtin', 'product_variants', ['gtin_or_ean'])

    # 8. Create variant_attribute_values
    op.create_table(
        'variant_attribute_values',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('product_variant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('product_variants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('attribute_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('category_attribute_definitions.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('value_text', sa.String(255), nullable=True),
        sa.Column('value_number', sa.Numeric(14, 4), nullable=True),
        sa.Column('value_boolean', sa.Boolean(), nullable=True),
        sa.Column('allowed_value_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('attribute_allowed_values.id', ondelete='SET NULL'), nullable=True),
        sa.UniqueConstraint('product_variant_id', 'attribute_id', name='uq_variant_attribute'),
    )
    op.create_index('ix_variant_attr_vals_variant', 'variant_attribute_values', ['product_variant_id'])
    op.create_index('ix_variant_attr_vals_attr', 'variant_attribute_values', ['attribute_id'])

    # 9. Create vendor_offers
    op.create_table(
        'vendor_offers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vendor_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_variant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('product_variants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('vendor_sku', sa.String(100), nullable=True),
        sa.Column('vendor_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('compare_at_vendor_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('selling_unit', sa.String(20), nullable=False, server_default='PIECE'),
        sa.Column('package_quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('min_order_quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('max_order_quantity', sa.Integer(), nullable=True),
        sa.Column('lead_time_days', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('warranty_months', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='ACTIVE'),
        sa.Column('external_system', sa.String(50), nullable=True),
        sa.Column('external_offer_id', sa.String(100), nullable=True),
        sa.Column('sync_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('vendor_id', 'product_variant_id', 'selling_unit', 'package_quantity', name='uq_vendor_variant_pkg'),
    )
    op.create_index('ix_vendor_offers_variant_status', 'vendor_offers', ['product_variant_id', 'status'])
    op.create_index('ix_vendor_offers_vendor', 'vendor_offers', ['vendor_id'])
    op.create_index('ix_vendor_offers_buybox', 'vendor_offers', ['product_variant_id', 'selling_unit', 'package_quantity', 'status', 'vendor_price'])

    # 10. Create offer_inventories
    op.create_table(
        'offer_inventories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vendor_offer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vendor_offers.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('quantity_on_hand', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('quantity_reserved', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('low_stock_threshold', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('warehouse_location', sa.String(100), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_offer_inventories_offer_id', 'offer_inventories', ['vendor_offer_id'])

    # 11. Create bundles and bundle_components
    op.create_table(
        'bundles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.String(1000), nullable=True),
        sa.Column('discount_type', sa.String(20), nullable=False, server_default='FIXED_AMOUNT'),
        sa.Column('discount_value', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('funding_source', sa.String(20), nullable=False, server_default='PLATFORM'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_bundles_slug', 'bundles', ['slug'])

    op.create_table(
        'bundle_components',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('bundle_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bundles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('allowed_vendor_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.UniqueConstraint('bundle_id', 'product_id', name='uq_bundle_product'),
    )
    op.create_index('ix_bundle_components_bundle', 'bundle_components', ['bundle_id'])
    op.create_index('ix_bundle_components_product', 'bundle_components', ['product_id'])

    # 12. Add fields to orders and order_items
    op.add_column('orders', sa.Column('shipping_subsidy_amount', sa.Numeric(12, 2), nullable=False, server_default='0.00'))
    op.add_column('order_items', sa.Column('product_variant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('product_variants.id', ondelete='SET NULL'), nullable=True))
    op.add_column('order_items', sa.Column('vendor_offer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vendor_offers.id', ondelete='SET NULL'), nullable=True))
    op.add_column('order_items', sa.Column('pricing_rule_version', sa.String(20), nullable=True, server_default='v1.0'))
    op.add_column('order_items', sa.Column('vendor_price_snapshot', sa.Numeric(12, 2), nullable=True))
    op.add_column('order_items', sa.Column('markup_amount_snapshot', sa.Numeric(12, 2), nullable=True))
    op.add_column('order_items', sa.Column('commission_amount_snapshot', sa.Numeric(12, 2), nullable=True))
    op.add_column('order_items', sa.Column('unit_customer_price_snapshot', sa.Numeric(12, 2), nullable=True))
    op.add_column('order_items', sa.Column('bundle_discount_allocated_snapshot', sa.Numeric(12, 2), nullable=True, server_default='0.00'))
    op.add_column('order_items', sa.Column('net_unit_customer_price_snapshot', sa.Numeric(12, 2), nullable=True))
    op.add_column('order_items', sa.Column('tax_category_code', sa.String(50), nullable=True, server_default='STANDARD_VAT_16'))
    op.add_column('order_items', sa.Column('tax_rate_snapshot', sa.Numeric(5, 2), nullable=True, server_default='0.00'))
    op.add_column('order_items', sa.Column('tax_amount_snapshot', sa.Numeric(12, 2), nullable=True, server_default='0.00'))
    op.add_column('order_items', sa.Column('selling_unit_snapshot', sa.String(20), nullable=True, server_default='PIECE'))
    op.add_column('order_items', sa.Column('package_quantity_snapshot', sa.Integer(), nullable=True, server_default='1'))

    # 13. Create order_item_serial_numbers
    op.create_table(
        'order_item_serial_numbers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('order_items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('serial_number', sa.String(100), nullable=False),
        sa.Column('captured_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('captured_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('order_item_id', 'serial_number', name='uq_order_item_serial'),
    )
    op.create_index('ix_order_item_serials_item', 'order_item_serial_numbers', ['order_item_id'])
    op.create_index('ix_order_item_serials_num', 'order_item_serial_numbers', ['serial_number'])

    # 14. Data Backfill
    # A. Backfill default product_variant for existing products that have no variants
    op.execute("""
        INSERT INTO product_variants (id, product_id, name, variant_slug, stock_quantity, is_active, is_default, sort_order, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            p.id,
            p.name,
            'default',
            COALESCE(p.stock_quantity, 0),
            true,
            true,
            0,
            NOW(),
            NOW()
        FROM products p
        WHERE NOT EXISTS (
            SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
        )
    """)

    # B. Backfill vendor_offers for existing products with vendor_id and price
    op.execute("""
        INSERT INTO vendor_offers (id, vendor_id, product_variant_id, vendor_sku, vendor_price, selling_unit, package_quantity, min_order_quantity, lead_time_days, warranty_months, status, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            p.vendor_id,
            pv.id,
            p.sku,
            COALESCE(p.base_price, p.price, 100.00),
            'PIECE',
            1,
            1,
            1,
            0,
            'ACTIVE',
            NOW(),
            NOW()
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.vendor_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM vendor_offers vo WHERE vo.product_variant_id = pv.id AND vo.vendor_id = p.vendor_id
        )
    """)

    # C. Backfill offer_inventories for all created vendor_offers
    op.execute("""
        INSERT INTO offer_inventories (id, vendor_offer_id, quantity_on_hand, quantity_reserved, low_stock_threshold, updated_at)
        SELECT 
            gen_random_uuid(),
            vo.id,
            COALESCE(p.stock_quantity, 10),
            0,
            COALESCE(p.low_stock_threshold, 5),
            NOW()
        FROM vendor_offers vo
        JOIN product_variants pv ON pv.id = vo.product_variant_id
        JOIN products p ON p.id = pv.product_id
        WHERE NOT EXISTS (
            SELECT 1 FROM offer_inventories oi WHERE oi.vendor_offer_id = vo.id
        )
    """)


def downgrade() -> None:
    op.drop_table('order_item_serial_numbers')
    op.drop_column('order_items', 'package_quantity_snapshot')
    op.drop_column('order_items', 'selling_unit_snapshot')
    op.drop_column('order_items', 'tax_amount_snapshot')
    op.drop_column('order_items', 'tax_rate_snapshot')
    op.drop_column('order_items', 'tax_category_code')
    op.drop_column('order_items', 'net_unit_customer_price_snapshot')
    op.drop_column('order_items', 'bundle_discount_allocated_snapshot')
    op.drop_column('order_items', 'unit_customer_price_snapshot')
    op.drop_column('order_items', 'commission_amount_snapshot')
    op.drop_column('order_items', 'markup_amount_snapshot')
    op.drop_column('order_items', 'vendor_price_snapshot')
    op.drop_column('order_items', 'pricing_rule_version')
    op.drop_column('order_items', 'vendor_offer_id')
    op.drop_column('order_items', 'product_variant_id')
    op.drop_column('orders', 'shipping_subsidy_amount')

    op.drop_table('bundle_components')
    op.drop_table('bundles')
    op.drop_table('offer_inventories')
    op.drop_table('vendor_offers')
    op.drop_table('variant_attribute_values')

    op.drop_column('product_variants', 'dimensions_cm')
    op.drop_column('product_variants', 'attributes_summary')
    op.drop_column('product_variants', 'gtin_or_ean')
    op.drop_column('product_variants', 'variant_slug')

    op.drop_column('products', 'manufacturer_model_number')
    op.drop_column('products', 'manufacturer_id')

    op.drop_table('attribute_allowed_values')
    op.drop_table('category_attribute_definitions')

    op.drop_column('categories', 'min_warranty_months')
    op.drop_column('categories', 'tax_category_code')

    op.drop_column('brands', 'manufacturer_id')
    op.drop_table('manufacturers')
