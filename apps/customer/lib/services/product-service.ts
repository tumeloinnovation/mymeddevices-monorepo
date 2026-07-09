import { apiClient, getApiUrl, type ApiErrorResponse } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface ProductQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  min_price?: number;
  max_price?: number;
  vendor_id?: string;
  sku?: string;
  in_stock?: boolean;
  category?: string;
  sort?: string;
  featured?: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface Product {
  id: string;
  vendor_id: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  cost_price?: string;
  compare_at_price?: string;
  stock_quantity: number;
  status: 'active' | 'inactive';
  approval_status: 'approved' | 'pending' | 'rejected';
  image_url?: string;
  images?: ProductImage[];
  category?: string;
  created_at: string;
  updated_at: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  position: number;
}

interface PricingSummary {
  product_id: string;
  price: string;
  cost_price: string | null;
  compare_at_price: string | null;
  markup_percentage: number | null;
  profit_margin: number;
}

interface ProductFilters {
  price_range?: [number, number];
  vendors?: string[];
  categories?: string[];
  in_stock_only?: boolean;
  rating?: number;
}

// ============================================================================
// Product Service
// ============================================================================

/**
 * Product service for API integration
 *
 * Handles all product-related API calls including:
 * - Product listing with filters
 * - Product details
 * - Product pricing
 * - Product search
 */
export const productService = {
  /**
   * Get list of products with optional filtering
   */
  async getProducts(
    params: ProductQueryParams = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      const response = await apiClient.get<any>('/storefront/products', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          q: params.q,
          min_price: params.min_price,
          max_price: params.max_price,
          vendor_id: params.vendor_id,
          sku: params.sku,
          in_stock: params.in_stock,
        },
      });

      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        // Backend returns { success: true, data: { items: [...], total, page, limit } }
        if (response.data.items) {
          return response.data;
        }
        // Backend returns { success: true, data: [...] }
        if (Array.isArray(response.data.items)) {
          return {
            items: response.data.items,
            total: response.data.total || response.data.items.length,
            page: response.data.page || 1,
            limit: response.data.limit || 20,
          };
        }
        // Backend returns { success: true, data: [...] }
        if (Array.isArray(response.data)) {
          return {
            items: response.data,
            total: response.data.length,
            page: 1,
            limit: response.data.length,
          };
        }
      }

      // Fallback: handle array response
      if (Array.isArray(response)) {
        return {
          items: response,
          total: response.length,
          page: 1,
          limit: response.length,
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/storefront/products/${id}`);

      // Handle different response formats
      if (response && typeof response === 'object') {
        if ('data' in response && typeof response.data === 'object') {
          return response.data as Product;
        }
        return response as Product;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get product by slug/seo-friendly identifier
   * Note: Backend uses slug for storefront products
   */
  async getProductBySlug(slug: string): Promise<Product> {
    try {
      // Try to get by slug directly (storefront uses slugs)
      const response = await apiClient.get<any>(`/storefront/products/${slug}`);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Product not found');
    } catch (error) {
      console.error(`Failed to fetch product with slug ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Get product pricing details (calculated from product data)
   * Note: This is calculated on the frontend since there's no dedicated pricing endpoint
   */
  async getProductPricing(id: string): Promise<PricingSummary> {
    try {
      // Get the product first
      const product = await this.getProduct(id);

      // Calculate pricing summary from product data
      const price = parseFloat(product.price);
      const costPrice = product.cost_price ? parseFloat(product.cost_price) : null;
      const compareAtPrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;

      let markupPercentage = null;
      let profitMargin = 0;

      if (costPrice && costPrice > 0) {
        markupPercentage = ((price - costPrice) / costPrice) * 100;
        profitMargin = ((price - costPrice) / price) * 100;
      }

      return {
        product_id: product.id,
        price: product.price,
        cost_price: product.cost_price ?? null,
        compare_at_price: product.compare_at_price ?? null,
        markup_percentage: markupPercentage,
        profit_margin: profitMargin,
      };
    } catch (error) {
      console.error(`Failed to calculate pricing for product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Validate product pricing (always returns valid for now)
   * Note: This is a placeholder since there's no backend validation endpoint
   */
  async validateProductPricing(id: string): Promise<any> {
    try {
      // For now, just return valid status
      // In the future, this could check against business rules
      const product = await this.getProduct(id);
      return {
        is_valid: true,
        product_id: product.id,
        price: product.price,
        messages: [],
      };
    } catch (error) {
      console.error(`Failed to validate pricing for product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    filters: ProductFilters = {}
  ): Promise<Product[]> {
    try {
      const params: ProductQueryParams = {
        q: query,
        page: 1,
        limit: 50,
      };

      // Apply filters
      if (filters.price_range) {
        params.min_price = filters.price_range[0];
        params.max_price = filters.price_range[1];
      }

      if (filters.in_stock_only) {
        params.in_stock = true;
      }

      const response = await apiClient.get<any>('/storefront/products', { params });

      if (response.data?.items) {
        return response.data.items;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  },

  /**
   * Get featured/bestseller products
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      const response = await apiClient.get<any>('/storefront/products', {
        params: { limit, in_stock: true },
      });

      if (response.data?.items) {
        return response.data.items;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      throw error;
    }
  },

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit: number = 10): Promise<Product[]> {
    try {
      const response = await apiClient.get<any>('/storefront/products', {
        params: { limit, sort: 'created_at:desc' },
      });

      if (response.data?.items) {
        return response.data.items;
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch new arrivals:', error);
      throw error;
    }
  },

  /**
   * Get products on sale
   */
  async getSaleProducts(limit: number = 10): Promise<Product[]> {
    try {
      // For now, return products with compare_at_price set
      const response = await apiClient.get<any>('/storefront/products', {
        params: { limit, in_stock: true },
      });

      let products: Product[] = [];

      if (response.data?.items) {
        products = response.data.items;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }

      // Filter products with compare_at_price (indicating discount)
      return products.filter((p) => p.compare_at_price && p.compare_at_price !== p.price);
    } catch (error) {
      console.error('Failed to fetch sale products:', error);
      throw error;
    }
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(numPrice);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  price: string | number,
  compareAtPrice: string | number
): number {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  const compareNum =
    typeof compareAtPrice === 'string'
      ? parseFloat(compareAtPrice)
      : compareAtPrice;

  if (!compareNum || compareNum <= priceNum) {
    return 0;
  }

  return Math.round(((compareNum - priceNum) / compareNum) * 100);
}

/**
 * Check if product is in stock
 */
export function isInStock(product: Product): boolean {
  return product.status === 'active' && product.stock_quantity > 0;
}

/**
 * Get stock status text
 */
export function getStockStatus(product: Product): string {
  if (product.status !== 'active') {
    return 'Unavailable';
  }

  if (product.stock_quantity === 0) {
    return 'Out of Stock';
  }

  if (product.stock_quantity < 5) {
    return `Low Stock (${product.stock_quantity} left)`;
  }

  return 'In Stock';
}

// ============================================================================
// Export
// ============================================================================

export type {
  Product,
  ProductQueryParams,
  ProductFilters,
  PaginatedResponse,
  PricingSummary,
  ProductImage,
};
