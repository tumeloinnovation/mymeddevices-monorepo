import { api } from "@/services/api.client";

export interface ApplyCouponParams {
  code: string;
  cart_id: string;
  cart_token?: string;
}

export interface CouponResult {
  is_valid: boolean;
  code: string;
  message?: string;
  discount_amount?: number;
  discount_value?: number;
  coupon_type?: string;
}

export interface ShippingCalculateParams {
  shipping_address?: {
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    country?: string;
  };
  region?: string;
  subtotal?: number;
  items?: { product_id: string | number; quantity: number }[];
}

export interface ShippingRateResult {
  id: string;
  name: string;
  rate: number;
  estimated_days?: string;
}

export interface CartValidationResult {
  is_valid: boolean;
  cart_id: string;
  item_count: number;
  errors: string[];
  warnings: string[];
  subtotal: string;
  estimated_total: string;
}

export const checkoutApi = {
  /**
   * Validate and apply coupon code to active cart
   */
  applyCoupon: async (params: ApplyCouponParams): Promise<CouponResult> => {
    try {
      const response = await api.post<any>("/shopping/cart/coupon", null, {
        params: {
          code: params.code,
          cart_id: params.cart_id,
          cart_token: params.cart_token,
        },
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post<any>("/shopping/coupons/apply", {
        code: params.code,
        cart_id: params.cart_id,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Remove applied coupon from cart
   */
  removeCoupon: async (
    cartId: string,
    couponCode?: string,
    cartToken?: string
  ): Promise<any> => {
    try {
      const response = await api.delete("/shopping/cart/coupon", {
        params: {
          cart_id: cartId,
          coupon_code: couponCode,
          cart_token: cartToken,
        },
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post("/shopping/coupons/remove", {
        cart_id: cartId,
        coupon_code: couponCode,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Calculate delivery fee based on customer address & weight
   */
  calculateShipping: async (
    params: ShippingCalculateParams
  ): Promise<ShippingRateResult[]> => {
    try {
      const response = await api.post<any>("/shopping/shipping/calculate", params);
      const data = response.data?.data || response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.shipping_fee !== undefined) {
        return [
          {
            id: "standard",
            name: "Standard Delivery",
            rate: Number(data.shipping_fee),
            estimated_days: data.estimated_days || "1-3 days",
          },
        ];
      }
      return [
        {
          id: "standard",
          name: "Standard Delivery",
          rate: 200,
        },
      ];
    } catch {
      return [
        {
          id: "standard",
          name: "Standard Delivery",
          rate: 200,
        },
      ];
    }
  },

  /**
   * Pre-checkout validation (stock checks, prescription verification, pricing)
   */
  validateCart: async (
    cartId: string,
    cartToken?: string
  ): Promise<CartValidationResult> => {
    try {
      const response = await api.post<any>("/shopping/cart/validate", null, {
        params: { cart_id: cartId, cart_token: cartToken },
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post<any>("/shopping/checkout/validate", {
        cart_id: cartId,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Submit order from cart
   */
  submitOrder: async (payload: any): Promise<any> => {
    try {
      const response = await api.post("/shopping/checkout", payload);
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post("/shopping/orders", payload);
      return fallback.data?.data || fallback.data;
    }
  },
};

export default checkoutApi;
