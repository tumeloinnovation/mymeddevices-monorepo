import { apiClient } from "./api-client";

export interface AdminAnalyticsOverview {
  total_revenue: number;
  current_window_revenue: number;
  revenue_growth: number;
  total_orders: number;
  current_window_orders: number;
  orders_growth: number;
  total_customers: number;
  total_vendors: number;
  total_users: number;
  conversion_rate: number;
  avg_order_value: number;
  abandoned_carts: number;
  pending_vendors?: number;
  unfulfilled_orders?: number;
  low_stock_count?: number;
  open_tickets?: number;
  compliance_score?: number;
  total_products?: number;
  verified_products?: number;
}

export interface AdminActionItem {
  id: string;
  type: "vendor" | "order" | "stock" | "support" | "review";
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  count: number;
  link: string;
  action_label: string;
}

export interface AdminStockAlert {
  id: string;
  name: string;
  stock_quantity: number;
  threshold: number;
  price: number;
}

export interface AdminOrderStatusDistribution {
  status: string;
  key: string;
  count: number;
  revenue: number;
  color: string;
}

export interface AdminPaymentDistribution {
  method: string;
  raw_method: string;
  orders_count: number;
  revenue: number;
  share: number;
}

export interface AdminAnalyticsData {
  overview: AdminAnalyticsOverview;
  order_overview: Array<{
    period: string;
    orders: number;
    revenue: number;
    total: number;
  }>;
  monthly_trends: Array<{
    period: string;
    orders: number;
    revenue: number;
    total: number;
  }>;
  status_breakdown: Record<string, number>;
  order_status_distribution?: AdminOrderStatusDistribution[];
  recent_orders: Array<{
    id: string;
    order_number: string;
    product: string;
    customer: string;
    qty: string;
    status: string;
    paymentMethod: string;
    totalPrice: string;
    amount: number;
    created_at?: string;
  }>;
  top_products: Array<{
    id: string;
    name: string;
    price: number;
    units_sold: number;
    revenue: number;
  }>;
  stock_alerts?: AdminStockAlert[];
  action_items?: AdminActionItem[];
  payment_distribution?: AdminPaymentDistribution[];
  segmentation: Array<{
    name: string;
    value: number;
    color: string;
    growth: string;
  }>;
  user_activity: Array<{
    day: string;
    checkout: number;
    active: number;
  }>;
}

export type PromotionType = "percentage" | "fixed" | "free_shipping" | "bundle" | "flash_sale";

export interface Promotion {
  id: string;
  title: string;
  code?: string;
  description?: string;
  promotion_type: PromotionType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  banner_text?: string;
  badge_text?: string;
  applicable_category_ids?: string[];
  applicable_product_ids?: string[];
  usage_limit?: number;
  usage_count: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface SmsCampaign {
  id: string;
  title: string;
  message: string;
  sender_id: string;
  target_audience: string;
  recipient_count: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  scheduled_at?: string;
  sent_at?: string;
  cost_kes: number;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  preview_text?: string;
  html_content: string;
  target_audience: string;
  recipient_count: number;
  open_count: number;
  click_count: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

class AdminService {
  // Analytics
  async getAnalytics(days: number = 30): Promise<AdminAnalyticsData> {
    return apiClient.get<AdminAnalyticsData>(`/admin/analytics?days=${days}`);
  }

  // Promotions & Marketing
  async getPromotions(params?: { promotion_type?: string; only_active?: boolean; page?: number; page_size?: number }): Promise<Promotion[]> {
    const query = new URLSearchParams();
    if (params?.promotion_type) query.append("promotion_type", params.promotion_type);
    if (params?.only_active) query.append("only_active", "true");
    if (params?.page) query.append("page", String(params.page));
    if (params?.page_size) query.append("page_size", String(params.page_size));

    const qs = query.toString();
    return apiClient.get<Promotion[]>(`/admin/promotions${qs ? `?${qs}` : ""}`);
  }

  async getPromotion(id: string): Promise<Promotion> {
    return apiClient.get<Promotion>(`/admin/promotions/${id}`);
  }

  async createPromotion(data: Partial<Promotion>): Promise<Promotion> {
    return apiClient.post<Promotion>("/admin/promotions", data);
  }

  async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
    return apiClient.patch<Promotion>(`/admin/promotions/${id}`, data);
  }

  async deletePromotion(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/promotions/${id}`);
  }

  async togglePromotionStatus(id: string): Promise<Promotion> {
    return apiClient.post<Promotion>(`/admin/promotions/${id}/toggle-status`, {});
  }

  // SMS Campaigns
  async getSmsCampaigns(page: number = 1, pageSize: number = 20): Promise<SmsCampaign[]> {
    return apiClient.get<SmsCampaign[]>(`/admin/marketing/sms-campaigns?page=${page}&page_size=${pageSize}`);
  }

  async createSmsCampaign(data: { title: string; message: string; sender_id?: string; target_audience?: string; scheduled_at?: string }): Promise<SmsCampaign> {
    return apiClient.post<SmsCampaign>("/admin/marketing/sms-campaigns", data);
  }

  async sendSmsCampaign(id: string): Promise<SmsCampaign> {
    return apiClient.post<SmsCampaign>(`/admin/marketing/sms-campaigns/${id}/send`, {});
  }

  async deleteSmsCampaign(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/marketing/sms-campaigns/${id}`);
  }

