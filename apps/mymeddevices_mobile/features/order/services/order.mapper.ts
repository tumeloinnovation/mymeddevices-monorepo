import { BackendOrder, Order } from "@/types/order";

export function mapOrderAddress(shippingAddr: any, isBilling: boolean) {
  const names = (shippingAddr.full_name || "").split(" ");
  const base = {
    first_name: shippingAddr.first_name || names[0] || "",
    last_name: shippingAddr.last_name || names.slice(1).join(" ") || "",
    company: shippingAddr.company || "",
    address_1: shippingAddr.address || "",
    address_2: "",
    city: shippingAddr.city || "Nairobi",
    state: shippingAddr.state || "Nairobi",
    postcode: "00100",
    country: "KE",
    phone: shippingAddr.phone || "",
  };

  return isBilling
    ? { ...base, email: shippingAddr.email || "info@mymeddevices.com" }
    : base;
}

/**
 * Maps FastAPI BackendOrder schema into the frontend Order model.
 */
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
    id: o.order_number || o.id || 1,
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
    billing: mapOrderAddress(shippingAddr, true),
    shipping: mapOrderAddress(shippingAddr, false),
    payment_method: o.payment_method || "mpesa",
    payment_method_title:
      o.payment_method_title ||
      (o.payment_method === "cod" ? "Cash on Delivery" : "M-Pesa"),
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
