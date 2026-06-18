import { apiClient } from '../client';

export interface RecommendationOpportunity {
  product_id: string;
  product_name: string;
  product_image?: string;
  opportunity_type: string;
  score: number;
  potential_revenue: number;
}

export interface RecommendationPerformance {
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  click_through_rate: number;
  conversion_rate: number;
  revenue_generated: number;
}

export const vendorRecommendationsApi = {
  getMyProducts: async (params?: { page?: number; limit?: number }) => {
    return await apiClient.get<RecommendationOpportunity[]>('/recommendations/vendor/my-products', { params: params as any });
  },

  getCrossSell: async () => {
    return await apiClient.get<RecommendationOpportunity[]>('/recommendations/vendor/cross-sell');
  },

  getPerformance: async () => {
    return await apiClient.get<RecommendationPerformance>('/recommendations/vendor/performance');
  },

  boostProduct: async (productId: string, budget?: number) => {
    const response = await apiClient.post<{ success: boolean }>('/recommendations/vendor/boost', { product_id: productId, budget }) as any;
    return response.success;
  },
};
