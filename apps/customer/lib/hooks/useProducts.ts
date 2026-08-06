import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { productService } from '@/lib/services/product-service';
import type { Product, ProductFilterParams } from '@mymeddevices/core/lib/data/types';

// ============================================================================
// Types
// ============================================================================

interface UseProductsParams extends Omit<ProductFilterParams, 'orderby' | 'order'> {
  enabled?: boolean;
  // Additional params
  orderby?: 'date' | 'price' | 'rating' | 'popularity' | 'title';
  per_page?: number;
  sort?: string;
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  total: number;
  page: number;
  limit: number;
  data: Product[]; // Alias for compatibility
}

interface UseProductsInfiniteResult {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

// ============================================================================
// Products Hook
// ============================================================================

/**
 * Hook for fetching products with React Query
 *
 * @param params - Query parameters for filtering products
 * @param options - React Query options
 * @returns Products result with loading states
 *
 * @example
 * const { products, isLoading, error } = useProducts({ category: 'surgical' });
 */
export function useProducts(
  params: UseProductsParams = {},
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
): UseProductsResult {
  const { enabled = true, ...queryParams } = params;

  const query = useQuery({
    queryKey: ['products', queryParams],
    queryFn: async () => {
      // Convert params to service format
      const serviceParams: any = {
        page: queryParams.page,
        limit: queryParams.per_page || 20,
        q: queryParams.search,
        min_price: queryParams.min_price,
        max_price: queryParams.max_price,
        vendor_id: queryParams.vendor_id,
        sku: queryParams.ids?.[0], // Handle IDs
        in_stock: queryParams.stock_status === 'instock' ? true : undefined,
      };

      const response = await productService.getProducts(serviceParams);

      // Transform service Product to shared-core Product format
      const products: Product[] = response.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug || item.sku || item.id?.toString() || '',
        description: item.description || '',
        short_description: item.description?.substring(0, 150) || '',
        sku: item.sku || '',
        price: item.price || '0',
        regular_price: item.compare_at_price || item.price || '0',
        sale_price: item.price || '0',
        on_sale: !!(item.compare_at_price && item.compare_at_price !== item.price),
        featured: item.is_featured || false,
        status: item.status || 'published',
        stock_status: item.stock_status || (item.stock_quantity > 0 ? 'instock' : 'outofstock'),
        manage_stock: true,
        stock_quantity: item.stock_quantity,
        total_sales: 0,
        average_rating: '0',
        rating_count: 0,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          src: img.url || img.src || '',
          name: img.alt_text || '',
          alt: img.alt_text || '',
          position: img.position || 0,
        })),
        categories: (item.category_name || item.category) ? [{
          id: item.category_id || 0,
          name: item.category_name || item.category,
          slug: (item.category_name || item.category).toLowerCase().replace(/\s+/g, '-'),
        }] : [],
        tags: [],
        attributes: [],
        related_ids: [],
        brands: [],
        weight: (item as any).weight_kg ? `${(item as any).weight_kg} kg` : '',
        dimensions: (item as any).dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.slug || item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price,
        specifications: (item as any).specifications,
      }));

      return {
        items: products,
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  const data = query.data || { items: [], total: 0, page: 1, limit: 20 };

  return {
    products: data.items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    total: data.total,
    page: data.page,
    limit: data.limit,
    data: data.items, // Alias for compatibility with existing code
  };
}

/**
 * Hook for infinite scroll products
 *
 * @param params - Query parameters for filtering products
 * @returns Infinite products result with loadMore function
 *
 * @example
 * const { products, hasMore, loadMore } = useProductsInfinite({ category: 'surgical' });
 */
export function useProductsInfinite(
  params: UseProductsParams = {}
): UseProductsInfiniteResult {
  // Use regular useProducts hook since we need the transformation logic
  const { products, isLoading, isError, error, total } = useProducts({
    ...params,
    per_page: params.per_page || 20,
  });

  return {
    products,
    isLoading,
    isError,
    error,
    hasMore: products.length > 0 && products.length === total,
    loadMore: () => {}, // Implement if needed for true infinite scroll
    isLoadingMore: false,
  };
}

// ============================================================================
// Product By Slug Hook
// ============================================================================

/**
 * Hook for fetching a single product by slug
 *
 * @param slug - Product slug
 * @param options - React Query options
 * @returns Product result
 *
 * @example
 * const { data: product, isLoading } = useProductBySlug('thermometer-pro');
 */
