import { apiClient, getApiUrl, type ApiErrorResponse } from './api-client';
import { toast } from 'sonner';
import { type Product as GlobalProduct, type ProductImage as GlobalProductImage } from '../data/types';

// ============================================================================
// Types
// ============================================================================

export type Product = GlobalProduct;
export type ProductImage = GlobalProductImage;

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

interface PricingSummary {
  product_id: string;
  price: string;
  cost_price: string | null;
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

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Product Service
// ============================================================================



/**
 * Product service for API integration
 */
export const productService = {
  /**
   * Get list of products with optional filtering
   */
  async getProducts(
    params: ProductQueryParams = {}
  ): Promise<PaginatedResponse<Product>> {
    try {

      // Use storefront endpoint for public browsing (no auth required)
      const response = await apiClient.get<any>('/storefront/products', {
        params: {
          page: params.page || 1,
          page_size: params.limit || 20,
          search: params.q,
          price_min: params.min_price,
          price_max: params.max_price,
          in_stock: params.in_stock ?? true,
          category: params.category,
        },
        skipAuth: true,
      });

      // Storefront API returns: { products: [...], total, page, page_size }
      if (response.products && Array.isArray(response.products)) {
        return {
          items: response.products,
          total: response.total || response.products.length,
          page: response.page || 1,
          limit: response.page_size || 20,
        };
      }

      // Fallback: handle wrapped response
      if (response.data && typeof response.data === 'object') {
        if (response.data.items) {
          return response.data;
        }
        if (Array.isArray(response.data.items)) {
          return {
            items: response.data.items,
            total: response.data.total || response.data.items.length,
            page: response.data.page || 1,
            limit: response.data.limit || 20,
          };
        }
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
      // For public storefront, use slug-based lookup
      const response = await apiClient.get<Product>(`/storefront/products/${id}`, { skipAuth: true });

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
   * Note: Backend uses UUID, this is a convenience method
   */
  async getProductBySlug(slug: string): Promise<Product> {
    try {
      // First try to get by ID (if slug is actually a UUID)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(slug)) {
        return await this.getProduct(slug);
      }

      // Otherwise, search by SKU or name using storefront search
      const response = await apiClient.get<any>('/storefront/products', {
        params: { search: slug, page_size: 10 },
        skipAuth: true,
      });

      // Storefront returns { products: [...], ... }
      if (response.products && response.products.length > 0) {
        return response.products[0];
      }

      // Fallback for wrapped response
      if (response.data?.items && response.data.items.length > 0) {
        return response.data.items[0];
      }

      throw new Error('Product not found');
    } catch (error) {
      console.error(`Failed to fetch product with slug ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Get product pricing details
   */
  async getProductPricing(id: string): Promise<PricingSummary> {
    try {
      const response = await apiClient.get<PricingSummary>(
        `/catalog/products/${id}/pricing`
      );

      if (response && typeof response === 'object') {
        if ('data' in response) {
          return response.data as PricingSummary;
        }
        return response as PricingSummary;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch pricing for product ${id}:`, error);
      throw error;
    }
  },

  /**
   * Validate product pricing for business rules
   */
  async validateProductPricing(id: string): Promise<any> {
    try {
      const response = await apiClient.get<any>(
        `/catalog/products/${id}/pricing/validate`
      );

      if (response && typeof response === 'object') {
        if ('data' in response) {
          return response.data;
        }
        return response;
      }

      throw new Error('Invalid response format');
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
      const params: any = {
        search: query,
        page: 1,
        page_size: 50,
      };

      // Apply filters
      if (filters.price_range) {
        params.price_min = filters.price_range[0];
        params.price_max = filters.price_range[1];
      }

      if (filters.in_stock_only) {
        params.in_stock = true;
      }

      const response = await apiClient.get<any>('/storefront/products', {
        params,
        skipAuth: true,
      });

      // Storefront returns { products: [...], ... }
      if (response.products && Array.isArray(response.products)) {
        return response.products;
      }

      // Fallback for wrapped response
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
        params: { page_size: limit, in_stock: true, is_featured: true },
        skipAuth: true,
      });

      if (response.products) {
        return response.products;
      }

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
        params: { page_size: limit, sort_by: 'newest', in_stock: true },
        skipAuth: true,
      });

      if (response.products) {
        return response.products;
      }

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
      // Use storefront endpoint with is_on_sale filter
      const response = await apiClient.get<any>('/storefront/products', {
        params: { page_size: limit, in_stock: true, is_on_sale: true },
        skipAuth: true,
      });

      let products: Product[] = [];

      if (response.products) {
        products = response.products;
      } else if (response.data?.items) {
        products = response.data.items;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }

      return products;
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
  return (product.status as string === 'publish' || product.status as string === 'published') && product.stock_status === 'instock';
}

/**
 * Get stock status text
 */
export function getStockStatus(product: Product): string {
  if (product.status as string !== 'publish' && product.status as string !== 'published') {
    return 'Unavailable';
  }

  if (product.stock_status === 'outofstock') {
    return 'Out of Stock';
  }

  if (product.stock_quantity && product.stock_quantity < 5) {
    return `Low Stock (${product.stock_quantity} left)`;
  }

  return 'In Stock';
}

// ============================================================================
// Export
// ============================================================================

export type {
  ProductQueryParams,
  ProductFilters,
  PaginatedResponse,
  PricingSummary,
};
