import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface CouponRestrictions {
  min_order_value?: number;
  first_order_only?: boolean;
  free_shipping?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  coupon_type: string;
  discount_value: number;
  min_order_value?: number;
  max_discount_amount?: number;
  valid_from?: string;
  valid_until?: string;
  restrictions?: CouponRestrictions;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  coupon_code: string;
  discount_type: string;
  discount_value: number;
  used_at: string;
}

export interface CouponUsageResponse {
  items: CouponUsage[];
  total: number;
}

// ============================================================================
// Coupons API
// ============================================================================

export const customerCouponsApi = {
  /**
   * Get available coupons
   */
  async getAvailable(): Promise<Coupon[]> {
    try {
      const response = await apiClient.get<any>('/shopping/cart/coupon/available');
      const data = (response as any)?.data ?? response;

      if (Array.isArray(data)) {
        return data;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch available coupons:', error);
      return [];
    }
  },

  /**
   * Get my coupon usage history
   */
  async getMyCoupons(): Promise<CouponUsageResponse> {
    try {
      const response = await apiClient.get<any>('/shopping/cart/coupon/my-coupons');
      const data = (response as any)?.data ?? response;

      if (data && Array.isArray(data.items)) {
        return data;
      }

      return { items: [], total: 0 };
    } catch (error) {
      console.error('Failed to fetch coupon usage:', error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Apply coupon to cart
   */
  async applyCoupon(cartId: string, code: string): Promise<{
    is_valid: boolean;
    code: string;
    message: string;
    coupon_type?: string;
    discount_value?: number;
    discount_amount?: number;
  }> {
    try {
      const response = await apiClient.post<any>(
        '/shopping/cart/coupon',
        null,
        {
          params: { code, cart_id: cartId },
        }
      );
      const data = (response as any)?.data ?? response;

      if (data && typeof data === 'object') {
        if (data.is_valid) {
          toast.success(data.message || 'Coupon applied successfully');
        } else {
          toast.error(data.message || 'Invalid coupon');
        }
        return data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      toast.error('Failed to apply coupon');
      throw error;
    }
  },

  /**
   * Remove coupon from cart
   */
  async removeCoupon(cartId: string, discountId?: string): Promise<void> {
    try {
      await apiClient.delete('/shopping/cart/coupon', {
        params: { cart_id: cartId, discount_id: discountId },
      });
      toast.success('Coupon removed');
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      toast.error('Failed to remove coupon');
      throw error;
    }
  },
};
