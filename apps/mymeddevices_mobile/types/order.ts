import { Billing, Shipping, MetaData } from "./user";

export interface BackendOrderItem {
  id: string | number;
  order_id?: string;
  product_id: string | number;
  product_variant_id?: string | null;
  product_name?: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: string | number;
    name: string;
    sku?: string | null;
    image_url?: string | null;
    images?: { id?: string | number; url?: string; src?: string; alt_text?: string | null }[];
  };
}

export interface BackendOrder {
  id: string;
  order_number: number | string;
  user_id?: string | number | null;
  guest_token?: string | null;
  status: string;
  total_amount: number;
  shipping_amount?: number;
  tax_amount?: number;
  discount_amount?: number;
  loyalty_discount?: number;
  loyalty_points_redeemed?: number;
  currency?: string;
  payment_method?: string;
  payment_method_title?: string;
  transaction_id?: string;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    payment_method?: string;
    payment_method_title?: string;
    company?: string;
  };
  items?: BackendOrderItem[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
  completed_at?: string | null;
  tracking_number?: string | null;
}

export interface CreateOrderParams {
  customer_id: number | string;
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing?: Partial<Billing>;
  shipping?: Partial<Shipping>;
  line_items: LineItem[];
  shipping_lines?: ShippingLine[];
  note: string;
}

export interface Address {
  street_1: string;
  street_2: string;
  city: string;
  zip: string;
  state: string;
  country: string;
}

export interface Store {
  id: number;
  name: string;
  shop_name: string;
  url: string;
  address: Address;
}

export interface Image {
  id: string;
  src: string;
}

export type { MetaData };

export interface LineItem {
  id: number | string;
  name: string;
  product_id: number | string;
  variation_id?: number;
  quantity: number;
  tax_class?: string;
  subtotal: string;
  subtotal_tax?: string;
  total: string;
  total_tax?: string;
  taxes?: any[];
  meta_data?: MetaData[];
  sku?: string;
  price: number;
  image: Image;
  parent_name?: string | null;
}

export interface ShippingLine {
  id?: number | string;
  method_title: string;
  method_id: string;
  instance_id?: string;
  total: string;
  total_tax?: string;
  taxes?: any[];
  meta_data?: any[];
}

export interface Order {
  id: number | string;
  device_id?: string;
  parent_id?: number;
  status: string;
  currency: string;
  version?: string;
  prices_include_tax?: boolean;
  date_created: string;
  date_modified: string;
  discount_total?: string;
  discount_tax?: string;
  shipping_total?: string;
  shipping_tax?: string;
  cart_tax?: string;
  total: string;
  total_tax?: string;
  customer_id?: number | string;
  order_key?: string;
  billing: Billing;
  shipping: Shipping;
  payment_method: string;
  payment_method_title: string;
  transaction_id?: string;
  customer_ip_address?: string;
  customer_user_agent?: string;
  created_via?: string;
  customer_note?: string;
  date_completed?: string;
  date_paid?: string;
  cart_hash?: string;
  number?: string;
  meta_data?: MetaData[];
  line_items: LineItem[];
  tax_lines?: any[];
  shipping_lines?: ShippingLine[];
  fee_lines?: any[];
  coupon_lines?: any[];
  refunds?: any[];
  payment_url?: string;
  is_editable?: boolean;
  needs_payment?: boolean;
  needs_processing?: boolean;
  date_created_gmt?: string;
  date_modified_gmt?: string;
  date_completed_gmt?: string;
  date_paid_gmt?: string;
  stores?: Store[];
  store?: Store;
  currency_symbol?: string;
}
