import {
  Product,
  ProductVariant,
  LegacyCSVRow,
  VariantAttributeGroup,
  MedicalVariantAttributes,
} from '../../types/catalog';

export function mapCSVRowToProduct(
  row: LegacyCSVRow,
  vendorId: string
): Partial<Product> {
  const isSale = row.on_sale?.toLowerCase() === 'true';
  const isInStock = row.in_stock?.toLowerCase() === 'true';

  const priceVal = row.price ? parseFloat(row.price) : 0;
  const regularPriceVal = row.regular_price ? parseFloat(row.regular_price) : priceVal;
  const salePriceVal = row.sale_price ? parseFloat(row.sale_price) : priceVal;

  const currentPrice = isSale ? salePriceVal : regularPriceVal;

  return {
    name: row.name.trim(),
    slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    sku: row.sku || undefined,
    vendor_id: vendorId,
    price: currentPrice,
    regular_price: regularPriceVal,
    sale_price: salePriceVal,
    is_on_sale: isSale,
    stock_status: isInStock ? 'instock' : 'outofstock',
    stock_quantity: isInStock ? 10 : 0,
    track_inventory: true,
    currency: 'KES',
    status: 'published',
    permalink: row.permalink || undefined,
    images: row.image_url
      ? [
          {
            id: `img-${row.id}`,
            url: row.image_url,
            sort_order: 0,
            is_primary: true,
            created_at: new Date().toISOString(),
          },
        ]
      : [],
    tags: row.categories ? row.categories.split(';').map((c) => c.trim()) : [],
  };
}

export function getSelectedVariantPrice(
  product: Product,
  selectedVariantId?: string
): number {
  if (!selectedVariantId || !product.variants?.length) {
    return product.price ?? 0;
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId);
  if (!variant) return product.price ?? 0;

  if (variant.override_price !== undefined) {
    return variant.override_price;
  }

  return (product.price ?? 0) + (variant.price_adjustment ?? 0);
}

export function extractVariantAttributeGroups(
  variants: ProductVariant[],
  basePrice: number = 0
): VariantAttributeGroup[] {
  if (!variants || variants.length === 0) return [];

  const groupsMap: Map<string, VariantAttributeGroup> = new Map();

  for (const variant of variants) {
    if (!variant.is_active || !variant.attributes) continue;

    const attrs = variant.attributes;
    for (const [key, rawValue] of Object.entries(attrs)) {
      if (rawValue === undefined || rawValue === null) continue;

      let groupName = key.charAt(0).toUpperCase() + key.slice(1);
      if (key === 'folds') groupName = 'Number of Folds';
      if (key === 'size') groupName = 'Size / Capacity';
      if (key === 'material') groupName = 'Frame Material';
      if (key === 'configuration') groupName = 'Configuration';

      let group = groupsMap.get(key);
      if (!group) {
        group = {
          name: groupName,
          key: key as keyof MedicalVariantAttributes,
          options: [],
        };
        groupsMap.set(key, group);
      }

      const calculatedPrice =
        variant.override_price !== undefined
          ? variant.override_price
          : basePrice + (variant.price_adjustment ?? 0);

      const label = key === 'folds' ? `${rawValue}-Fold` : String(rawValue);

      const existingOption = group.options.find((o) => o.value === rawValue);
      if (!existingOption) {
        group.options.push({
          label,
          value: rawValue as string | number,
          variant_id: variant.id,
          is_available: variant.stock_quantity > 0,
          price_delta: variant.price_adjustment ?? 0,
          calculated_price: calculatedPrice,
        });
      }
    }
  }

  return Array.from(groupsMap.values());
}
