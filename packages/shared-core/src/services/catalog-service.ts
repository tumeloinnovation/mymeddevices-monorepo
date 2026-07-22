import { apiClient } from './api-client';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  ProductImage,
  ProductImageCreate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryTree,
  AIAssistRequest,
  AIDescriptionRequest,
  AIAssistResponse,
  AIValidationResponse,
  ProductCompleteness,
  Brand,
  BrandQuickCreate,
  BrandCreate,
  BrandUpdate,
  BrandListResponse,
  Tag,
  TagCreate,
  TagUpdate,
  TagListResponse,
} from '../types/catalog';

export const catalogService = {
  // Vendor Product APIs
  async getVendorProducts(params: {
    status_filter?: string;
    category_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
    vendor_id?: string;
  }): Promise<ProductListResponse> {
    return apiClient.get<ProductListResponse>('/catalog/products', { params });
  },

  async getProduct(id: string): Promise<Product> {
    return apiClient.get<Product>(`/catalog/products/${id}`);
  },

  async createProduct(data: ProductCreate): Promise<Product> {
    return apiClient.post<Product>('/catalog/products', data);
  },

  async updateProduct(id: string, data: ProductUpdate): Promise<Product> {
    return apiClient.patch<Product>(`/catalog/products/${id}`, data);
  },

  async deleteProduct(id: string): Promise<void> {
    return apiClient.delete(`/catalog/products/${id}`);
  },

  // Lifecycle
  async verifyProduct(id: string): Promise<Product> {
    return apiClient.post<Product>(`/catalog/products/${id}/verify`, {});
  },

  async publishProduct(id: string): Promise<Product> {
    return apiClient.post<Product>(`/catalog/products/${id}/publish`, {});
  },

  async rejectProduct(id: string, reason: string): Promise<Product> {
    return apiClient.post<Product>(`/catalog/products/${id}/reject`, { reason });
  },

  async archiveProduct(id: string): Promise<Product> {
    return apiClient.post<Product>(`/catalog/products/${id}/archive`, {});
  },

  async unarchiveProduct(id: string): Promise<Product> {
    return apiClient.post<Product>(`/catalog/products/${id}/unarchive`, {});
  },

  // Completeness & AI
  async getCompleteness(id: string): Promise<ProductCompleteness> {
    return apiClient.get<ProductCompleteness>(`/catalog/products/${id}/completeness`);
  },

  async getAiSuggestions(id: string, data: AIAssistRequest): Promise<AIAssistResponse> {
    return apiClient.post<AIAssistResponse>(`/catalog/products/${id}/ai-assist`, data);
  },

  async aiValidateProduct(id: string): Promise<AIValidationResponse> {
    return apiClient.post<AIValidationResponse>(`/catalog/products/${id}/ai-validate`, {});
  },

  async generateDescriptions(data: AIDescriptionRequest): Promise<AIAssistResponse> {
    return apiClient.post<AIAssistResponse>('/catalog/ai/generate-descriptions', data);
  },

  // Images
  async uploadImage(id: string, file: File, options?: {
    alt_text?: string;
    is_primary?: boolean;
    sort_order?: number;
  }): Promise<ProductImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.alt_text) formData.append('alt_text', options.alt_text);
    if (options?.is_primary !== undefined) formData.append('is_primary', String(options.is_primary));
    if (options?.sort_order !== undefined) formData.append('sort_order', String(options.sort_order));

    return apiClient.post<ProductImage>(`/catalog/products/${id}/images`, formData);
  },

  async removeImage(productId: string, imageId: string): Promise<void> {
    return apiClient.delete(`/catalog/products/${productId}/images/${imageId}`);
  },

  async reorderImages(productId: string, imageIds: string[]): Promise<ProductImage[]> {
    return apiClient.patch<ProductImage[]>(`/catalog/products/${productId}/images/reorder`, { image_ids: imageIds });
  },

  // Categories
  async getCategories(): Promise<CategoryTree[]> {
    return apiClient.get<CategoryTree[]>('/catalog/categories');
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    return apiClient.post<Category>('/catalog/categories', data);
  },

  async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
    return apiClient.patch<Category>(`/catalog/categories/${id}`, data);
  },

  async deleteCategory(id: string): Promise<void> {
    return apiClient.delete(`/catalog/categories/${id}`);
  },

  // Brands
  async getBrands(params?: {
    active_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<BrandListResponse> {
    return apiClient.get<BrandListResponse>('/catalog/brands', { params });
  },

  async getBrand(id: string): Promise<Brand> {
    return apiClient.get<Brand>(`/catalog/brands/${id}`);
  },

  async createBrand(data: BrandCreate): Promise<Brand> {
    return apiClient.post<Brand>('/catalog/brands', data);
  },

  async updateBrand(id: string, data: BrandUpdate): Promise<Brand> {
    return apiClient.patch<Brand>(`/catalog/brands/${id}`, data);
  },

  async deleteBrand(id: string): Promise<void> {
    return apiClient.delete(`/catalog/brands/${id}`);
  },

  // Quick-create brand for inline creation during product creation
  async createQuickBrand(data: BrandQuickCreate): Promise<Brand> {
    return apiClient.post<Brand>('/catalog/brands/quick-create', data);
  },

  // Approve a pending brand (admin only)
  async approveBrand(id: string): Promise<Brand> {
    return apiClient.patch<Brand>(`/catalog/brands/${id}/approve`, {});
  },

  // Tags
  async getTags(params?: {
    active_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<TagListResponse> {
    return apiClient.get<TagListResponse>('/catalog/tags', { params });
  },

  async getTag(id: string): Promise<Tag> {
    return apiClient.get<Tag>(`/catalog/tags/${id}`);
  },

  async createTag(data: TagCreate): Promise<Tag> {
    return apiClient.post<Tag>('/catalog/tags', data);
  },

  async updateTag(id: string, data: TagUpdate): Promise<Tag> {
    return apiClient.patch<Tag>(`/catalog/tags/${id}`, data);
  },

  async deleteTag(id: string): Promise<void> {
    return apiClient.delete(`/catalog/tags/${id}`);
  },

  // Storefront APIs
  async getStorefrontProducts(params: {
    category_id?: string;
    category_slug?: string;
    search?: string;
    price_min?: number;
    price_max?: number;
    is_featured?: boolean;
    is_on_sale?: boolean;
    in_stock?: boolean;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ products: any[], total: number, page: number, page_size: number }> {
    return apiClient.get('/storefront/products', { params });
  },

  async getStorefrontProduct(slug: string): Promise<any> {
    return apiClient.get(`/storefront/products/${slug}`);
  },

  async getStorefrontCategories(): Promise<CategoryTree[]> {
    return apiClient.get('/storefront/categories');
  }
};
