import { apiClient } from './api-client';
import { productService, type Product } from './product-service';
import { type Category as GlobalCategory, type ProductImage } from '../data/types';

// ============================================================================
// Types
// ============================================================================

export type Category = GlobalCategory;

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
 */
export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    try {


      // Try dedicated endpoint first (if backend adds it)
      try {
        const response = await apiClient.get<any>('/catalog/categories');
        const categoriesList = response?.data || response;
        if (categoriesList && Array.isArray(categoriesList)) {
          return categoriesList.map((c: any) => ({
            ...c,
            product_count: c.product_count ?? c.count ?? 0,
            count: c.product_count ?? c.count ?? 0,
            image_url: c.icon_url || c.image_url || null,
          }));
        }
      } catch {
        // Endpoint doesn't exist, fall back to extracting from products
      }

      // Extract categories from products
      const productsResponse = await productService.getProducts({ limit: 100 });
      const categoryMap = new Map<string, Category>();

      productsResponse.items.forEach((product) => {
        // Try to extract category from product
        const categoryValue = (product.categories?.[0]?.name) || this.extractCategoryFromProduct(product);

        if (categoryValue) {
          if (!categoryMap.has(categoryValue)) {
            categoryMap.set(categoryValue, {
              id: categoryValue,
              name: this.formatCategoryName(categoryValue),
              slug: this.slugify(categoryValue),
              description: '',
              parent: 0,
              display: 'default',
              image: null,
              count: 1,
            });
          } else {
            const category = categoryMap.get(categoryValue)!;
            category.count = (category.count || 0) + 1;
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

      if (productsResponse.items.length === 0) {
        return null;
      }

      // Extract category info from first product
      const firstProduct = productsResponse.items[0];
      const categoryValue = (firstProduct.categories?.[0]?.name) || this.extractCategoryFromProduct(firstProduct);

      if (!categoryValue) {
        return null;
      }

      return {
        id: categoryValue,
        name: this.formatCategoryName(categoryValue),
        slug: slug,
        description: `Browse our ${this.formatCategoryName(categoryValue)} collection`,
        parent: 0,
        display: 'default',
        image: null,
        count: productsResponse.total,
        products: productsResponse.items,
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
    if (product.categories && product.categories.length > 0) {
      return product.categories[0].name;
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
  CategoryWithProducts,
  PaginationParams,
  PaginatedResponse,
};
