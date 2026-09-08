import { api } from "@/services/api.client";
import { OrderQueryParams } from "@/types/api";
import { CreateOrderParams, Order } from "@/types/order";
import { formatMpesaPhoneNumber } from "@/utils/phoneUtils";
import { mapBackendOrder } from "./order.mapper";
import { orderTrackingApi } from "./order.tracking.api";

interface InitiatePaymentParams {
  order: string | number;
  device_id?: string;
  phone?: string;
  amount?: number;
}

export { mapBackendOrder } from "./order.mapper";

export const orderApi = {
  /**
   * Create a new order via FastAPI shopping/checkout
   */
  createOrder: async (params: CreateOrderParams): Promise<Order> => {
    // 1. Get or initialize cart session from backend
    let cartId: string | undefined;
    let cartToken: string | undefined;

    try {
      const cartRes = await api.get<any>("/shopping/cart/my");
      const cartData = cartRes.data?.data || cartRes.data;
      cartId = cartData?.id;
      cartToken = cartData?.cart_token;
    } catch {
      // If /shopping/cart/my fails, will attempt to initialize on add item
    }

    // 2. Clear stale cart items if cart session exists
    if (cartId) {
      try {
        await api.delete("/shopping/cart/clear", {
          params: cartToken ? { cart_token: cartToken } : undefined,
        });
      } catch {
        // ignore clearing errors
      }
    }

    // 3. Add items to cart
    for (const item of params.line_items) {
      const itemRes = await api.post<any>(
        "/shopping/cart/items",
        {
          product_id: item.product_id,
          quantity: item.quantity,
          ...(item.variation_id ? { product_variant_id: item.variation_id } : {}),
        },
        {
          params: cartToken ? { cart_token: cartToken } : undefined,
        }
      );
      const cartData = itemRes.data?.data || itemRes.data;
      if (cartData?.id) {
        cartId = cartData.id;
      }
      if (cartData?.cart_token) {
        cartToken = cartData.cart_token;
      }
    }

    if (!cartId) {
      throw new Error("Failed to initialize cart session for checkout.");
    }

    const payload = {
      cart_id: cartId,
      guest_token: cartToken || undefined,
      shipping_address: {
        full_name:
          `${params.shipping?.first_name || ""} ${params.shipping?.last_name || ""}`.trim() ||
          params.billing?.first_name ||
          "Customer",
        first_name: params.shipping?.first_name || params.billing?.first_name || "",
        last_name: params.shipping?.last_name || params.billing?.last_name || "",
        phone: params.shipping?.phone || params.billing?.phone || "",
        email: params.billing?.email || "",
        street: params.shipping?.address_1 || params.billing?.address_1 || "",
        address_line1: params.shipping?.address_1 || params.billing?.address_1 || "",
        city: params.shipping?.city || params.billing?.city || "Nairobi",
        state: params.shipping?.state || params.billing?.state || "Nairobi County",
        country: params.shipping?.country || params.billing?.country || "KE",
        payment_method: params.payment_method || "mpesa",
        payment_method_title:
          params.payment_method_title ||
          (params.payment_method === "cod" ? "Cash on Delivery" : "M-Pesa Express"),
      },
      notes: params.note || "Created via mobile app",
    };

    const response = await api.post<{ data: any }>("/shopping/checkout", payload);
    const orderData = response.data?.data || response.data;
    return mapBackendOrder(orderData);
  },

  /**
   * Get orders for the authenticated user
   */
  getOrders: async (params?: OrderQueryParams): Promise<Order[]> => {
    const page = params?.page || 1;
    const pageSize = params?.per_page || 20;
    const statusParam = params?.status ? `&status=${encodeURIComponent(params.status)}` : "";
    const response = await api.get<any>(
      `/shopping/orders?page=${page}&page_size=${pageSize}${statusParam}`
    );
    const rawData = response.data?.data || response.data;
    const rawOrders: any[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray(rawData?.orders)
      ? rawData.orders
      : [];
    return rawOrders.map(mapBackendOrder);
  },

  /**
   * Get a single order by ID or order number (supports auth & public/guest lookup)
   */
  getOrder: async (orderId: string | number, guestToken?: string): Promise<Order> => {
    try {
      const response = await api.get<{ data: any }>(`/shopping/orders/${orderId}`, {
        params: guestToken ? { guest_token: guestToken } : undefined,
      });
      const orderData = response.data?.data || response.data;
      return mapBackendOrder(orderData);
    } catch {
      // If 401/403 or not found on protected route, try public order lookup
      const publicResponse = await api.get<{ data: any }>(
        `/shopping/orders/public/${orderId}`,
        {
          params: guestToken ? { guest_token: guestToken } : undefined,
        }
      );
      const publicOrderData = publicResponse.data?.data || publicResponse.data;
      return mapBackendOrder(publicOrderData);
    }
  },

  /**
   * Get orders for guest users (by phone number or order number/UUID)
   */
  getGuestOrders: async (identifier: string, guestToken?: string): Promise<Order[]> => {
    try {
      const cleanIdentifier = identifier.trim();
      const isPhoneNumber =
        /^[0-9+ ]{7,}$/.test(cleanIdentifier) && !/^[0-9]{1,6}$/.test(cleanIdentifier);

      // If it looks like a phone number, query phone lookup endpoint
      if (isPhoneNumber) {
        const response = await api.get<any>(
          `/shopping/orders/public/phone/${encodeURIComponent(cleanIdentifier)}`
        );
        const rawData = response.data?.data || response.data;
        if (Array.isArray(rawData)) {
          return rawData.map(mapBackendOrder);
        }
      }

      // Try regular public order lookup (by order ID or order number)
      const response = await api.get<any>(
        `/shopping/orders/public/${encodeURIComponent(cleanIdentifier)}`,
        {
          params: guestToken ? { guest_token: guestToken } : undefined,
        }
      );
      const rawData = response.data?.data || response.data;
      if (Array.isArray(rawData)) {
        return rawData.map(mapBackendOrder);
      } else if (Array.isArray(rawData?.items)) {
        return rawData.items.map(mapBackendOrder);
      } else if (rawData && typeof rawData === "object" && (rawData.id || rawData.order_number)) {
        return [mapBackendOrder(rawData)];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Cancel an order in pending or processing state
   */
  cancelOrder: async (orderId: string | number, reason?: string): Promise<Order> => {
    const response = await api.post<{ data: any }>(
      `/shopping/orders/${orderId}/cancel`,
      null,
      { params: reason ? { reason } : undefined }
    );
    const orderData = response.data?.data || response.data;
    return mapBackendOrder(orderData);
  },

  /**
   * Get order invoice details / URL
   */
  getOrderInvoice: async (orderId: string | number): Promise<any> => {
    try {
      const response = await api.get(`/shopping/orders/${orderId}/invoice`);
      return response.data?.data || response.data;
    } catch {
      return { invoice_url: `/api/v1/shopping/orders/${orderId}/invoice` };
    }
  },

  /**
   * Get shipment tracking status and courier details
   */
  getOrderTracking: orderTrackingApi.getOrderTracking,

  /**
   * Live GPS delivery tracking for assigned delivery
   */
  getLiveDeliveryTracking: orderTrackingApi.getLiveDeliveryTracking,

  /**
   * Initiate M-Pesa payment for an order
   */
  initiatePayment: async (params: InitiatePaymentParams) => {
    const formattedPhone = formatMpesaPhoneNumber(params.phone || "");

    const payload = {
      order_id: params.order,
      phone_number: formattedPhone,
      amount: params.amount,
    };

    const response = await api.post("/shopping/mpesa/stk-push", payload);
    return response.data;
  },
};
