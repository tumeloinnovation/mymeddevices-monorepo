// Auto-generated from Pydantic models. DO NOT EDIT DIRECTLY.
// Run: pnpm gen:types

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface AdminCustomerListItem {
  id: string;
  user_id: string;
  customer_code: string;
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_locked: boolean;
  loyalty_tier: "bronze" | "silver" | "gold" | "platinum";
  loyalty_points: number;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at: string;
}

export interface AdminCustomerDetail {
  id: string;
  user_id: string;
  customer_code: string;
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_locked: boolean;
  loyalty_tier: "bronze" | "silver" | "gold" | "platinum";
  loyalty_points: number;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  profile_image?: string;
  phone_verified?: boolean;
  marketing_opt_in?: boolean;
  sms_opt_in?: boolean;
  referral_code?: string;
  referred_by?: string;
  lock_reason?: string;
  notes?: string;
  updated_at: string;
}

export interface AdminCustomerCreate {
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  is_active?: boolean;
  loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
  loyalty_points?: number;
  marketing_opt_in?: boolean;
  sms_opt_in?: boolean;
  notes?: string;
}

export interface AdminCustomerUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  is_active?: boolean;
  is_locked?: boolean;
  lock_reason?: string;
  loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
  loyalty_points?: number;
  marketing_opt_in?: boolean;
  sms_opt_in?: boolean;
  notes?: string;
}

export interface AdminCustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  is_locked?: boolean;
  loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface AdminCustomerListResponse {
  customers: AdminCustomerListItem[];
  meta: Record<string, unknown>;
}

export interface AdminCustomerDeactivate {
  reason?: string;
}

export interface AdminCustomerAddress {
  id: string;
  customer_id: string;
  address_type: "shipping" | "billing" | "both";
  is_primary: boolean;
  is_default_billing: boolean;
  is_default_shipping: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country_code: string;
  delivery_instructions?: string;
  latitude?: string;
  longitude?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminCustomerAddressCreate {
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country_code: string;
  address_type?: "shipping" | "billing" | "both";
  is_primary?: boolean;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
  delivery_instructions?: string;
  latitude?: string;
  longitude?: string;
}

export interface AdminCustomerAddressUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  address_type?: "shipping" | "billing" | "both";
  is_primary?: boolean;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
  delivery_instructions?: string;
  latitude?: string;
  longitude?: string;
}

export interface AdminLoyaltyPointsAdjust {
  points: number;
  reason?: string;
}

export interface AdminLoyaltyTierUpdate {
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface AdminUserListItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  last_active?: string;
  created_at: string;
}

export interface AdminUserInvite {
  email: string;
  first_name: string;
  last_name?: string;
  role?: "admin" | "worker";
}

export interface AdminUserUpdate {
  first_name?: string;
  last_name?: string;
  role?: "admin" | "worker";
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  meta: Record<string, unknown>;
}

