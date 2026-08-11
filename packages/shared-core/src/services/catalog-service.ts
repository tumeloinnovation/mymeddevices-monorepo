import { apiClient } from './api-client';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  ProductImage,
  ProductImageCreate,
  ProductVariant,
  ProductVariantCreate,
  VariantMatrixRequest,
  BundleItem,
  BundleItemCreate,
  RelatedProduct,
  RelatedProductCreate,
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

  // Product Variants
  async getVariants(productId: string): Promise<ProductVariant[]> {
    return apiClient.get<ProductVariant[]>(`/catalog/products/${productId}/variants`);
  },

  async createVariant(productId: string, data: ProductVariantCreate): Promise<ProductVariant> {
    return apiClient.post<ProductVariant>(`/catalog/products/${productId}/variants`, data);
  },

  async createVariantMatrix(productId: string, data: VariantMatrixRequest): Promise<ProductVariant[]> {
    return apiClient.post<ProductVariant[]>(`/catalog/products/${productId}/variants/bulk`, data);
  },

  async updateVariant(productId: string, variantId: string, data: Partial<ProductVariantCreate>): Promise<ProductVariant> {
    return apiClient.patch<ProductVariant>(`/catalog/products/${productId}/variants/${variantId}`, data);
  },

  async deleteVariant(productId: string, variantId: string): Promise<void> {
    return apiClient.delete(`/catalog/products/${productId}/variants/${variantId}`);
  },

  // Bundle Items
  async getBundleItems(productId: string): Promise<BundleItem[]> {
    return apiClient.get<BundleItem[]>(`/catalog/products/${productId}/bundle-items`);
  },

  async addBundleItem(productId: string, data: BundleItemCreate): Promise<BundleItem> {
    return apiClient.post<BundleItem>(`/catalog/products/${productId}/bundle-items`, data);
  },

  async updateBundleItem(productId: string, itemId: string, data: Partial<BundleItemCreate>): Promise<BundleItem> {
    return apiClient.patch<BundleItem>(`/catalog/products/${productId}/bundle-items/${itemId}`, data);
  },

  async removeBundleItem(productId: string, itemId: string): Promise<void> {
    return apiClient.delete(`/catalog/products/${productId}/bundle-items/${itemId}`);
  },

  // Related Products
  async getRelatedProducts(productId: string, relation_type?: string): Promise<RelatedProduct[]> {
    return apiClient.get<RelatedProduct[]>(`/catalog/products/${productId}/related`, { params: { relation_type } });
  },

  async addRelatedProduct(productId: string, data: RelatedProductCreate): Promise<RelatedProduct> {
    return apiClient.post<RelatedProduct>(`/catalog/products/${productId}/related`, data);
  },

  async removeRelatedProduct(productId: string, relationId: string): Promise<void> {
    return apiClient.delete(`/catalog/products/${productId}/related/${relationId}`);
  },

  async getStorefrontRelatedProducts(slug: string, relation_type?: string): Promise<RelatedProduct[]> {
    return apiClient.get<RelatedProduct[]>(`/storefront/products/${slug}/related`, { params: { relation_type } });
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
  },

  // Bulk Import (Admin only)
  async bulkImportPreview(file: File): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    warnings_count: number;
    errors: Array<{ row: number; sku?: string; error: string; severity: string }>;
    warnings: Array<{ row: number; sku?: string; error: string; severity: string }>;
    preview_data: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/catalog/products/bulk-import/preview', formData);
  },

  async bulkImport(file: File, options?: {
    update_existing?: boolean;
    default_status?: string;
    skip_duplicates?: boolean;
    vendor_id?: string;
  }): Promise<{
    success: boolean;
    total_rows: number;
    created_count: number;
    updated_count: number;
    skipped_count: number;
    errors: Array<{ row: number; sku?: string; error: string; severity: string }>;
    warnings: Array<{ row: number; sku?: string; error: string; severity: string }>;
    created_products: string[];
    processing_time_seconds: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    // Append options as query params
    const params: Record<string, string> = {};
    if (options?.update_existing !== undefined) params.update_existing = String(options.update_existing);
    if (options?.default_status) params.default_status = options.default_status;
    if (options?.skip_duplicates !== undefined) params.skip_duplicates = String(options.skip_duplicates);
    if (options?.vendor_id) params.vendor_id = options.vendor_id;

    return apiClient.post('/catalog/products/bulk-import', formData, { params });
  },

  downloadImportTemplate(): void {
    const csvContent = [
      'name,sku,vendor_id,category_id,description,short_description,base_price,price,cost_price,currency,stock_quantity,stock_status,low_stock_threshold,track_inventory,weight_kg,brand,model_number,kmpdb_registration_number,ppb_classification,ce_marking_or_fda_clearance,warranty_info,permalink,meta_title,meta_description,tags,status,specifications',
      '"Sample Product","SKU-001","<vendor-uuid>","<category-uuid>","Product description goes here","Short description",1000.00,1200.00,800.00,"KES",50,"instock",10,true,1.5,"Brand Name","MODEL-123","KMPDB-REG-001","Class II","FDA-510k","1 year warranty","sample-product","Sample Product Meta Title","Sample product meta description","tag1,tag2,tag3","draft","{\\"key\\": \\"value\\"}"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products-import-template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
};
