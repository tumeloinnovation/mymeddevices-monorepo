import { apiClient } from '@mymeddevices/core/lib/services/api-client';

export const customerRecommendationsApi = {
  /**
   * Get trending products based on recent sales.
   */
  async getTrending(params: { limit?: number } = {}) {
    try {
      const response = await apiClient.get<any>('/recommendations/trending', { params });
      // The apiClient already unwraps { success: true, data: T } if configured correctly
      // Based on my read of apiClient.ts, it returns json.data if json.success is true.
      return response || [];
    } catch (error) {
      console.error("Failed to fetch trending recommendations:", error);
      return [];
    }
  },
};
