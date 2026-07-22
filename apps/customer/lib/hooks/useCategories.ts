import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { categoryService } from '@/lib/services/category-service';
import type { Category, Product } from '@mymeddevices/core/lib/data/types';

// ============================================================================
// Types
// ============================================================================

interface UseCategoriesResult {
  data: Category[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface UseCategoryResult {
  data: Category | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface UseCategoryProductsResult {
  data: Product[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  total: number;
  page: number;
  limit: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

// ============================================================================
// Categories Hook
// ============================================================================

/**
 * Hook for fetching all categories with React Query
 *
 * @param options - React Query options
 * @returns Categories result with loading states
 *
 * @example
 * const { data: categories, isLoading } = useCategories();
 */
export function useCategories(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>): UseCategoriesResult {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const items = await categoryService.getCategories();

      // Transform to shared-core Category format
      return items.map((item: any) => ({
        id: item.id || item.name,
        name: item.name,
        slug: item.slug,
        parent: item.parent_id || 0,
        description: item.description || '',
        display: item.display || 'default',
        image: item.image_url ? { src: item.image_url } : null,
        count: item.count || item.product_count || 0,
        subCategories: item.children || [],
      } as Category));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
}

// ============================================================================
// Category By Slug Hook
// ============================================================================

/**
 * Hook for fetching a single category by slug
 *
 * @param slug - Category slug
 * @param options - React Query options
 * @returns Category result with products
 *
 * @example
 * const { data: category, isLoading } = useCategoryBySlug('surgical-equipment');
 */
export function useCategoryBySlug(
  slug: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
): UseCategoryResult {
  const query = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const item = await categoryService.getCategory(slug);
      if (!item) return null;

      // Transform to shared-core Category format
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        parent: item.parent_id || 0,
        description: item.description || '',
        display: item.display || 'default',
        image: item.image_url ? { src: item.image_url } : null,
        count: item.count || item.product_count || 0,
        subCategories: item.children || [],
      } as Category;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
}

// ============================================================================
// Category Products Hook
// ============================================================================

/**
 * Hook for fetching products for a specific category
 *
 * @param slug - Category slug
 * @param params - Pagination parameters
 * @param options - React Query options
 * @returns Category products result
 *
 * @example
 * const { data: products, isLoading } = useCategoryProducts('surgical-equipment', { page: 1, limit: 20 });
 */
export function useCategoryProducts(
  slug: string,
  params: PaginationParams = {},
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
): UseCategoryProductsResult {
  const query = useQuery({
    queryKey: ['category-products', slug, params],
    queryFn: async () => {
      const response = await categoryService.getCategoryProducts(slug, params);

      // Transform products to shared-core Product format
      const products: Product[] = response.items.map((item: any) => ({
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
        weight: item.weight_kg ? `${item.weight_kg} kg` : '',
        dimensions: item.dimensions || { length: '', width: '', height: '' },
        meta_data: [],
        date_created: item.created_at || new Date().toISOString(),
        permalink: `/products/${item.sku || item.id}`,
        type: 'simple',
        purchasable: true,
        catalog_visibility: 'visible',
        cost_price: item.cost_price,
        specifications: item.specifications,
      }));

      return {
        items: products,
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  const data = query.data || { items: [], total: 0, page: 1, limit: 20 };

  return {
    data: data.items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    total: data.total,
    page: data.page,
    limit: data.limit,
  };
}

// ============================================================================
// Category Tree Hook
// ============================================================================

/**
 * Hook for fetching category tree (nested structure)
 *
 * @param options - React Query options
 * @returns Category tree result
 *
 * @example
 * const { data: categories } = useCategoryTree();
 */
export function useCategoryTree(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>): UseCategoriesResult {
  const query = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => {
      const items = await categoryService.getCategoryTree();

      // Transform to shared-core Category format
      return items.map((item: any) => ({
        id: item.id || item.name,
        name: item.name,
        slug: item.slug,
        parent: item.parent_id || 0,
        description: item.description || '',
        display: item.display || 'default',
        image: item.image_url ? { src: item.image_url } : null,
        count: item.count || item.product_count || 0,
        subCategories: item.children || [],
      } as Category));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
}

// ============================================================================
// Subcategories Hook
// ============================================================================

/**
 * Hook for fetching subcategories for a parent category
 *
 * @param parentSlug - Parent category slug
 * @param options - React Query options
 * @returns Subcategories result
 *
 * @example
 * const { data: subcategories } = useSubcategories('surgical-equipment');
 */
export function useSubcategories(
  parentSlug: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
): UseCategoriesResult {
  const query = useQuery({
    queryKey: ['subcategories', parentSlug],
    queryFn: async () => {
      const items = await categoryService.getSubcategories(parentSlug);

      // Transform to shared-core Category format
      return items.map((item: any) => ({
        id: item.id || item.name,
        name: item.name,
        slug: item.slug,
        parent: item.parent_id || 0,
        description: item.description || '',
        display: item.display || 'default',
        image: item.image_url ? { src: item.image_url } : null,
        count: item.count || item.product_count || 0,
        subCategories: item.children || [],
      } as Category));
    },
    enabled: !!parentSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  Category,
  Product,
  UseCategoriesResult,
  UseCategoryResult,
  UseCategoryProductsResult,
};

export type { PaginationParams };
