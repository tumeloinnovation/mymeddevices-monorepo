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

export enum BannerPlacement {
  HOMEPAGE_HERO = "homepage_hero",
  HOMEPAGE_SIDEBAR = "homepage_sidebar",
  CATEGORY_PAGE = "category_page",
  PRODUCT_PAGE = "product_page",
  CHECKOUT_PAGE = "checkout_page",
  HEADER_BAR = "header_bar",
  FOOTER = "footer",
}

export enum BannerStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  ACTIVE = "active",
  PAUSED = "paused",
  EXPIRED = "expired",
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  image_alt_text?: string;
  background_color?: string;
  text_color?: string;
  cta_text?: string;
  cta_link?: string;
  button_text?: string;
  target_url?: string;
  text_alignment?: "left" | "center" | "right";
  cta_target: string;
  placement: BannerPlacement;
  priority: number;
  status: BannerStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  target_audience?: string[];
  target_categories?: string[];
  target_products?: string[];
  exclude_products?: string[];
  coupon_id?: string;
  vendor_id?: string;
  is_dismissible: boolean;
  show_close_button: boolean;
  mobile_hidden: boolean;
  desktop_hidden: boolean;
  impressions: number;
  clicks: number;
  dismissals: number;
  click_through_rate: number;
  created_at: string;
  updated_at: string;
}

export interface BannerAnalytics {
  banner_id: string;
  title: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  click_through_rate: number;
  status: BannerStatus;
  scheduled_start?: string;
  scheduled_end?: string;
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

  async adminGetOrderDetails(orderId: string): Promise<any> {
    return apiClient.get<any>(`/admin/shopping/orders/${orderId}`);
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

  async checkout(data: { cart_id: string; shipping_address: any; notes?: string; guest_token?: string }): Promise<Order> {
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

  // ============================================================================
  // BANNERS
  // ============================================================================

  async getBanners(params?: {
    placement?: BannerPlacement;
    status?: BannerStatus;
    page?: number;
    page_size?: number;
  }): Promise<Banner[]> {
    return apiClient.get<Banner[]>("/admin/banners", { params });
  }

  async getBanner(id: string): Promise<Banner> {
    return apiClient.get<Banner>(`/admin/banners/${id}`);
  }

  async createBanner(data: Partial<Banner>): Promise<Banner> {
    return apiClient.post<Banner>("/admin/banners", data);
  }

  async updateBanner(id: string, data: Partial<Banner>): Promise<Banner> {
    return apiClient.patch<Banner>(`/admin/banners/${id}`, data);
  }

  async deleteBanner(id: string): Promise<any> {
    return apiClient.delete(`/admin/banners/${id}`);
  }

  async activateBanner(id: string): Promise<any> {
    return apiClient.post(`/admin/banners/${id}/activate`, {});
  }

  async pauseBanner(id: string): Promise<any> {
    return apiClient.post(`/admin/banners/${id}/pause`, {});
  }

  async getBannerAnalytics(id: string): Promise<BannerAnalytics> {
    return apiClient.get<BannerAnalytics>(`/admin/banners/${id}/analytics`);
  }

  async getAllBannerAnalytics(params?: {
    page?: number;
    page_size?: number;
  }): Promise<BannerAnalytics[]> {
    return apiClient.get<BannerAnalytics[]>("/admin/banners/analytics/all", { params });
  }

  // ============================================================================
  // PUBLIC BANNER API (CUSTOMER FACING)
  // ============================================================================

  async getPublicBanners(params?: {
    placement?: BannerPlacement;
    limit?: number;
  }): Promise<Banner[]> {
    return apiClient.get<Banner[]>("/shopping/banners", { params });
  }

  async recordBannerClick(bannerId: string, sessionId?: string): Promise<any> {
    return apiClient.post("/shopping/banners/click", { banner_id: bannerId, session_id: sessionId });
  }

  async dismissBanner(bannerId: string, sessionId?: string): Promise<any> {
    return apiClient.post("/shopping/banners/dismiss", { banner_id: bannerId, session_id: sessionId });
  }
}

export const shoppingService = new ShoppingService();
