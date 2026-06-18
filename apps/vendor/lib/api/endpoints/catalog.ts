import { apiClient } from '../client';
import type {
  Product,
  ProductListParams,
  PaginatedResponse,
  CreateProductDto,
  UpdateProductDto,
  ProductImage,
} from '../types';

type BackendProductList = {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
};

function mapBackendPage<T>(res: BackendProductList): PaginatedResponse<T> {
  return {
    items: res.products as unknown as T[],
    total: res.total,
    page: res.page,
    limit: res.page_size,
    pages: Math.ceil(res.total / res.page_size),
  };
}

function toBackendParams(params: ProductListParams): Record<string, string | number | undefined> {
  return {
    page: params.page,
    page_size: params.limit,
    search: params.search,
    status_filter: params.status === 'all' ? undefined : params.status,
    category_id: params.category_id === 'all' ? undefined : params.category_id,
    sort: params.sort,
    order: params.order,
  };
}

export const catalogApi = {
  getProducts: async (params: ProductListParams) => {
    const raw = await apiClient.get<BackendProductList>('/catalog/products', {
      params: toBackendParams(params) as any,
    });
    return mapBackendPage<Product>(raw);
  },

  getProduct: async (id: string) => {
    return await apiClient.get<Product>(`/catalog/products/${id}`);
  },

  createProduct: async (data: CreateProductDto) => {
    return await apiClient.post<Product>('/catalog/products', data);
  },

  updateProduct: async (id: string, data: UpdateProductDto) => {
    return await apiClient.patch<Product>(`/catalog/products/${id}`, data);
  },

  deleteProduct: async (id: string) => {
    await apiClient.delete(`/catalog/products/${id}`);
    return true;
  },

  uploadProductImage: async (productId: string, file: File) => {
    return await apiClient.upload<ProductImage>(
      `/catalog/products/${productId}/images`,
      file,
    );
  },

  getCategories: async () => {
    return await apiClient.get<any[]>('/catalog/categories');
  },

  verifyProduct: async (id: string) => {
    return await apiClient.post<Product>(`/catalog/products/${id}/verify`, {});
  },

  publishProduct: async (id: string) => {
    return await apiClient.post<Product>(`/catalog/products/${id}/publish`, {});
  },

  archiveProduct: async (id: string) => {
    return await apiClient.post<Product>(`/catalog/products/${id}/archive`, {});
  },

  unarchiveProduct: async (id: string) => {
    return await apiClient.post<Product>(`/catalog/products/${id}/unarchive`, {});
  },

  getProductCompleteness: async (id: string) => {
    return await apiClient.get<any>(`/catalog/products/${id}/completeness`);
  },
};
