import { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../endpoints';
import {
  Product,
  ProductListParams,
  PaginatedResponse,
  CreateProductDto,
  UpdateProductDto,
} from '../types';

export function useProducts(params: ProductListParams) {
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await catalogApi.getProducts(params);
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (dto: CreateProductDto) => {
    return await catalogApi.createProduct(dto);
  }, []);

  const updateProduct = useCallback(async (id: string, dto: UpdateProductDto) => {
    return await catalogApi.updateProduct(id, dto);
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    return await catalogApi.deleteProduct(id);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

export function useProduct(id: string) {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await catalogApi.getProduct(id);
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch product'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { data, loading, error, refetch: fetchProduct };
}

export function useCategories() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await catalogApi.getCategories();
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { data, loading, error, refetch: fetchCategories };
}
