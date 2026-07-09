import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface Order {
  id: string;
  order_number?: number;
  user_id?: string;
  guest_token?: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  currency: string;
  shipping_address?: Address | Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
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
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  },

  /**
   * Get single order by ID
   */
  async getOrder(id: string): Promise<Order> {
    try {
      const response = await apiClient.get<any>(`/shopping/orders/${id}`);

      if (response && response.data) {
        return response.data;
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

      if (response && response.data && response.data.items && response.data.items.length > 0) {
        return response.data.items[0];
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
        return response.data;
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
   * Create order from cart ID (convenience method)
   */
  async createOrderFromCart(
    cartId: string,
    shippingAddress: Address | Record<string, any>,
    billingAddress?: Address | Record<string, any>,
    notes?: string,
    guestToken?: string
  ): Promise<Order> {
    try {
      // Validate cart has items first
      const { cartService } = await import('../services/cart-service');
      const cart = await cartService.getCart();

      if (!cart || cart.items.length === 0) {
        throw new Error('Your cart is empty. Please add items before checkout.');
      }

      // Generate idempotency key for this order
      const idempotencyKey = `order-${cartId}-${Date.now()}`;

      return await this.createOrder({
        cart_id: cartId,
        shipping_address: shippingAddress,
        notes,
        idempotency_key: idempotencyKey,
        guest_token: guestToken,
      });
    } catch (error: any) {
      if (error.message !== 'Your cart is empty. Please add items before checkout.') {
        console.error('Failed to create order from cart:', error);
      }
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
      // For M-Pesa, use the STK push endpoint
      if (request.payment_method === 'mpesa') {
        const response = await apiClient.post<any>('/api/payments/stkpush/initiate', {
          order_id: request.order_id,
          phone_number: request.payment_data?.phone,
        });

        if (response && response.data) {
          toast.success('Payment initiated successfully');
          return {
            payment_id: response.data.payment_id || response.data.merchant_request_id,
            order_id: request.order_id,
            status: 'pending',
            amount: '0',
            currency: 'KES',
            payment_method: 'mpesa',
            created_at: new Date().toISOString(),
          };
        }

        throw new Error('Invalid response format');
      }

      // For other payment methods (not implemented yet)
      throw new Error('Payment method not supported yet');
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
    try {
      const response = await apiClient.post<any>('/api/payments/stkpush/initiate', {
        order_id: orderId,
        phone_number: phone,
      });

      if (response && response.data) {
        toast.success('M-Pesa payment initiated');
        return {
          payment_id: response.data.payment_id || response.data.merchant_request_id,
          order_id: orderId,
          status: 'pending',
          amount: '0',
          currency: 'KES',
          payment_method: 'mpesa',
          transaction_id: response.data.checkout_request_id,
          created_at: new Date().toISOString(),
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to initiate M-Pesa payment:', error);
      toast.error('Failed to initiate payment');
      throw error;
    }
  },

  /**
   * Get payment status (M-Pesa STK push status)
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<any>('/api/payments/stkpush/status', {
        merchant_request_id: paymentId,
      });

      if (response && response.data) {
        return {
          payment_id: paymentId,
          order_id: response.data.order_id || '',
          status: response.data.result_code === '0' ? 'completed' : 'failed',
          amount: response.data.amount || '0',
          currency: 'KES',
          payment_method: 'mpesa',
          transaction_id: response.data.merchant_request_id,
          created_at: new Date().toISOString(),
        };
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
    paid: 'Paid',
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
    paid: 'blue',
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
// Export
// ============================================================================
