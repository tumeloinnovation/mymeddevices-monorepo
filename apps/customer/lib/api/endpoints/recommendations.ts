import { apiClient } from '@mymeddevices/core/lib/services/api-client';

export const customerRecommendationsApi = {
  /**
   * Get trending products based on recent sales.
   */
  async getTrending(params: { limit?: number } = {}) {
    try {
      const response = await apiClient.get<any>('/recommendations/trending', { params });
      return response?.data || response || [];
    } catch (error) {
      console.error("Failed to fetch trending recommendations:", error);
      return [];
    }
  },
};
