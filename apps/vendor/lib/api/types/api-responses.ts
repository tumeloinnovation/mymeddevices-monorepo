/**
 * API Response Type Definitions for Vendor Portal
 */

// Common
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Dashboard & Analytics
export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_products: number;
  low_stock_count: number;
  pending_fulfillments: number;
  current_balance: number;
  pending_payouts: number;
  sales_trend: SalesTrendPoint[];
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  id?: string;
  name?: string;
  product_id?: string;
  product_name?: string;
  sku: string;
  image_url?: string;
  total_sold: number;
  revenue: number;
}

// Products
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  base_price?: number;
  markup_price?: number;
  compare_at_price?: number;
  cost_price?: number;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  rejection_reason?: string;
  category_id: string;
  category_name: string;
  images: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  base_price?: number;
  price?: number;
  compare_at_price?: number;
  cost_price?: number;
  category_id: string;
  track_inventory: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: 'draft' | 'pending_review' | 'published' | 'archived';
}

// Orders
export interface VendorOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total_amount: number;
  vendor_amount: number;
  item_count: number;
  created_at: string;
  customer_notes?: string;
  due_date?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface VendorOrderDetail extends VendorOrder {
  shipping_address: Address;
  billing_address: Address;
  items: VendorOrderItem[];
  payment_method: string;
  payment_status: string;
  timeline: OrderTimelineEvent[];
}

export interface VendorOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  status: OrderStatus;
  tracking_number?: string;
  tracking_url?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  message: string;
  created_at: string;
  created_by?: string;
}

export interface TrackingInfo {
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
}

// Inventory
export interface InventoryItem {
  product_id: string;
  product_name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  quantity_change: number;
  previous_level: number;
  new_level: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface StockAdjustment {
  quantity: number;
  reason: string;
  reference_id?: string;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  current_level: number;
  threshold: number;
  status: 'warning' | 'critical';
}

// Earnings
export interface EarningsSummary {
  total_balance: number;
  available_for_payout: number;
  pending_payouts: number;
  total_earnings: number;
  current_month_earnings: number;
  last_payout_date?: string;
  next_payout_date?: string;
}

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  method: string;
  method_details: Record<string, string>;
  requested_at: string;
  processed_at?: string;
  paid_at?: string;
  failure_reason?: string;
  reference?: string;
}

export interface CommissionBreakdown {
  order_id: string;
  order_number: string;
  total_amount: number;
  platform_fee: number;
  commission_rate: number;
  commission_amount: number;
  vendor_amount: number;
}

export interface PayoutMethod {
  type: 'mpesa' | 'bank';
  details: {
    phone?: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    branch?: string;
  };
}

// Profile
export interface StoreProfile {
  id: string;
  vendor_id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  business_email: string;
  business_phone?: string;
  mpesa_phone?: string;
  mpesa_till_number?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_account_name?: string;
  policies: StorePolicies;
  social_links?: SocialLinks;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StorePolicies {
  return_policy?: string;
  shipping_policy?: string;
  refund_policy?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface UpdateStoreProfileDto {
  store_info?: {
    store_name?: string;
    store_description?: string;
    business_email?: string;
    business_phone?: string;
  };
  payment_details?: {
    mpesa_phone?: string;
    mpesa_till_number?: string;
    bank_account_number?: string;
    bank_name?: string;
    bank_account_name?: string;
  };
  policies?: StorePolicies;
  social_links?: SocialLinks;
}

// Support
export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  message: string;
  sender: 'vendor' | 'support';
  created_at: string;
  attachments?: string[];
}

export interface NotificationSettings {
  email_notifications: {
    new_orders: boolean;
    low_stock: boolean;
    payout_received: boolean;
    ticket_updates: boolean;
  };
  push_notifications: {
    new_orders: boolean;
    low_stock: boolean;
    payout_received: boolean;
    ticket_updates: boolean;
  };
  sms_notifications: {
    new_orders: boolean;
    payout_received: boolean;
  };
}

// Query Params
export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category_id?: string;
  sort?: 'name' | 'created' | 'price' | 'stock';
  order?: 'asc' | 'desc';
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: 'created' | 'total';
  order?: 'asc' | 'desc';
}

export interface InventoryParams {
  page?: number;
  limit?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  search?: string;
  category_id?: string;
}

export interface PayoutListParams {
  page?: number;
  limit?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
}

// Vendor Analytics
export interface VendorAnalyticsData {
  vendor_id: string;
  vendor_name: string;
  period: {
    start: string;
    end: string;
  };
  sales: VendorSalesAnalytics;
  earnings: VendorEarningsAnalytics;
  performance: VendorPerformanceAnalytics;
}

export interface VendorSalesAnalytics {
  gross_sales: ComparisonMetric;
  net_sales: ComparisonMetric;
  total_orders: ComparisonMetric;
  average_order_value: ComparisonMetric;
  sales_trend: SalesTrendPoint[];
  top_products: TopProduct[];
  sales_by_category: CategorySales[];
}

export interface VendorEarningsAnalytics {
  total_revenue: number;
  vendor_earnings: number;
  platform_commission: number;
  pending_payouts: number;
  completed_payouts: number;
  available_balance: number;
  payout_history: Payout[];
}

export interface VendorPerformanceAnalytics {
  fulfillment_rate: number;
  on_time_delivery_rate: number;
  average_fulfillment_time_hours: number;
  total_products: number;
  low_stock_products: number;
  vendor_rating: number;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  change_percent: number;
}

export interface CategorySales {
  category: string;
  total_sales: number;
  order_count: number;
}