export function useProductBySlug(
  slug: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const item = await productService.getProductBySlug(slug);

      // Transform to shared-core Product format
      const product: Product = {
        id: item.id,
        name: item.name,
        slug: item.slug || item.sku || item.id?.toString() || '',
        description: item.description || '',
        short_description: item.description?.substring(0, 150) || '',
        sku: item.sku || '',
        price: String(item.price ?? '0'),
        regular_price: String(item.compare_at_price ?? item.price ?? '0'),
        sale_price: String(item.price ?? '0'),
        on_sale: !!(item.compare_at_price && item.compare_at_price !== item.price),
        featured: false,
        status: item.status === 'active' ? 'publish' : 'draft',
        stock_status: item.stock_quantity > 0 ? 'instock' : 'outofstock',
        manage_stock: true,
        stock_quantity: item.stock_quantity,
        total_sales: 0,
        average_rating: '0',
        rating_count: 0,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          src: img.url || img.src || '',
          name: img.alt_text || '',
          alt: img.alt_text || '',
          position: img.position || 0,
        })),
        categories: item.category ? [{
          id: 0,
          name: item.category,
          slug: item.category.toLowerCase().replace(/\s+/g, '-'),
        }] : [],
        tags: [],
        attributes: [],
        related_ids: [],
        brands: [],
        weight: (item as any).weight_kg ? `${(item as any).weight_kg} kg` : '',
        dimensions: (item as any).dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.slug || item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price !== undefined && item.cost_price !== null ? String(item.cost_price) : undefined,
        specifications: (item as any).specifications,
      };

      return product;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// ============================================================================
// Featured Products Hook
// ============================================================================

/**
 * Hook for fetching featured/bestseller products
 *
 * @param limit - Number of products to fetch
 * @returns Featured products result
 *
 * @example
 * const { data: products } = useFeaturedProducts(10);
 */
export function useFeaturedProducts(limit: number = 10) {
  return useQuery({
    queryKey: ['featured-products', limit],
    queryFn: async () => {
      const items = await productService.getFeaturedProducts(limit);

      // Transform to shared-core Product format
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.sku || item.id?.toString() || '',
        description: item.description || '',
        short_description: item.description?.substring(0, 150) || '',
        sku: item.sku || '',
        price: item.price || '0',
        regular_price: item.compare_at_price || item.price || '0',
        sale_price: item.price || '0',
        on_sale: !!(item.compare_at_price && item.compare_at_price !== item.price),
        featured: true,
        status: item.status === 'active' ? 'publish' : 'draft',
        stock_status: item.stock_quantity > 0 ? 'instock' : 'outofstock',
        manage_stock: true,
        stock_quantity: item.stock_quantity,
        total_sales: 0,
        average_rating: '0',
        rating_count: 0,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          src: img.url || img.src || '',
          name: img.alt_text || '',
          alt: img.alt_text || '',
          position: img.position || 0,
        })),
        categories: item.category ? [{
          id: 0,
          name: item.category,
          slug: item.category.toLowerCase().replace(/\s+/g, '-'),
        }] : [],
        tags: [],
        attributes: [],
        related_ids: [],
        brands: [],
        weight: (item as any).weight_kg ? `${(item as any).weight_kg} kg` : '',
        dimensions: (item as any).dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.slug || item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price,
        specifications: (item as any).specifications,
      } as Product));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// New Arrivals Hook
// ============================================================================

/**
 * Hook for fetching new arrivals
 *
 * @param limit - Number of products to fetch
 * @returns New arrivals result
 *
 * @example
 * const { data: products } = useNewArrivals(10);
 */
export function useNewArrivals(limit: number = 10) {
  return useQuery({
    queryKey: ['new-arrivals', limit],
    queryFn: async () => {
      const items = await productService.getNewArrivals(limit);

      // Transform to shared-core Product format
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.sku || item.id?.toString() || '',
        description: item.description || '',
        short_description: item.description?.substring(0, 150) || '',
        sku: item.sku || '',
        price: item.price || '0',
        regular_price: item.compare_at_price || item.price || '0',
        sale_price: item.price || '0',
        on_sale: !!(item.compare_at_price && item.compare_at_price !== item.price),
        featured: false,
        status: item.status === 'active' ? 'publish' : 'draft',
        stock_status: item.stock_quantity > 0 ? 'instock' : 'outofstock',
        manage_stock: true,
        stock_quantity: item.stock_quantity,
        total_sales: 0,
        average_rating: '0',
        rating_count: 0,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          src: img.url || img.src || '',
          name: img.alt_text || '',
          alt: img.alt_text || '',
          position: img.position || 0,
        })),
        categories: item.category ? [{
          id: 0,
          name: item.category,
          slug: item.category.toLowerCase().replace(/\s+/g, '-'),
        }] : [],
        tags: [],
        attributes: [],
        related_ids: [],
        brands: [],
        weight: (item as any).weight_kg ? `${(item as any).weight_kg} kg` : '',
        dimensions: (item as any).dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.slug || item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price,
        specifications: (item as any).specifications,
      } as Product));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Sale Products Hook
