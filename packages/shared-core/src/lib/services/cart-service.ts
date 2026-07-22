import { apiClient, getApiUrl } from './api-client';
import { toast } from 'sonner';

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

      if (response?.success && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      throw error;
    }
  },

  /**
   * Add item to cart
   * Returns the full cart with items and cart_token
   */
  async addItem(item: CartItemAdd, cartToken?: string): Promise<Cart> {
    try {
      const params = cartToken ? { cart_token: cartToken } : undefined;
      const response = await apiClient.post<any>('/shopping/cart/items', item, {
        params,
      });

      if (response?.success && response.data) {
        toast.success('Item added to cart');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast.error('Failed to add item to cart');
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

      if (response?.success && response.data) {
        toast.success(`${response.data.added_count} items added to cart`);
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add items to cart:', error);
      toast.error('Failed to add items to cart');
      throw error;
    }
  },

  async updateItem(
    itemId: string,
    update: CartItemUpdate,
    cartToken?: string
  ): Promise<CartItem> {
    try {
      const response = await apiClient.patch<any>(
        `/shopping/cart/items/${itemId}`,
        update,
        {
          params: cartToken ? { cart_token: cartToken } : undefined,
        }
      );
 
      if (response?.success && response.data) {
        toast.success('Cart updated');
        return response.data;
      }
 
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast.error('Failed to update cart');
      throw error;
    }
  },
 
  /**
   * Remove item from cart
   */
  async removeItem(itemId: string, cartToken?: string): Promise<void> {
    try {
      await apiClient.delete(`/shopping/cart/items/${itemId}`, {
        params: cartToken ? { cart_token: cartToken } : undefined,
      });
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      toast.error('Failed to remove item');
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

      if (response?.success && response.data) {
        toast.success(`${response.data.removed_count} items removed`);
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to remove items from cart:', error);
      toast.error('Failed to remove items');
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

      if (response?.success && response.data) {
        toast.success('Cart cleared');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
      throw error;
    }
  },

  /**
   * Get cart totals
   */
  async getTotals(cartId: string): Promise<CartTotals> {
    try {
      const response = await apiClient.get<any>(`/shopping/cart/totals`, {
        params: { cart_id: cartId },
      });

      if (response?.success && response.data) {
        return response.data;
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

      if (response?.success && response.data) {
        return response.data;
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

      if (response?.success && response.data) {
        toast.success('Cart merged successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to merge cart:', error);
      toast.error('Failed to merge cart');
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

      if (response?.success && response.data) {
        toast.success('Coupon applied successfully');
        return response.data;
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
  async removeCoupon(cartId: string, discountId: string): Promise<void> {
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

      if (response?.success && response.data) {
        toast.success('Cart saved successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to save cart:', error);
      toast.error('Failed to save cart');
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

      if (response?.success && response.data?.saved_carts) {
        return response.data.saved_carts;
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

      if (response?.success && response.data) {
        toast.success('Cart restored successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to restore cart:', error);
      toast.error('Failed to restore cart');
      throw error;
    }
  },

  /**
   * Delete saved cart
   */
  async deleteSavedCart(savedCartId: string): Promise<void> {
    try {
      await apiClient.delete(`/shopping/cart/saved/${savedCartId}`);
      toast.success('Saved cart deleted');
    } catch (error) {
      console.error('Failed to delete saved cart:', error);
      toast.error('Failed to delete saved cart');
      throw error;
    }
  },
};

// ============================================================================
// Export
// ============================================================================
