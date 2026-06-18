// Core domain types for MyMedDevices
// Replaces lib/types/woocommerce.ts

export interface Product {
  id: number | string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  featured: boolean;
  status: 'publish' | 'draft' | 'pending' | 'private';
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  stock_quantity: number | null;
  total_sales: number;
  average_rating: string;
  rating_count: number;
  images: ProductImage[];
  categories: CategoryRef[];
  tags: TagRef[];
  attributes: Attribute[];
  related_ids: (number | string)[];
  brands: Brand[];
  weight: string;
  dimensions: Dimensions;
  meta_data: MetaData[];
  date_created: string;
  permalink: string;
  type: string;
  purchasable: boolean;
  catalog_visibility: string;
  cost_price?: string;
  tax_status?: string;
  tax_rate?: number;
  reviews_allowed?: boolean;
  downloadable?: boolean;
}

export interface ProductImage {
  id?: number;
  src: string;
  name?: string;
  alt?: string;
  position?: number;
}

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface TagRef {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
}

export interface Attribute {
  id: number;
  name: string;
  options: string[];
}

export interface Dimensions {
  length: string;
  width: string;
  height: string;
}

export interface MetaData {
  id: number;
  key: string;
  value: unknown;
}

export interface Category {
  id: string | number;
  name: string;
  slug: string;
  parent: number | string;
  description: string;
  display: string;
  image: ProductImage | null;
  count: number;
  subCategories?: Category[];
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface Order {
  id: number;
  number: string;
  status: OrderStatus;
  currency: string;
  date_created: string;
  date_modified: string;
  date_paid?: string | null;
  date_completed?: string | null;
  total: string;
  subtotal: string;
  discount_total: string;
  shipping_total: string;
  total_tax: string;
  customer_id: number;
  customer_note: string;
  billing: Address;
  shipping: Address;
  payment_method: string;
  payment_method_title: string;
  line_items: LineItem[];
  shipping_lines: ShippingLine[];
  fee_lines?: { id: number; name: string; total: string }[];
  meta_data: MetaData[];
  tracking_number?: string;
  estimated_delivery?: string;
}

export interface LineItem {
  id: number | string;
  name: string;
  product_id: number | string;
  variation_id: number | string;
  quantity: number;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  price: number;
  sku: string;
  image?: { id: string; src: string };
}

export interface Address {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export type ShippingAddress = Address;
export type BillingAddress = Address;

export interface ShippingLine {
  id: number;
  method_title: string;
  method_id: string;
  total: string;
  total_tax: string;
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
  billing: Address;
  shipping: Address;
  is_paying_customer: boolean;
  orders_count: number;
  total_spent: string;
  date_created: string;
  role: string;
  meta_data?: MetaData[];
}

export type WooCommerceCustomer = Customer;

export interface Vendor {
  id: number;
  shop_name: string;
  shop_slug: string;
  email: string;
  avatar_url: string;
  banner_url: string;
  rating: string;
  rating_count: number;
  total_sales: number;
  products_count: number;
  orders_count: number;
  revenue: string;
  status: 'approved' | 'pending' | 'rejected';
  date_created: string;
  address: string;
  phone: string;
}

export interface VendorDashboardStats {
  sales: {
    total: number;
    count: number;
    average: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  products: {
    total: number;
    published: number;
    draft: number;
  };
  withdrawals: {
    balance: number;
    pending: number;
  };
  total_revenue?: number;
  total_orders?: number;
  total_products?: number;
  average_rating?: number;
  totalSales?: number;
  orderFulfillmentRate?: number;
  totalOrders?: number;
  pendingOrders?: number;
  processingOrders?: number;
  completedOrders?: number;
}

export interface DokanTopSellingProduct {
  id: number;
  name: string;
  sales: number;
  revenue: string;
  image: string;
  title?: string;
  sold_qty?: string;
}

export type ProductStatus = 'publish' | 'draft' | 'pending' | 'any';

export interface VendorStoreAddress {
  street_1: string;
  street_2: string;
  city: string;
  zip: string;
  country: string;
  state: string;
}

export interface VendorBusinessHours {
  enabled: boolean;
  time: {
    [key: string]: {
      status: 'open' | 'close';
      opening_time: string[];
      closing_time: string[];
    };
  };
  open_notice?: string;
  close_notice?: string;
}

export interface VendorMpesaPayment {
  enabled: boolean;
  phone_number: string;
  business_name: string;
}

export interface VendorBankPayment {
  enabled: boolean;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  branch_name: string;
  branch_code: string;
  routing_number: string;
  iban: string;
  swift_code: string;
  ac_name?: string;
  ac_number?: string;
  bank_addr?: string;
  swift?: string;
}

export interface VendorPaymentSettings {
  mpesa?: VendorMpesaPayment;
  bank?: VendorBankPayment;
}

export interface VendorStoreSettings {
  store_name: string;
  store_slug: string;
  store_email: string;
  phone: string;
  address: VendorStoreAddress;
  social: {
    fb: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  show_email: boolean;
  location: string;
  banner: string;
  gravatar: string;
  shop_description: string;
  gravatar_id?: number;
  store_open_close?: VendorBusinessHours;
  payment?: VendorPaymentSettings;
}

export interface VendorSettingsUpdateRequest extends Partial<VendorStoreSettings> {}

export interface Review {
  id: number | string;
  product_id: number | string;
  rating: number;
  review: string;
  reviewer: string;
  reviewer_email: string;
  reviewer_avatar_url: string;
  verified: boolean;
  is_verified_purchase?: boolean;
  comment?: string;
  date_created: string;
  status: 'approved' | 'pending';
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  on_sale?: boolean;
  featured?: boolean;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder' | 'any';
  min_rating?: number;
  orderby?: 'date' | 'price' | 'rating' | 'popularity' | 'title';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  ids?: (number | string)[];
  vendor_id?: number | string;
  status?: 'publish' | 'draft' | 'pending';
}

// Auth user type (keep compatible with existing useAuthStore)
export interface AuthUser {
  id?: number;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatar_url?: string;
  roles?: string[];
  isVendor?: boolean;
  isVendorVerified?: boolean;
  wooCustomerId?: number;
  billing?: Address;
  shipping?: Address;
}

export type CheckoutStep = 'email' | 'login' | 'otp' | 'profile' | 'complete';

export interface CheckoutAuthState {
  step: CheckoutStep;
}

export const KRA_VAT_RATES = {
  STANDARD: 16,
  ZERO: 0,
} as const;

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
}

export interface StockAnalytics {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  lowStockThreshold: number;
}

export interface ProductsStats {
  totalProducts: number;
  publishedCount: number;
  draftCount: number;
  pendingCount: number;
  lowStockCount: number;
  totalInventoryValue?: number;
  averagePrice?: number;
}

export interface ProductsSummary {
  total: number;
  published: number;
  draft: number;
  pending: number;
}

export interface ProductFormData extends Partial<Omit<Product, 'id' | 'slug' | 'categories' | 'images'>> {
  categories?: { id: number }[];
  images?: ProductImage[];
  cost_price?: string;
  tax_status?: 'taxable' | 'shipping' | 'none';
  tax_rate?: number;
  reviews_allowed?: boolean;
  downloadable?: boolean;
}
