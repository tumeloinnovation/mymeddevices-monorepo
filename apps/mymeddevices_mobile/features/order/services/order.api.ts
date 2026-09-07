import { api } from "@/services/api.client";
import { OrderQueryParams } from "@/types/api";
import { BackendOrder, CreateOrderParams, Order } from "@/types/order";

export interface InitiatePaymentParams {
  order: string | number;
  device_id?: string;
  phone?: string;
  amount?: number;
}

export function mapBackendOrder(o: BackendOrder | any): Order {
  const line_items = (o.items || []).map((it: any, idx: number) => ({
    id: it.id || idx + 1,
    name: it.product_name || (it.product ? it.product.name : "Medical Device"),
    product_id: it.product_id || 1,
    variation_id: 0,
    quantity: it.quantity || 1,
    tax_class: "",
    subtotal: String(it.subtotal || (it.unit_price || 0) * (it.quantity || 1)),
    subtotal_tax: "0",
    total: String(it.subtotal || (it.unit_price || 0) * (it.quantity || 1)),
    total_tax: "0",
    taxes: [],
    meta_data: [],
    sku: it.product ? it.product.sku : "",
    price: it.unit_price || 0,
    image: {
      id: "1",
      src: it.product?.image_url || it.product?.images?.[0]?.url || "",
    },
    parent_name: null,
  }));

  const shippingAddr = o.shipping_address || {};

  return {
    id: o.order_number || o.id,
    device_id: "mobile-device",
    parent_id: 0,
    status: o.status || "pending",
    currency: o.currency || "KES",
    version: "1.0",
    prices_include_tax: true,
    date_created: o.created_at || new Date().toISOString(),
    date_modified: o.updated_at || new Date().toISOString(),
    discount_total: String(o.discount_amount || "0"),
    discount_tax: "0",
    shipping_total: String(o.shipping_amount || "0"),
    shipping_tax: "0",
    cart_tax: "0",
    total: String(o.total_amount || "0"),
    total_tax: "0",
    customer_id: o.user_id || 1,
    order_key: String(o.order_number || o.id),
    billing: {
      first_name: shippingAddr.first_name || shippingAddr.full_name?.split(" ")[0] || "",
      last_name: shippingAddr.last_name || shippingAddr.full_name?.split(" ").slice(1).join(" ") || "",
      company: shippingAddr.company || "",
      address_1: shippingAddr.address || "",
      address_2: "",
      city: shippingAddr.city || "Nairobi",
      state: shippingAddr.state || "Nairobi",
      postcode: "00100",
      country: "KE",
      email: shippingAddr.email || "info@mymeddevices.com",
      phone: shippingAddr.phone || "",
    },
    shipping: {
      first_name: shippingAddr.first_name || shippingAddr.full_name?.split(" ")[0] || "",
      last_name: shippingAddr.last_name || shippingAddr.full_name?.split(" ").slice(1).join(" ") || "",
      company: shippingAddr.company || "",
      address_1: shippingAddr.address || "",
      address_2: "",
      city: shippingAddr.city || "Nairobi",
      state: shippingAddr.state || "Nairobi",
      postcode: "00100",
      country: "KE",
      phone: shippingAddr.phone || "",
    },
    payment_method: o.payment_method || "mpesa",
    payment_method_title: o.payment_method_title || (o.payment_method === "cod" ? "Cash on Delivery" : "M-Pesa"),
    transaction_id: o.transaction_id || "",
    customer_ip_address: "",
    customer_user_agent: "",
    created_via: "mobile",
    customer_note: o.notes || "",
    date_completed: o.completed_at || "",
    date_paid: o.paid_at || "",
    cart_hash: "",
    number: String(o.order_number || o.id),
    meta_data: [],
    line_items,
    tax_lines: [],
    shipping_lines: [
      {
        id: 1,
        method_title: "Standard Shipping",
        method_id: "standard",
        instance_id: "1",
        total: String(o.shipping_amount || "0"),
        total_tax: "0",
        taxes: [],
        meta_data: [],
      },
    ],
    fee_lines: [],
    coupon_lines: [],
    refunds: [],
    payment_url: "",
    is_editable: false,
    needs_payment: o.status === "pending",
    needs_processing: o.status === "processing",
    date_created_gmt: o.created_at || new Date().toISOString(),
    date_modified_gmt: o.updated_at || new Date().toISOString(),
    date_completed_gmt: o.completed_at || "",
    date_paid_gmt: o.paid_at || "",
    stores: [],
    store: o.store || undefined,
    currency_symbol: "KES",
  };
}

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
        full_name: `${params.shipping?.first_name || ""} ${params.shipping?.last_name || ""}`.trim() || params.billing?.first_name || "Customer",
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
        payment_method_title: params.payment_method_title || (params.payment_method === "cod" ? "Cash on Delivery" : "M-Pesa Express"),
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
    const response = await api.get<any>(`/shopping/orders?page=${page}&page_size=${pageSize}${statusParam}`);
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
    } catch (err: any) {
      // If 401/403 or not found on protected route, try public order lookup
      const publicResponse = await api.get<{ data: any }>(`/shopping/orders/public/${orderId}`, {
        params: guestToken ? { guest_token: guestToken } : undefined,
      });
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
      const isPhoneNumber = /^[0-9+ ]{7,}$/.test(cleanIdentifier) && !/^[0-9]{1,6}$/.test(cleanIdentifier);

      // If it looks like a phone number (e.g. 0712345678, +254712345678), query phone lookup endpoint
      if (isPhoneNumber) {
        const response = await api.get<any>(`/shopping/orders/public/phone/${encodeURIComponent(cleanIdentifier)}`);
        const rawData = response.data?.data || response.data;
        if (Array.isArray(rawData)) {
          return rawData.map(mapBackendOrder);
        }
      }

      // Try regular public order lookup (by order ID or order number)
      const response = await api.get<any>(`/shopping/orders/public/${encodeURIComponent(cleanIdentifier)}`, {
        params: guestToken ? { guest_token: guestToken } : undefined,
      });
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
  getOrderTracking: async (orderId: string | number): Promise<any> => {
    try {
      const response = await api.get<{ data: any }>(`/shopping/orders/${orderId}/tracking`);
      return response.data?.data || response.data;
    } catch {
      try {
        const fallback = await api.get<{ data: any }>(`/logistics/tracking/${orderId}`);
        return fallback.data?.data || fallback.data;
      } catch {
        return null;
      }
    }
  },

  /**
   * Live GPS delivery tracking for assigned delivery
   */
  getLiveDeliveryTracking: async (deliveryId: string): Promise<any> => {
    try {
      const response = await api.get(`/logistics/tracking/delivery/${deliveryId}`);
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },

  /**
   * Initiate M-Pesa payment for an order
   */
  initiatePayment: async (params: InitiatePaymentParams) => {
    let formattedPhone = params.phone || "";
    formattedPhone = formattedPhone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
      formattedPhone = `254${formattedPhone}`;
    }

    const payload = {
      order_id: params.order,
      phone_number: formattedPhone,
      amount: params.amount,
    };

    const response = await api.post("/shopping/mpesa/stk-push", payload);
    return response.data;
  },
};

