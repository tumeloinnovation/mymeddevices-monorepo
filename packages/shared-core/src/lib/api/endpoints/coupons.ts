import { apiClient } from '@/lib/services/api-client';

export interface CustomerCoupon {
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
  distribution_type: string;
  restrictions: {
    min_order_value?: number;
    max_discount_amount?: number;
    new_customers_only?: boolean;
    one_time_per_customer?: boolean;
    global_usage_limit?: number;
  } | null;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  discount_amount: number;
  used_at: string;
}

export const customerCouponsApi = {
  getAvailable: () =>
    apiClient.get<CustomerCoupon[]>('/coupons/available'),

  getMyCoupons: () =>
    apiClient.get<{ items: CouponUsage[]; total: number }>('/coupons/my'),

  validate: (code: string, cartTotal?: number) =>
    apiClient.post<{ valid: boolean; coupon: CustomerCoupon; discount?: number }>('/coupons/validate', { code, cart_total: cartTotal }),

  apply: (code: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/coupons/${code}/apply`, {}),

  remove: () =>
    apiClient.delete<{ success: boolean; message: string }>('/coupons/remove'),
};
