import { apiClient } from '@mymeddevices/shared-core';

// ============================================================================
// Types
// ============================================================================

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price?: string;
  notes?: string;
  substitution_allowed?: boolean;
  product?: {
    id: string;
    sku: string;
    name: string;
    price: string;
    image_url?: string;
    stock_quantity: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  customer_id?: string;
  session_id?: string;
  cart_token: string;
  cart_type: 'guest' | 'customer' | 'saved';
  is_active: boolean;
  expires_at?: string;
  items: CartItem[];
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemAdd {
  product_id: string;
  quantity: number;
  notes?: string;
  substitution_allowed?: boolean;
}

export interface CartItemUpdate {
  quantity?: number;
  notes?: string;
  substitution_allowed?: boolean;
}

export interface CartTotals {
  subtotal: string;
  tax: string;
  shipping: string;
  discount: string;
  total: string;
  item_count: number;
}

export interface CartValidation {
  is_valid: boolean;
  cart_id: string;
  item_count: number;
  errors: string[];
  warnings: string[];
  subtotal: string;
  estimated_total: string;
}

export interface CouponDiscount {
  coupon_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_amount: string;
}

export interface CartMergeRequest {
  guest_cart_token: string;
  merge_method: 'merge' | 'replace';
}

export interface CartMergeResponse {
  success: boolean;
  message: string;
  cart_id: string;
  item_count: number;
  merge_method: string;
}

// ============================================================================
// Cart Service
// ============================================================================

/**
 * Cart service for API integration
 *
 * Handles all cart-related operations including:
 * - Cart CRUD operations
 * - Guest and customer cart management
 * - Cart validation and totals
 * - Guest cart merging
 * - Coupon management
 */
export const cartService = {
  /**
   * Get current cart (guest or customer)
   */
  async getCart(cartToken?: string): Promise<Cart> {
    try {
      const params = cartToken ? { cart_token: cartToken } : undefined;
      const response = await apiClient.get<any>('/shopping/cart/my', { params });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      throw error;
    }
  },

  /**
   * Add item to cart
   */
  async addItem(item: CartItemAdd, cartToken?: string): Promise<CartItem> {
    try {
      const params = cartToken ? { cart_token: cartToken } : undefined;
      const response = await apiClient.post<any>('/shopping/cart/items', item, {
        params,
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  },

  /**
   * Add multiple items to cart
   */
  async addBulkItems(items: CartItemAdd[], cartToken?: string): Promise<{
    added_count: number;
    error_count: number;
    added_items: CartItem[];
    errors: any[];
  }> {
    try {
      const params = cartToken ? { cart_token: cartToken } : undefined;
      const response = await apiClient.post<any>('/shopping/cart/items/bulk', items, {
        params,
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add items to cart:', error);
      throw error;
    }
  },

  /**
   * Update cart item
   */
  async updateItem(
    itemId: string,
    update: CartItemUpdate
  ): Promise<CartItem> {
    try {
      const response = await apiClient.patch<any>(
        `/shopping/cart/items/${itemId}`,
        update
      );

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    }
  },

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/shopping/cart/items/${itemId}`);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    }
  },

  /**
   * Remove multiple items from cart
   */
  async removeBulkItems(itemIds: string[]): Promise<{ removed_count: number }> {
    try {
      const response = await apiClient.delete<any>('/shopping/cart/items/bulk', {
        body: itemIds,
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to remove items from cart:', error);
      throw error;
    }
  },

  /**
   * Clear entire cart
   */
  async clearCart(cartToken?: string): Promise<{ removed_count: number }> {
    try {
      const params = cartToken ? { cart_token: cartToken } : undefined;
      const response = await apiClient.delete<any>('/shopping/cart/clear', {
        params,
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  },

  async getTotals(cartId: string, lat?: number, lon?: number): Promise<CartTotals> {
    try {
      const params: any = { cart_id: cartId };
      if (lat !== undefined && lat !== null) params.lat = lat;
      if (lon !== undefined && lon !== null) params.lon = lon;

      const response = await apiClient.get<any>(`/shopping/cart/totals`, {
        params,
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch cart totals:', error);
      throw error;
    }
  },

  /**
   * Validate cart for stock and price changes
   */
  async validateCart(cartId: string): Promise<CartValidation> {
    try {
      const response = await apiClient.post<any>('/shopping/cart/validate', null, {
        params: { cart_id: cartId },
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to validate cart:', error);
      throw error;
    }
  },

  /**
   * Merge guest cart into customer cart
   */
  async mergeGuestCart(
    guestToken: string,
    mergeMethod: 'merge' | 'replace' = 'merge'
  ): Promise<CartMergeResponse> {
    try {
      const response = await apiClient.post<any>('/shopping/cart/merge', {
        guest_cart_token: guestToken,
        merge_method: mergeMethod,
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to merge cart:', error);
      throw error;
    }
  },

  /**
   * Apply coupon to cart
   */
  async applyCoupon(cartId: string, code: string): Promise<CouponDiscount> {
    try {
      const response = await apiClient.post<any>(
        '/shopping/cart/coupon',
        null,
        {
          params: { cart_id: cartId, coupon_code: code },
        }
      );

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      throw error;
    }
  },

  /**
   * Remove coupon from cart
   */
  async removeCoupon(cartId: string, discountId: string): Promise<void> {
    try {
      await apiClient.delete('/shopping/cart/coupon', {
        params: { cart_id: cartId, discount_id: discountId },
      });
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      throw error;
    }
  },

  // ============================================================================
  // Saved Cart Operations
  // ============================================================================

  /**
   * Save current cart for later
   */
  async saveCart(name: string, description?: string): Promise<{
    id: string;
    name: string;
    item_count: number;
    message: string;
  }> {
    try {
      const response = await apiClient.post<any>('/shopping/cart/save', null, {
        params: { name, description },
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to save cart:', error);
      throw error;
    }
  },

  /**
   * Get saved carts
   */
  async getSavedCarts(offset = 0, limit = 20): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      item_count: number;
      created_at: string;
    }>
  > {
    try {
      const response = await apiClient.get<any>('/shopping/cart/saved', {
        params: { offset, limit },
      });

      if (response && response.saved_carts) {
        return response.saved_carts;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch saved carts:', error);
      throw error;
    }
  },

  /**
   * Restore saved cart to current cart
   */
  async restoreSavedCart(
    savedCartId: string,
    replace = false
  ): Promise<{
    message: string;
    cart_id: string;
    item_count: number;
  }> {
    try {
      const response = await apiClient.post<any>(
        `/shopping/cart/saved/${savedCartId}/restore`,
        null,
        { params: { replace } }
      );

      if (response) {
        return response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to restore cart:', error);
      throw error;
    }
  },

  /**
   * Delete saved cart
   */
  async deleteSavedCart(savedCartId: string): Promise<void> {
    try {
      await apiClient.delete(`/shopping/cart/saved/${savedCartId}`);
    } catch (error) {
      console.error('Failed to delete saved cart:', error);
      throw error;
    }
  },
};

// ============================================================================
// Export
// ============================================================================
