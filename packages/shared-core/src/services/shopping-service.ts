import { apiClient } from "./api-client";
import { Product } from "../types/catalog";

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: Partial<Product>;
  notes?: string;
}

export interface Cart {
  id: string;
  user_id?: string;
  cart_token?: string;
  items: CartItem[];
}

export interface CartTotals {
  cart_id: string;
  subtotal: number;
  total: number;
  item_count: number;
}

export interface Order {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  items: any[];
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  coupon_type: string;
  discount_value: number;
  discount_scope: string;
  is_active: boolean;
  is_stackable: boolean;
  valid_from: string;
  valid_until?: string;
  distribution_type: string;
  min_order_value?: number;
  max_discount_amount?: number;
  global_usage_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface AbandonedCart {
  id: string;
  user_id: string;
  updated_at: string;
  items: any[];
}

export interface ShoppingAnalytics {
  total_orders: number;
  recent_orders: number;
  total_carts: number;
  abandoned_carts: number;
  total_revenue: number;
  recent_revenue: number;
  total_coupon_usages: number;
  average_cart_value: number;
  conversion_rate: number;
  monthly_trends: Array<{ year: number; month: number; count: number; revenue: number }>;
  status_breakdown: Record<string, number>;
}

class ShoppingService {
  // ============================================================================
  // ADMIN API
  // ============================================================================
  async getCoupons(onlyActive: boolean = false): Promise<Coupon[]> {
    return apiClient.get<Coupon[]>(`/admin/shopping/coupons?only_active=${onlyActive}`);
  }

  async createCoupon(data: any): Promise<Coupon> {
    return apiClient.post<Coupon>("/admin/shopping/coupons", data);
  }

  async getCoupon(id: string): Promise<Coupon> {
    return apiClient.get<Coupon>(`/admin/shopping/coupons/${id}`);
  }

  async updateCoupon(id: string, data: Partial<any>): Promise<Coupon> {
    return apiClient.patch<Coupon>(`/admin/shopping/coupons/${id}`, data);
  }

  async deleteCoupon(id: string): Promise<any> {
    return apiClient.delete(`/admin/shopping/coupons/${id}`);
  }

  async getAbandonedCarts(hoursThreshold: number = 24): Promise<AbandonedCart[]> {
    return apiClient.get<AbandonedCart[]>(`/admin/shopping/carts/abandoned?hours_threshold=${hoursThreshold}`);
  }

  async getAbandonedCartDetail(id: string): Promise<any> {
    return apiClient.get(`/admin/shopping/carts/abandoned/${id}`);
  }

  async recoverAbandonedCart(id: string): Promise<any> {
    return apiClient.post(`/admin/shopping/carts/abandoned/${id}/recover`, {});
  }

  async getAnalytics(): Promise<ShoppingAnalytics> {
    return apiClient.get<ShoppingAnalytics>("/admin/shopping/analytics");
  }

  async adminListOrders(params?: any): Promise<any> {
    return apiClient.get<any>("/admin/shopping/orders", { params });
  }

  async adminUpdateOrderStatus(orderId: string, status: string): Promise<any> {
    return apiClient.patch(`/admin/shopping/orders/${orderId}/status`, { status });
  }

  async updateOrderInternalNotes(orderId: string, internalNotes: string): Promise<any> {
    return apiClient.patch(`/admin/shopping/orders/${orderId}/internal-notes`, { internal_notes: internalNotes });
  }

  async vendorListOrders(page: number = 1, pageSize: number = 20): Promise<any> {
    return apiClient.get<any>(`/admin/shopping/orders/vendor?page=${page}&page_size=${pageSize}`);
  }

  // ============================================================================
  // MOCK SIMULATIONS
  // ============================================================================
  async processMockPayment(data: { order_id: string; payment_method?: string; card_number?: string }): Promise<any> {
    return apiClient.post("/shopping/payments/process-mock", data);
  }

  async processMockShipping(data: { order_id: string; carrier?: string }): Promise<any> {
    return apiClient.post("/shopping/shipping/ship-mock", data);
  }

  async getPaymentByOrder(orderId: string): Promise<any> {
    return apiClient.get(`/shopping/payments/order/${orderId}`);
  }

  async getShipmentByOrder(orderId: string): Promise<any> {
    return apiClient.get(`/shopping/shipping/order/${orderId}`);
  }

  async listPayments(): Promise<any[]> {
    return apiClient.get<any[]>("/shopping/payments");
  }

  async listShipments(): Promise<any[]> {
    return apiClient.get<any[]>("/shopping/shipping");
  }

  // ============================================================================
  // CUSTOMER / SHOPPING API
  // ============================================================================

  async getMyCart(): Promise<Cart> {
    return apiClient.get<Cart>("/shopping/cart/my");
  }

  async addToCart(productId: string, quantity: number = 1): Promise<CartItem> {
    return apiClient.post<CartItem>("/shopping/cart/items", { product_id: productId, quantity });
  }

  async getCartTotals(cartId: string): Promise<CartTotals> {
    return apiClient.get<CartTotals>(`/shopping/cart/totals`, { params: { cart_id: cartId } });
  }

  async checkout(data: { cart_id: string; shipping_address: any; notes?: string }): Promise<Order> {
    return apiClient.post<Order>("/shopping/checkout", data);
  }

  async getMyOrders(page: number = 1, pageSize: number = 20): Promise<Order[]> {
    return apiClient.get<Order[]>(`/shopping/orders?page=${page}&page_size=${pageSize}`);
  }

  async getOrderDetails(orderId: string): Promise<Order> {
    return apiClient.get<Order>(`/shopping/orders/${orderId}`);
  }

  // ============================================================================
  // COUPONS
  // ============================================================================

  async applyCoupon(cartId: string, code: string): Promise<any> {
    return apiClient.post(`/shopping/cart/coupon`, null, {
      params: { cart_id: cartId, code }
    });
  }

  async removeCoupon(cartId: string): Promise<any> {
    return apiClient.delete(`/shopping/cart/coupon`, {
      params: { cart_id: cartId }
    });
  }
}

export const shoppingService = new ShoppingService();
