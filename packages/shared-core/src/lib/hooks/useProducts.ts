'use client';

import { useQuery } from '@tanstack/react-query';
import { productService, type ProductQueryParams, type Product } from '../services/product-service';

// Type re-exports for compatibility
type ProductFilterParams = Omit<ProductQueryParams, 'page' | 'limit'> & {
  page?: number;
  per_page?: number;
  orderby?: string;
  order?: 'asc' | 'desc';
  status?: 'publish' | 'draft';
  featured?: boolean;
};

// Convert our params to the format expected by the product service
function convertParams(params: ProductFilterParams): ProductQueryParams {
  return {
    page: params.page,
    limit: params.per_page || 20,
    q: params.q,
    min_price: params.min_price,
    max_price: params.max_price,
    vendor_id: params.vendor_id,
    sku: params.sku,
    in_stock: params.in_stock,
    category: params.category,
    sort: params.orderby ? `${params.orderby}:${params.order || 'asc'}` : undefined,
  };
}

// ─────────────────────────────────────────────
// Paginated / filtered product list
// ─────────────────────────────────────────────
export function useProducts(params: ProductFilterParams = {}) {
  const queryKey = ['products', params];

  const query = useQuery({
    queryKey,
    queryFn: () => productService.getProducts(convertParams(params)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    products: query.data?.items || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    limit: query.data?.limit || 20,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────
// Specific collections
// ─────────────────────────────────────────────
export function useFeaturedProducts(limit = 10) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useOnSaleProducts(limit = 10) {
  return useQuery({
    queryKey: ['products', 'sale', limit],
    queryFn: () => productService.getSaleProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useNewArrivals(limit = 10) {
  return useQuery({
    queryKey: ['products', 'new', limit],
    queryFn: () => productService.getNewArrivals(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBestSellers(limit = 10) {
  // For now, use featured products as best sellers
  // Backend doesn't have a dedicated bestsellers endpoint
  return useQuery({
    queryKey: ['products', 'bestsellers', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ─────────────────────────────────────────────
// Single product lookups
// ─────────────────────────────────────────────
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => productService.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', 'id', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ['products', 'ids', ids],
    queryFn: async () => {
      const promises = ids.map((id) => productService.getProduct(id));
      return Promise.all(promises);
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRelatedProducts(product: Product | null, limit = 6) {
  return useQuery({
    queryKey: ['products', 'related', product?.id, limit],
    queryFn: async () => {
      if (!product) return [];

      // For now, get products from the same category
      const category = product.categories?.[0]?.slug;
      if (!category) return [];

      const result = await productService.getProducts({
        category,
        limit: limit + 1, // Get one extra to exclude the current product
      });

      return result.items.filter((p) => p.id !== product.id).slice(0, limit);
    },
    enabled: !!product,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ─────────────────────────────────────────────
// Product search
// ─────────────────────────────────────────────
export function useProductSearch(query: string, filters: any = {}) {
  return useQuery({
    queryKey: ['products', 'search', query, filters],
    queryFn: () => productService.searchProducts(query, filters),
    enabled: query.length > 2, // Only search when query has 3+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ─────────────────────────────────────────────
// Product pricing
// ─────────────────────────────────────────────
export function useProductPricing(productId: string) {
  return useQuery({
    queryKey: ['product', 'pricing', productId],
    queryFn: () => productService.getProductPricing(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
