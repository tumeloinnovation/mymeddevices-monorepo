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
    return await apiClient.get<VendorCoupon[]>('/coupons/vendor', { params: params as any });
  },

  getCoupon: async (id: string) => {
    return await apiClient.get<VendorCoupon>(`/coupons/${id}`);
  },

  create: async (data: {
    code: string;
    description?: string;
    coupon_type: string;
    discount_value: number;
    valid_from: string;
    valid_until?: string;
  }) => {
    return await apiClient.post<VendorCoupon>('/coupons/vendor', data);
  },

  update: async (id: string, data: Partial<VendorCoupon>) => {
    return await apiClient.patch<VendorCoupon>(`/coupons/${id}`, data);
  },

  delete: async (id: string) => {
    return await apiClient.delete<{ message: string }>(`/coupons/${id}`);
  },

  getStats: async () => {
    return await apiClient.get<{ total_coupons: number; active_coupons: number; total_usages: number }>('/coupons/stats');
  },
};
