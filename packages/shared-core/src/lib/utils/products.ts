import { Product } from '@/lib/data/types';

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

/**
 * Format price with currency symbol
 */
export function formatPrice(price: string | number, currency = 'KES'): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numPrice)) return `${currency} 0.00`;

    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(numPrice);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
    regularPrice: string | number,
    salePrice: string | number
): number {
    const regular = typeof regularPrice === 'string' ? parseFloat(regularPrice) : regularPrice;
    const sale = typeof salePrice === 'string' ? parseFloat(salePrice) : salePrice;

    if (isNaN(regular) || isNaN(sale) || regular === 0) return 0;

    return Math.round(((regular - sale) / regular) * 100);
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(status: StockStatus): string {
    const labels: Record<StockStatus, string> = {
        instock: 'In Stock',
        outofstock: 'Out of Stock',
        onbackorder: 'On Backorder',
    };

    return labels[status] || status;
}

/**
 * Get stock status color
 */
export function getStockStatusColor(status: StockStatus): string {
    const colors: Record<StockStatus, string> = {
        instock: 'default', // Changed from success to default for shadcn badge
        outofstock: 'destructive',
        onbackorder: 'secondary', // Changed from warning to secondary
    };

    return colors[status] || 'outline';
}

/**
 * Validate SKU format (alphanumeric, hyphens, underscores)
 */
export function validateSKU(sku: string): boolean {
    if (!sku) return true; // SKU is optional
    return /^[a-zA-Z0-9_-]+$/.test(sku);
}

/**
 * Format product data for API submission
 */
export function formatProductForAPI(data: Record<string, unknown>): Record<string, unknown> {
    const formatted = { ...data };

    // Convert empty strings to null for numeric fields
    const numericFields = ['stock_quantity', 'download_limit', 'download_expiry', 'menu_order'];
    numericFields.forEach(field => {
        if (formatted[field] === '' || formatted[field] === undefined) {
            formatted[field] = null;
        }
    });

    // Ensure boolean fields are actual booleans
    const booleanFields = [
        'featured',
        'virtual',
        'downloadable',
        'manage_stock',
        'sold_individually',
        'reviews_allowed',
    ];
    booleanFields.forEach(field => {
        if (formatted[field] !== undefined) {
            formatted[field] = Boolean(formatted[field]);
        }
    });

    return formatted;
}

/**
 * Get product status label
 */
export function getProductStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        draft: 'Draft',
        pending: 'Pending Review',
        private: 'Private',
        publish: 'Published',
    };

    return labels[status] || status;
}

/**
 * Get product status color
 */
export function getProductStatusColor(status: string): string {
    const colors: Record<string, string> = {
        draft: 'secondary',
        pending: 'secondary', // Changed from warning to secondary
        private: 'outline', // Changed from default to outline
        publish: 'default', // Changed from success to default
    };

    return colors[status] || 'outline';
}

/**
 * Check if product is on sale
 */
export function isProductOnSale(product: Product): boolean {
    return product.on_sale && !!product.sale_price && parseFloat(product.sale_price) > 0;
}

/**
 * Get product display price
 */
export function getProductDisplayPrice(product: Product): string {
    if (isProductOnSale(product)) {
        return product.sale_price;
    }
    return product.regular_price || product.price;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Generate vendor-scoped SKU with vendor ID prefix
 * Format: {vendorID}-{randomHash}
 * Example: 12-A3F7B2 (vendor ID 12)
 * 
 * @param vendorId - Numeric vendor ID
 * @returns Generated SKU unique to vendor
 */
export function generateSKU(vendorId: number): string {
  // Vendor ID prefix (padded to 3 digits)
  const vendorPrefix = String(vendorId).padStart(3, '0');
  
  // Generate random alphanumeric suffix
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${vendorPrefix}-${suffix}`;
}
