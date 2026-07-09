import { apiClient } from '../client';
import type { PaginatedResponse } from '../types';

export interface VendorCoupon {
  id: string;
  code: string;
  description: string | null;
  coupon_type: string;
  discount_value: number;
  discount_scope: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  is_stackable: boolean;
  usage_count: number;
  created_at: string;
}

export const vendorCouponsApi = {
  getCoupons: async (params?: { page?: number; limit?: number; is_active?: boolean }) => {
    return await apiClient.get<VendorCoupon[]>('/shopping/vendor/coupons', { params: params as any });
  },

  getCoupon: async (id: string) => {
    return await apiClient.get<VendorCoupon>(`/shopping/vendor/coupons/${id}`);
  },

  create: async (data: {
    code: string;
    description?: string;
    coupon_type: string;
    discount_value: number;
    valid_from: string;
    valid_until?: string;
  }) => {
    return await apiClient.post<VendorCoupon>('/shopping/vendor/coupons', data);
  },

  update: async (id: string, data: Partial<VendorCoupon>) => {
    return await apiClient.patch<VendorCoupon>(`/shopping/vendor/coupons/${id}`, data);
  },

  delete: async (id: string) => {
    return await apiClient.delete<{ message: string }>(`/shopping/vendor/coupons/${id}`);
  },

  getStats: async (id: string) => {
    return await apiClient.get<any>(`/shopping/vendor/coupons/${id}/stats`);
  },
};
