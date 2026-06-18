'use client'

import { useMemo } from 'react';
import { useVendorProducts, useVendorOrders, useVendorProfile, useVendorDashboardStats, DEMO_VENDOR_ID } from './useVendorData';
import type { Product, Vendor, VendorStoreSettings, VendorSettingsUpdateRequest, ProductFormData } from '@/lib/data/types';

// Re-export hooks from useVendorData
export { useVendorProducts, useVendorOrders, useVendorProfile, useVendorDashboardStats };

/**
 * Mock hook for fetching a single vendor product
 */
export function useVendorProductQuery(id: number) {
  const products = useVendorProducts();
  const product = useMemo(() => products.find(p => p.id === id), [products, id]);
  
  return {
    data: product,
    isLoading: false,
    error: null
  };
}

/**
 * Mock hook for updating a vendor product
 */
export function useUpdateVendorProduct(id: number) {
  return {
    mutateAsync: async (data: Partial<ProductFormData>) => {
      console.log('Mock update product:', id, data);
      return { id, ...data };
    },
    isPending: false
  };
}

/**
 * Mock hook for creating a vendor product
 */
export function useCreateVendorProduct() {
  return {
    mutateAsync: async (data: ProductFormData) => {
      console.log('Mock create product:', data);
      return { id: Math.floor(Math.random() * 10000), ...data };
    },
    isPending: false
  };
}

/**
 * Mock hook for deleting a vendor product
 */
export function useDeleteVendorProduct() {
  return {
    mutateAsync: async (id: number) => {
      console.log('Mock delete product:', id);
      return true;
    },
    isPending: false
  };
}

/**
 * Mock hook for updating vendor settings
 */
export function useUpdateVendorSettings() {
  return {
    mutateAsync: async (data: VendorSettingsUpdateRequest) => {
      console.log('Mock update settings:', data);
      return data;
    },
    isPending: false
  };
}

/**
 * Mock hook for generating a SKU
 */
export function useGenerateSKU() {
  return {
    generateSKU: (name: string = 'PRD') => {
      return name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 10000);
    }
  };
}

/**
 * Mock hook for validating a SKU
 */
export function useValidateSKU() {
  return {
    mutateAsync: async (data: { sku: string; productId?: number; excludeId?: number }) => {
      return { valid: true, available: true, message: 'SKU is available' };
    },
    isPending: false
  };
}

export interface ProductsStats {
  totalProducts: number;
  publishedCount: number;
  draftCount: number;
  pendingCount: number;
  lowStockCount: number;
  totalInventoryValue?: number;
  averagePrice?: number;
}