// ============================================================================

/**
 * Hook for fetching products on sale
 *
 * @param limit - Number of products to fetch
 * @returns Sale products result
 *
 * @example
 * const { data: products } = useOnSaleProducts(10);
 */
export function useOnSaleProducts(limit: number = 10) {
  return useQuery({
    queryKey: ['sale-products', limit],
    queryFn: async () => {
      const items = await productService.getSaleProducts(limit);

      // Transform to shared-core Product format
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.sku || item.id?.toString() || '',
        description: item.description || '',
        short_description: item.description?.substring(0, 150) || '',
        sku: item.sku || '',
        price: item.price || '0',
        regular_price: item.compare_at_price || item.price || '0',
        sale_price: item.price || '0',
        on_sale: !!(item.compare_at_price && item.compare_at_price !== item.price),
        featured: false,
        status: item.status === 'active' ? 'publish' : 'draft',
        stock_status: item.stock_quantity > 0 ? 'instock' : 'outofstock',
        manage_stock: true,
        stock_quantity: item.stock_quantity,
        total_sales: 0,
        average_rating: '0',
        rating_count: 0,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          src: img.url || img.src || '',
          name: img.alt_text || '',
          alt: img.alt_text || '',
          position: img.position || 0,
        })),
        categories: item.category ? [{
          id: 0,
          name: item.category,
          slug: item.category.toLowerCase().replace(/\s+/g, '-'),
        }] : [],
        tags: [],
        attributes: [],
        related_ids: [],
        brands: [],
        weight: (item as any).weight_kg ? `${(item as any).weight_kg} kg` : '',
        dimensions: (item as any).dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.slug || item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price,
        specifications: (item as any).specifications,
      } as Product));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Search Products Hook
// ============================================================================

/**
 * Hook for searching products
 *
 * @param query - Search query
 * @param filters - Optional filters
 * @returns Search results
 *
 * @example
 * const { data: products } = useProductSearch('thermometer');
 */
export function useProductSearch(
  query: string,
  filters?: Parameters<typeof productService.searchProducts>[1]
) {
  return useQuery({
    queryKey: ['product-search', query, filters],
    queryFn: () => productService.searchProducts(query, filters),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// Product Pricing Hook
// ============================================================================

/**
 * Hook for fetching product pricing details
 *
 * @param productId - Product ID
 * @returns Pricing details
 *
 * @example
 * const { data: pricing } = useProductPricing('product-id');
 */
export function useProductPricing(productId: string) {
  return useQuery({
    queryKey: ['product-pricing', productId],
    queryFn: () => productService.getProductPricing(productId),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Best Sellers Hook
// ============================================================================

/**
 * Hook for fetching bestseller products
 * (Alias for featured products)
 *
 * @param limit - Number of products to fetch
 * @returns Bestseller products result
 *
 * @example
 * const { data: products } = useBestSellers(10);
 */
export function useBestSellers(limit: number = 10) {
  return useQuery({
    queryKey: ['bestsellers', limit],
    queryFn: async () => {
      const items = await productService.getFeaturedProducts(limit);

      // Transform to shared-core Product format
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.sku || item.id?.toString() || '',
        description: item.description || '',
        short_description: item.description?.substring(0, 150) || '',
        sku: item.sku || '',
        price: item.price || '0',
        regular_price: item.compare_at_price || item.price || '0',
        sale_price: item.price || '0',
        on_sale: !!(item.compare_at_price && item.compare_at_price !== item.price),
        featured: true,
        status: item.status === 'active' ? 'publish' : 'draft',
        stock_status: item.stock_quantity > 0 ? 'instock' : 'outofstock',
        manage_stock: true,
        stock_quantity: item.stock_quantity,
        total_sales: 0,
        average_rating: '0',
        rating_count: 0,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          src: img.url || img.src || '',
          name: img.alt_text || '',
          alt: img.alt_text || '',
          position: img.position || 0,
        })),
        categories: item.category ? [{
          id: 0,
          name: item.category,
          slug: item.category.toLowerCase().replace(/\s+/g, '-'),
        }] : [],
        tags: [],
        attributes: [],
        related_ids: [],
        brands: [],
        weight: (item as any).weight_kg ? `${(item as any).weight_kg} kg` : '',
        dimensions: (item as any).dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.slug || item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price,
        specifications: (item as any).specifications,
      } as Product));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Exports
// ============================================================================

export type { UseProductsParams, UseProductsResult, Product };
export type { ProductFilterParams };