  // Email Campaigns
  async getEmailCampaigns(page: number = 1, pageSize: number = 20): Promise<EmailCampaign[]> {
    return apiClient.get<EmailCampaign[]>(`/admin/marketing/email-campaigns?page=${page}&page_size=${pageSize}`);
  }

  async createEmailCampaign(data: { title: string; subject: string; preview_text?: string; html_content: string; target_audience?: string; scheduled_at?: string }): Promise<EmailCampaign> {
    return apiClient.post<EmailCampaign>("/admin/marketing/email-campaigns", data);
  }

  async sendEmailCampaign(id: string): Promise<EmailCampaign> {
    return apiClient.post<EmailCampaign>(`/admin/marketing/email-campaigns/${id}/send`, {});
  }

  async deleteEmailCampaign(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/marketing/email-campaigns/${id}`);
  }

  // Reviews Moderation
  async getReviews(params?: {
    moderation_status?: string;
    contains_profanity?: boolean;
    vendor_id?: string;
    product_id?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminReviewsResponse> {
    const query = new URLSearchParams();
    if (params?.moderation_status && params.moderation_status !== "all") query.append("moderation_status", params.moderation_status);
    if (params?.contains_profanity !== undefined) query.append("contains_profanity", String(params.contains_profanity));
    if (params?.vendor_id) query.append("vendor_id", params.vendor_id);
    if (params?.product_id) query.append("product_id", params.product_id);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    return apiClient.get<AdminReviewsResponse>(`/admin/reviews${qs ? `?${qs}` : ""}`);
  }

  async getReviewsSummary(): Promise<AdminReviewsSummary> {
    return apiClient.get<AdminReviewsSummary>("/admin/reviews/summary");
  }

  async getFlaggedReviews(page: number = 1, limit: number = 50): Promise<AdminReviewsResponse> {
    return apiClient.get<AdminReviewsResponse>(`/admin/reviews/flagged?page=${page}&limit=${limit}`);
  }

  async moderateReview(
    reviewId: string,
    data: { moderation_status: "visible" | "hidden" | "removed"; reason?: string }
  ): Promise<AdminReview> {
    return apiClient.put<AdminReview>(`/admin/reviews/${reviewId}/moderate`, data);
  }

  async deleteReview(reviewId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin/reviews/${reviewId}`);
  }
}

export interface AdminReview {
  id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  contains_profanity: boolean;
  flagged_words?: string[] | null;
  moderation_status: "visible" | "hidden" | "removed";
  moderation_reason?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  product_name?: string | null;
  vendor_id?: string | null;
  vendor_name?: string | null;
}

export interface AdminReviewsSummary {
  total_reviews: number;
  average_rating: number;
  visible_reviews: number;
  hidden_reviews: number;
  removed_reviews: number;
  flagged_profanity: number;
  rating_distribution: Record<string, number>;
}

export interface AdminReviewsResponse {
  reviews: AdminReview[];
  total: number;
  page: number;
  limit: number;
}

export const adminService = new AdminService();
