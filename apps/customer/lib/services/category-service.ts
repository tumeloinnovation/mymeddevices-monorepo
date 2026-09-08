import { isValidImageUrl } from '@/lib/utils/image';
import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { productService, type Product } from './product-service';

// ============================================================================
// Types
// ============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  image_url: string | null;
  icon_url?: string | null;
  product_count: number;
  parent: number;
  display: string;
  image?: { src: string } | null;
  count: number;
  children?: Category[];
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Category Service
// ============================================================================

/**
 * Category service for API integration
 *
 * Handles category-related operations including:
 * - Category listing
 * - Category details
 * - Category products
 *
 * Note: Currently extracts categories from product data.
 * Can be extended when dedicated category endpoints are added to the backend.
 */
export const categoryService = {
  /**
   * Get all categories
   *
   * Currently extracts unique categories from products.
   * Can be replaced with dedicated endpoint when available.
   */
  async getCategories(): Promise<Category[]> {
    try {
      // Try dedicated endpoint first (if backend adds it)
      try {
        const response = await apiClient.get<any>('/catalog/categories');
        const categoriesList = response?.data || response;
        if (categoriesList && Array.isArray(categoriesList)) {
          return categoriesList.map((c: any) => {
            const rawImg = c.image_url || (isValidImageUrl(c.icon_url) ? c.icon_url : null);
            const validImg = isValidImageUrl(rawImg) ? rawImg : null;
            return {
              ...c,
              product_count: c.product_count ?? c.count ?? 0,
              count: c.product_count ?? c.count ?? 0,
              image_url: validImg,
              image: validImg ? { src: validImg } : null,
            };
          });
        }
      } catch {
        // Endpoint doesn't exist, fall back to extracting from products
      }

      // Extract categories from products
      const productsResponse = await productService.getProducts({ limit: 100 });
      const categoryMap = new Map<string, Category>();

      productsResponse.items.forEach((product) => {
        const categoryValue = (product as any).category || ((product as any).categories?.[0]?.name) || this.extractCategoryFromProduct(product);

        if (categoryValue) {
          if (!categoryMap.has(categoryValue)) {
            categoryMap.set(categoryValue, {
              id: categoryValue,
              name: this.formatCategoryName(categoryValue),
              slug: this.slugify(categoryValue),
              description: '',
              parent_id: '0',
              image_url: null,
              product_count: 1,
              parent: 0,
              display: 'default',
              image: null,
              count: 1,
            });
          } else {
            const category = categoryMap.get(categoryValue)!;
            category.product_count = (category.product_count || 0) + 1;
            category.count = category.product_count;
          }
        }
      });

      return Array.from(categoryMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  /**
   * Get category by slug
   */
  async getCategory(slug: string): Promise<CategoryWithProducts | null> {
    try {
      // Try dedicated endpoint first
      try {
        const response = await apiClient.get<any>(`/catalog/categories/${slug}`);
        const catData = response?.data || response;
        if (catData && typeof catData === 'object') {
          return {
            ...catData,
            products: catData.products || [],
          };
        }
      } catch {
        // Endpoint doesn't exist, fall back to search
      }

      // Get products matching the category
      const productsResponse = await productService.getProducts({
        category: slug,
        limit: 50,
      });

      // If no category found in db, construct fallback intent category object
      const formattedName = this.formatCategoryName(slug);
      return {
        id: slug,
        name: formattedName,
        slug: slug,
        description: `Browse our ${formattedName} medical equipment and healthcare supplies.`,
        parent_id: '0',
        image_url: null,
        product_count: productsResponse.total || 0,
        parent: 0,
        display: 'default',
        image: null,
        count: productsResponse.total || 0,
        products: productsResponse.items || [],
      };
    } catch (error) {
      console.error(`Failed to fetch category ${slug}:`, error);
      return null;
    }
  },

  /**
   * Get products for a category
   */
  async getCategoryProducts(
    slug: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      return await productService.getProducts({
        category: slug,
        page: params.page,
        limit: params.limit,
        sort: params.sort,
      });
    } catch (error) {
      console.error(`Failed to fetch products for category ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Get category tree (nested structure)
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      const categories = await this.getCategories();

      // For now, return flat structure
      // Can be enhanced when parent-child relationships are added
      return categories;
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
      return [];
    }
  },

  /**
   * Get subcategories for a parent category
   */
  async getSubcategories(parentSlug: string): Promise<Category[]> {
    try {
      // For now, return empty as we don't have hierarchical categories
      // Can be enhanced when hierarchy is added
      return [];
    } catch (error) {
      console.error(`Failed to fetch subcategories for ${parentSlug}:`, error);
      return [];
    }
  },

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract category from product
   */
  extractCategoryFromProduct(product: Product): string | null {
    // Try various fields that might contain category info
    if (product.category) {
      return product.category;
    }

    // Try to extract from product name or description
    const medicalCategories = [
      'surgical',
      'diagnostic',
      'therapeutic',
      'mobility',
      'hospital',
      'dental',
      'imaging',
      'laboratory',
      'consumables',
      'furniture',
    ];

    const searchText = `${product.name} ${product.description || ''}`.toLowerCase();

    for (const category of medicalCategories) {
      if (searchText.includes(category)) {
        return category;
      }
    }

    return 'general';
  },

  /**
   * Format category name for display
   */
  formatCategoryName(category: string): string {
    return category
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Convert category to slug
   */
  slugify(category: string): string {
    return category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },
};

// ============================================================================
// Export
// ============================================================================

export type {
  Category,
  CategoryWithProducts,
  PaginationParams,
  PaginatedResponse,
};
