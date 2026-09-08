import { api } from "@/services/api.client";

export interface BackendCartItem {
  id: string | number;
  product_id: string | number;
  product_variant_id?: string | number | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string | null;
  product?: {
    id: string | number;
    name: string;
    sku?: string;
    image_url?: string;
    price?: number;
    stock_quantity?: number;
  };
}

export interface BackendCart {
  id: string;
  user_id?: string | null;
  cart_token?: string | null;
  items: BackendCartItem[];
  item_count: number;
  subtotal: number;
  discount_amount?: number;
  total?: number;
}

export interface AddCartItemParams {
  product_id: string | number;
  product_variant_id?: string | number | null;
  quantity: number;
  notes?: string;
}

export interface UpdateCartItemParams {
  quantity?: number;
  notes?: string;
}

export interface SavedCart {
  id: string;
  name: string;
  description?: string | null;
  user_id: string;
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export const cartApi = {
  /**
   * Get active cart (supports guest cart token and authenticated user)
   */
  getCart: async (cartToken?: string): Promise<BackendCart> => {
    try {
      const response = await api.get<{ data: BackendCart }>("/shopping/cart/my", {
        params: cartToken ? { cart_token: cartToken } : undefined,
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.get<{ data: BackendCart }>("/shopping/cart", {
        params: cartToken ? { cart_token: cartToken } : undefined,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Add product/offer to active cart
   */
  addItem: async (item: AddCartItemParams, cartToken?: string): Promise<BackendCart> => {
    const response = await api.post<{ data: BackendCart }>("/shopping/cart/items", item, {
      params: cartToken ? { cart_token: cartToken } : undefined,
    });
    return response.data?.data || response.data;
  },

  /**
   * Update cart item quantity or notes
   */
  updateItem: async (
    itemId: string | number,
    item: UpdateCartItemParams,
    cartToken?: string
  ): Promise<any> => {
    const response = await api.patch(`/shopping/cart/items/${itemId}`, item, {
      params: cartToken ? { cart_token: cartToken } : undefined,
    });
    return response.data?.data || response.data;
  },

  /**
   * Remove item from cart
   */
  removeItem: async (itemId: string | number, cartToken?: string): Promise<void> => {
    await api.delete(`/shopping/cart/items/${itemId}`, {
      params: cartToken ? { cart_token: cartToken } : undefined,
    });
  },

  /**
   * Clear entire cart
   */
  clearCart: async (cartToken?: string): Promise<void> => {
    try {
      await api.delete("/shopping/cart/clear", {
        params: cartToken ? { cart_token: cartToken } : undefined,
      });
    } catch {
      await api.delete("/shopping/cart", {
        params: cartToken ? { cart_token: cartToken } : undefined,
      });
    }
  },

  /**
   * Merge local/guest cart items into customer's persistent backend cart on login
   */
  mergeCart: async (guestCartToken: string, mergeMethod = "merge"): Promise<any> => {
    const response = await api.post("/shopping/cart/merge", {
      guest_cart_token: guestCartToken,
      merge_method: mergeMethod,
    });
    return response.data?.data || response.data;
  },

  /**
   * Generate a shareable cart link/token
   */
  shareCart: async (cartId: string, expiresDays = 7): Promise<any> => {
    const response = await api.post(
      "/shopping/cart/share",
      { expires_days: expiresDays },
      { params: { cart_id: cartId } }
    );
    return response.data?.data || response.data;
  },

  /**
   * Load a shared cart by token
   */
  getSharedCart: async (token: string): Promise<any> => {
    const response = await api.get(`/shopping/cart/share/${token}`);
    return response.data?.data || response.data;
  },

  /**
   * Save current cart for later / reorder list
   */
  saveCart: async (
    data: { name: string; description?: string },
    sourceCartId?: string
  ): Promise<SavedCart> => {
    try {
      const response = await api.post("/shopping/cart/saved", data, {
        params: sourceCartId ? { source_cart_id: sourceCartId } : undefined,
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post("/shopping/saved-carts", data, {
        params: sourceCartId ? { source_cart_id: sourceCartId } : undefined,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Retrieve saved cart templates
   */
  getSavedCarts: async (page = 1, pageSize = 20): Promise<SavedCart[]> => {
    try {
      const response = await api.get("/shopping/cart/saved", {
        params: { page, page_size: pageSize },
      });
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      try {
        const fallback = await api.get("/shopping/saved-carts", {
          params: { page, page_size: pageSize },
        });
        return fallback.data?.data || (Array.isArray(fallback.data) ? fallback.data : []);
      } catch {
        return [];
      }
    }
  },
};

export default cartApi;