export interface AdminVendorListItem {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  business_name: string;
  business_type?: string;
  description?: string;
  logo?: string;
  banner_image?: string;
  status: string;
  commission_rate?: number;
  tier?: string;
  total_sales?: number;
  total_products?: number;
  total_orders?: number;
  rating?: number;
  is_featured?: boolean;
  contact_info?: Record<string, unknown>;
  vat_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminVendorDetail {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  business_name: string;
  business_type?: string;
  description?: string;
  logo?: string;
  banner_image?: string;
  status: string;
  commission_rate?: number;
  tier?: string;
  total_sales?: number;
  total_products?: number;
  total_orders?: number;
  rating?: number;
  is_featured?: boolean;
  contact_info?: Record<string, unknown>;
  vat_number?: string;
  created_at?: string;
  updated_at?: string;
  business_details?: Record<string, unknown>;
  banking_details?: Record<string, unknown>;
  documents?: unknown[];
  rejection_reason?: string;
  approved_at?: string;
}

export interface AdminVendorUpdate {
  company_name?: string;
  vat_number?: string;
  business_type?: string;
  description?: string;
  commission_rate?: number;
  status?: string;
}

export interface AdminVendorCreatePayload {
  email: string;
  phone: string;
  password: string;
  business_name: string;
  vat_number?: string;
  commission_rate?: number;
  tier?: string;
}

export interface AdminVendorActionResponse {
  message: string;
}

export interface AdminVendorListResponse {
  vendors: AdminVendorListItem[];
  meta: Record<string, unknown>;
}

export interface AdminVendorDocument {
  id: string;
  vendor_id: string;
  document_type?: string;
  document_url: string;
  status?: string;
  rejection_reason?: string;
  uploaded_at: string;
  reviewed_at?: string;
}

export interface AdminVendorStats {
  total_products?: number;
  total_orders?: number;
  total_sales?: number;
  total_revenue?: number;
  pending_orders?: number;
  active_products?: number;
  average_rating?: number;
  monthly_sales?: unknown[];
}

export interface AdminVendorPerformance {
  period?: string;
  sales_growth?: number;
  order_count?: number;
  revenue?: number;
  average_order_value?: number;
  top_products?: unknown[];
  sales_trend?: unknown[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  phone: string;
  otp_verified: boolean;
  is_active: boolean;
  is_guest: boolean;
  timezone?: string;
  locale?: string;
  invite_token?: string;
  referral_code?: string;
}

export interface UserLogin {
  email: string;
  password: string;
  device?: DeviceInfo;
  context?: RequestContext;
}

export interface UserRegister {
  email: string;
  password: string;
  phone: string;
  company_name?: string;
  vat_number?: string;
  device?: DeviceInfo;
  context?: RequestContext;
  meta?: OnboardingMeta;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
}

export interface LogoutRequest {
  refresh_token?: string;
}

export interface DeviceInfo {
  device_id: string;
  device_name?: string;
  push_token?: string;
  os_version?: string;
  app_version?: string;
}

export interface RequestContext {
  timezone?: string;
  locale?: string;
  remember_me?: boolean;
}

export interface OnboardingMeta {
  invite_token?: string;
  referral_code?: string;
}

export interface CommissionLedgerResponse {
  id: string;
  vendor_id: string;
  order_id: string;
  amount: number | string;
  description: string;
  created_at?: string;
}

export interface PayoutResponse {
  id: string;
  vendor_id: string;
  amount: number | string;
  status: string;
  created_at?: string;
  notes?: string;
  transaction_reference?: string;
  processed_at?: string;
}

export interface CommissionSettingsResponse {
  default_rate: number;
  tier_rates: Record<string, unknown>;
  product_category_rates: Record<string, unknown>;
  payout_threshold: number;
  payout_frequency: string;
}

export interface CommissionRateResponse {
  vendor_id: string;
  commission_rate: number;
}

export interface PaymentResponse {
  id: string;
  order_id: string;
  customer_id: string;
  payment_method_id?: string;
  gateway_id: string;
  status: string;
  amount: number | string;
  currency: string;
  transaction_fee: number | string;
  net_amount: number | string;
  provider_payment_id?: string;
  provider_transaction_id?: string;
  provider_checkout_request_id?: string;
  description?: string;
  expires_at?: string;
  completed_at?: string;
  failed_at?: string;
  failed_reason?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentDetailResponse {
  id: string;
  order_id: string;
  customer_id: string;
  payment_method_id?: string;
  gateway_id: string;
  status: string;
  amount: number | string;
  currency: string;
  transaction_fee: number | string;
  net_amount: number | string;
  provider_payment_id?: string;
  provider_transaction_id?: string;
  provider_checkout_request_id?: string;
  description?: string;
  expires_at?: string;
  completed_at?: string;
  failed_at?: string;
  failed_reason?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  payment_method?: SavedPaymentMethodResponse;
  gateway?: PaymentGatewayResponse;
  transactions?: PaymentTransactionResponse[];
  refunds?: PaymentRefundResponse[];
}

export interface PaymentTransactionResponse {
  id: string;
  payment_id: string;
  gateway_id: string;
  transaction_type: string;
  provider_transaction_id?: string;
  amount: number | string;
  currency: string;
  status: string;
  status_code?: string;
  status_message?: string;
  processing_time_ms?: number;
  is_retried: boolean;
  created_at: string;
}

export interface PaymentRefundResponse {
  id: string;
  payment_id: string;
  refund_request_id?: string;
  amount: number | string;
  currency: string;
  status: string;
  refund_method: string;
  provider_refund_id?: string;
  reason?: string;
  admin_notes?: string;
  initiated_by?: string;
  initiated_at: string;
  processed_at?: string;
  failed_at?: string;
  failed_reason?: string;
  created_at: string;
}

export interface PaymentGatewayResponse {
  id: string;
  name: string;
  display_name: string;
  gateway_type: string;
  status: string;
  environment: string;
  supports_currencies: string[];
  min_amount: number | string;
  max_amount: number | string;
  transaction_fee_percentage: number | string;
  transaction_fee_flat: number | string;
  refund_supported: boolean;
  partial_refund_supported: boolean;
  webhook_url?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AvailablePaymentMethod {
  method_type: PaymentMethodType;
  display_name: string;
  gateway_name: string;
  gateway_id: string;
  min_amount: number | string;
  max_amount: number | string;
  transaction_fee_percentage: number | string;
  transaction_fee_flat: number | string;
  is_available: boolean;
  icon_url?: string;
  description?: string;
}

export interface PaymentReconciliationItem {
  payment_id: string;
  order_id: string;
  customer_id: string;
  amount: number | string;
  currency: string;
  status: string;
  gateway: string;
  provider_transaction_id?: string;
  created_at: string;
  completed_at?: string;
  discrepancy?: string;
}

export interface PaymentReconciliationResponse {
  start_date: string;
  end_date: string;
  total_payments: number;
  reconciled: number;
  unreconciled: number;
  total_amount: number | string;
  reconciled_amount: number | string;
  unreconciled_amount: number | string;
  items: PaymentReconciliationItem[];
}

export interface PaymentSettlementItem {
  gateway_name: string;
  gateway_id: string;
  period_start: string;
  period_end: string;
  transaction_count: number;
  gross_amount: number | string;
  fees: number | string;
  net_amount: number | string;
  settlement_date?: string;
  settlement_reference?: string;
}

export interface PaymentSettlementsResponse {
  settlements: PaymentSettlementItem[];
}

export interface PaymentStatsResponse {
  total_payments: number;
  completed_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_amount: number | string;
  completed_amount: number | string;
  failed_amount: number | string;
  pending_amount: number | string;
  success_rate: number;
  average_amount: number | string;
  by_method: Record<string, number>;
  by_gateway: Record<string, number | string>;
}

export interface SavedPaymentMethodResponse {
  id: string;
  customer_id: string;
  gateway_id: string;
  method_type: string;
  display_name: string;
  provider_method_id?: string;
  metadata: Record<string, unknown>;
  is_default: boolean;
  is_verified: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethodType = "mpesa" | "card" | "cash_on_delivery" | "bank_transfer" | "mobile_money";

export interface CouponResponse {
  id: string;
  code: string;
  description?: string;
  coupon_type: string;
  discount_value: number | string;
  discount_scope: string;
  vendor_id?: string;
  is_active: boolean;
  is_stackable: boolean;
  valid_from: string;
  valid_until?: string;
  distribution_type: string;
  created_by_id?: string;
  restrictions?: CouponRestrictionResponse;
  categories?: string[];
  products?: string[];
}

export interface CouponUsageResponse {
  id: string;
  coupon_id: string;
  customer_id: string;
  order_id: string;
  vendor_id?: string;
  discount_amount: number | string;
  used_at: string;
  is_refunded: boolean;
  refunded_at?: string;
}

export interface CouponStatsResponse {
  total_coupons: number;
  active_coupons: number;
  total_usages: number;
  total_discount_given: number | string;
  total_revenue_impact: number | string;
}

export interface CouponReportResponse {
  start_date: string;
  end_date: string;
  performance: CouponPerformanceItem[];
}

export interface CouponRestrictionResponse {
  id: string;
  coupon_id: string;
  min_order_value?: number | string;
  max_discount_amount?: number | string;
  new_customers_only: boolean;
  first_purchase_only: boolean;
  one_time_per_customer: boolean;
  global_usage_limit?: number;
  vendor_only: boolean;
  exclude_sale_items: boolean;
  loyalty_tier?: string;
  buy_product_id?: string;
  buy_quantity?: number;
  get_product_id?: string;
  get_quantity?: number;
}

export interface CouponValidateResponse {
  valid: boolean;
  discount_amount: number | string;
  error_message?: string;
  coupon_code: string;
  coupon_id?: string;
  discount_type: string;
  discount_value: number | string;
}

export interface CouponPerformanceItem {
  coupon_id: string;
  code: string;
  coupon_type: string;
  usage_count: number;
  total_discount_given: number | string;
  total_revenue_impact: number | string;
  conversion_rate: number | string;
}

export interface TicketResponse {
  id: string;
  customer_id: string;
  ticket_number: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  order_id?: string;
  product_id?: string;
  assigned_to?: string;
  vendor_id?: string;
  sla_deadline?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TicketDetailResponse {
  id: string;
  customer_id: string;
  ticket_number: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  order_id?: string;
  product_id?: string;
  assigned_to?: string;
  vendor_id?: string;
  sla_deadline?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
  replies?: TicketReplyResponse[];
  attachments?: TicketAttachmentResponse[];
  tags?: TicketTagResponse[];
  rating?: SatisfactionRatingResponse;
}

export interface TicketReplyResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  is_internal: boolean;
  content: string;
  created_at?: string;
}

export interface TicketAttachmentResponse {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  created_at?: string;
}

export interface TicketTagResponse {
  id: string;
  ticket_id: string;
  tag_name: string;
  created_by: string;
  created_at?: string;
}

export interface SatisfactionRatingResponse {
  id: string;
  ticket_id: string;
  customer_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface TicketStatsResponse {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  critical_priority: number;
  high_priority: number;
  average_resolution_time_hours?: number;
  customer_satisfaction_score?: number;
}

export interface TicketListResponse {
  items: TicketResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductResponse {
  id: string;
  vendor_id: string;
  sku: string;
  slug: string;
  permalink: string;
  name: string;
  short_description?: string;
  description?: string;
  global_unique_id?: string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  is_fragile: boolean;
  box_type?: string;
  price?: number | string;
  cost_price?: number | string;
  compare_at_price?: number | string;
  on_sale: boolean;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  discount_percentage?: number | string;
  tax_included: boolean;
  tax_status: string;
  tax_class?: string;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  status: string;
  approval_status: string;
  is_featured: boolean;
  image_url?: string;
  brands?: BrandResponse[];
  tags?: TagResponse[];
  created_at: string;
  updated_at: string;
}

export interface ProductDetailResponse {
  id: string;
  vendor_id: string;
  sku: string;
  slug: string;
  permalink: string;
  name: string;
  short_description?: string;
  description?: string;
  global_unique_id?: string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  is_fragile: boolean;
  box_type?: string;
  price?: number | string;
  cost_price?: number | string;
  compare_at_price?: number | string;
  on_sale: boolean;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  discount_percentage?: number | string;
  tax_included: boolean;
  tax_status: string;
  tax_class?: string;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  status: string;
  approval_status: string;
  is_featured: boolean;
  image_url?: string;
  brands?: BrandResponse[];
  tags?: TagResponse[];
  created_at: string;
  updated_at: string;
  complementary_products?: ProductAssociationResponse[];
  associated_with?: ProductAssociationResponse[];
  metadata?: ProductMetadataResponse;
}

export interface ProductCreate {
  sku: string;
  slug?: string;
  name: string;
  short_description?: string;
  description?: string;
  global_unique_id?: string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  is_fragile?: boolean;
  box_type?: string;
  price?: number | string;
  cost_price?: number | string;
  compare_at_price?: number | string;
  on_sale?: boolean;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  discount_percentage?: number | string;
  tax_included?: boolean;
  tax_status?: "taxable" | "shipping" | "none";
  tax_class?: string;
  stock_quantity?: number;
  manage_stock?: boolean;
  stock_status?: "instock" | "outofstock";
  is_featured?: boolean;
  vendor_id?: string;
  brand_ids?: string[];
  tag_ids?: string[];
}

export interface ProductUpdate {
  sku?: string;
  slug?: string;
  name?: string;
  short_description?: string;
  description?: string;
  global_unique_id?: string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  is_fragile?: boolean;
  box_type?: string;
  price?: number | string;
  cost_price?: number | string;
  compare_at_price?: number | string;
  on_sale?: boolean;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  discount_percentage?: number | string;
  tax_included?: boolean;
  tax_status?: "taxable" | "shipping" | "none";
  tax_class?: string;
  stock_quantity?: number;
  manage_stock?: boolean;
  stock_status?: "instock" | "outofstock";
  is_featured?: boolean;
  status?: "draft" | "pending" | "private" | "publish";
  approval_status?: "pending" | "approved" | "rejected";
  image_url?: string;
  brand_ids?: string[];
  tag_ids?: string[];
}

export interface BrandResponse {
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_featured?: boolean;
  display_order?: number;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TagResponse {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductAssociationResponse {
  associated_product_id: string;
  association_type?: "complementary" | "accessory" | "replacement" | "bundle";
  display_order?: number;
  is_promoted?: boolean;
  reason?: string;
  id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductMetadataResponse {
  fda_clearance_number?: string;
  ce_marked?: boolean;
  iso_certified?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  shelf_life_months?: number;
  storage_requirements?: string;
  handling_instructions?: string;
  contraindications?: string;
  warnings?: string;
  side_effects?: string;
  intended_use?: string;
  instructions_for_use?: string;
  additional_metadata?: Record<string, unknown>;
  id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
  id: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export type CategoryTreeResponse = Record<string, unknown>;

export interface CategoryListResponse {
  items: CategoryResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryResponse {
  id: string;
  product_id: string;
  product_name?: string;
  vendor_id: string;
  warehouse_id: string;
  warehouse_name?: string;
  supplier_id?: string;
  sku: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  available_stock: number;
  reorder_level: number;
  max_stock_level?: number;
  reorder_quantity: number;
  lead_time: number;
  batch_number?: string;
  expiry_date?: string;
  inventory_type: string;
  unit_cost: number | string;
  total_value: number | string;
  reorder_needed: boolean;
  days_of_stock?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovementResponse {
  id: string;
  inventory_id: string;
  product_name?: string;
  sku?: string;
  vendor_id: string;
  movement_type: string;
  quantity: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryAdjustmentResponse {
  id: string;
  inventory_id: string;
  vendor_id: string;
  requested_by_id: string;
  approved_by_id?: string;
  original_quantity: number;
  new_quantity: number;
  adjustment_reason: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryAlertResponse {
  id: string;
  inventory_id: string;
  vendor_id: string;
  alert_type: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface WarehouseResponse {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderResponse {
  id: string;
  customer_id: string;
  status: string;
  total: number | string;
  created_at?: string;
  items?: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: number | string;
  commission_rate: number | string;
}

export interface ShipmentResponse {
  id: string;
  fulfillment_order_id: string;
  vendor_id: string;
  carrier: string;
  tracking_number: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartResponse {
  id: string;
  customer_id: string;
  items?: CartItemResponse[];
}

export interface CartItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  product: CartProductResponse;
}

export interface CartProductResponse {
  id: string;
  sku: string;
  name: string;
  price: number | string;
}
