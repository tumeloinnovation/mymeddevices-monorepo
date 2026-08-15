import { apiClient } from './api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: string;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    sku?: string;
  };
}

export interface Address {
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
}

export interface CheckoutRequest {
  cart_id: string;
  shipping_address: Address | Record<string, any>;
  notes?: string;
  idempotency_key?: string;
  guest_token?: string;
  points_to_redeem?: number;
}

export interface PaymentRequest {
  order_id: string;
  payment_method: 'mpesa' | 'card' | 'bank_transfer';
  payment_data: {
    phone?: string; // For M-Pesa
    card_token?: string; // For card payments
    account_number?: string; // For bank transfer
  };
}

export interface PaymentResponse {
  payment_id: string;
  order_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: string;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  created_at: string;
}

export interface OrderStatus {
  order_id: string;
  status: Order['status'];
  payment_status: PaymentResponse['status'];
  tracking_number?: string;
  estimated_delivery?: string;
}

export interface OrderTracking {
  order_id: string;
  order_number: string;
  status: Order['status'];
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery?: string;
  history: Array<{
    status: Order['status'];
    timestamp: string;
    description?: string;
    location?: string;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Order Service
// ============================================================================

/**
 * Order service for API integration
 *
 * Handles all order-related operations including:
 * - Order creation and checkout
 * - Payment processing
 * - Order tracking and status
 * - Order history
 */
export const orderService = {
  // ============================================================================
  // Order Management
  // ============================================================================

  /**
   * Get customer orders
   */
  async getOrders(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Order>> {
    try {
      const response = await apiClient.get<any>('/shopping/orders', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          sort: params.sort,
        },
      });

      if (response && response.data) {
        const data = response.data;
        const rawOrders: any[] = data.orders || data.items || [];
        return {
          items: rawOrders.map(mapOrder),
          total: data.total || 0,
          page: params.page || 1,
          limit: params.limit || 20,
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  },

  /**
   * Get single order by ID (with optional guest token)
   */
  async getOrder(id: string, guestToken?: string): Promise<Order> {
    try {
      const params = guestToken ? { guest_token: guestToken } : {};
      const endpoint = guestToken ? `/shopping/orders/public/${id}` : `/shopping/orders/${id}`;
      const response = await apiClient.get<any>(endpoint, { params });

      if (response && response.data) {
        return mapOrder(response.data);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      const response = await apiClient.get<any>('/shopping/orders', {
        params: { order_number: orderNumber, limit: 1 },
      });

      if (response && response.data) {
        const rawOrders: any[] = response.data.orders || response.data.items || [];
        if (rawOrders.length > 0) {
          return mapOrder(rawOrders[0]);
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch order ${orderNumber}:`, error);
      return null;
    }
  },

  // ============================================================================
  // Checkout & Order Creation
  // ============================================================================

  /**
   * Create order from cart (checkout)
   */
  async createOrder(request: CheckoutRequest): Promise<Order> {
    try {
      const response = await apiClient.post<any>('/shopping/checkout', request);

      if (response && response.data) {
        toast.success('Order created successfully');
        return mapOrder(response.data);
      }

      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Failed to create order:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to create order';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  /**
   * Create order from cart (convenience method)
   */
  async createOrderFromCart(
    cart: any,
    shippingAddress: Address | Record<string, any>,
    billingAddress?: Address | Record<string, any>,
    notes?: string,
    guestToken?: string,
    pointsToRedeem?: number
  ): Promise<Order> {
    try {
      if (!cart || !cart.id) {
        throw new Error('Valid cart is required for checkout');
      }

      // Generate idempotency key for this order
      const idempotencyKey = `order-${cart.id}-${Date.now()}`;

      return await this.createOrder({
        cart_id: cart.id,
        shipping_address: shippingAddress,
        notes,
        idempotency_key: idempotencyKey,
        guest_token: guestToken,
        points_to_redeem: pointsToRedeem,
      });
    } catch (error) {
      console.error('Failed to create order from cart:', error);
      throw error;
    }
  },

  // ============================================================================
  // Payment Processing
  // ============================================================================

  /**
   * Process payment for an order
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<any>(`/shopping/orders/${request.order_id}/pay`, {
        payment_method: request.payment_method,
        payment_data: request.payment_data,
      });

      if (response && response.data) {
        toast.success('Payment processed successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error('Payment failed');
      throw error;
    }
  },

  /**
   * Initialize M-Pesa payment
   */
  async initializeMpesaPayment(
    orderId: string,
    phone: string
  ): Promise<PaymentResponse> {
    return await this.processPayment({
      order_id: orderId,
      payment_method: 'mpesa',
      payment_data: { phone },
    });
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.get<any>(`/payments/${paymentId}`);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch payment status for ${paymentId}:`, error);
      throw error;
    }
  },

  // ============================================================================
  // Order Status & Tracking
  // ============================================================================

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    try {
      const response = await apiClient.get<any>(`/shopping/orders/${orderId}/status`);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch order status for ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Track order
   */
  async trackOrder(orderId: string): Promise<OrderTracking> {
    try {
      const response = await apiClient.get<any>(`/shopping/orders/${orderId}/tracking`);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to track order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Track order by order number
   */
  async trackOrderByNumber(orderNumber: string): Promise<OrderTracking | null> {
    try {
      // First get the order
      const order = await this.getOrderByNumber(orderNumber);
      if (!order) {
        return null;
      }

      // Then track it
      return await this.trackOrder(order.id);
    } catch (error) {
      console.error(`Failed to track order ${orderNumber}:`, error);
      return null;
    }
  },

  // ============================================================================
  // Order Actions
  // ============================================================================

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      const response = await apiClient.post<any>(`/shopping/orders/${orderId}/cancel`, {
        reason,
      });

      if (response && response.data) {
        toast.success('Order cancelled successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      toast.error('Failed to cancel order');
      throw error;
    }
  },

  /**
   * Request refund
   */
  async requestRefund(orderId: string, reason?: string): Promise<{
    refund_id: string;
    order_id: string;
    status: string;
    amount: string;
  }> {
    try {
      const response = await apiClient.post<any>(`/shopping/orders/${orderId}/refund`, {
        reason,
      });

      if (response && response.data) {
        toast.success('Refund requested successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to request refund for order ${orderId}:`, error);
      toast.error('Failed to request refund');
      throw error;
    }
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format order status for display
 */
export function formatOrderStatus(status: Order['status']): string {
  const statusMap: Record<Order['status'], string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  return statusMap[status] || status;
}

/**
 * Get order status color class
 */
export function getOrderStatusColor(status: Order['status']): string {
  const colorMap: Record<Order['status'], string> = {
    pending: 'yellow',
    processing: 'blue',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
    refunded: 'gray',
  };

  return colorMap[status] || 'gray';
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status: Order['status']): boolean {
  return ['pending', 'processing'].includes(status);
}

/**
 * Check if order can be refunded
 */
export function canRefundOrder(status: Order['status']): boolean {
  return ['delivered', 'shipped'].includes(status);
}

// ============================================================================
// Response Mapping
// ============================================================================

function mapOrder(raw: any): Order {
  return {
    id: raw.id || raw._id,
    customer_id: raw.customer_id || raw.user_id,
    order_number: String(raw.order_number ?? raw.id?.slice(0, 8) ?? ''),
    status: raw.status || 'pending',
    total_amount: String(raw.total_amount ?? raw.total ?? 0),
    currency: raw.currency || 'KES',
    shipping_address: raw.shipping_address || raw.shipping || {},
    billing_address: raw.billing_address || raw.billing || {},
    items: (raw.items || []).map(mapOrderItem),
    notes: raw.notes,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function mapOrderItem(raw: any): OrderItem {
  return {
    id: raw.id,
    order_id: raw.order_id || raw.orderId,
    product_id: raw.product_id,
    product_name: raw.product_name || raw.name || raw.product?.name || '',
    quantity: raw.quantity || 1,
    unit_price: String(raw.unit_price ?? raw.price ?? 0),
    total_price: String(raw.total_price ?? raw.subtotal ?? 0),
    product: raw.product,
  };
}

// ============================================================================
// Export
// ============================================================================
