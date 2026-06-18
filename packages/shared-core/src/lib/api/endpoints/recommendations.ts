import { apiClient } from '@/lib/services/api-client';

export interface RecommendedProduct {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  image?: string;
  rating?: number;
  reason?: string;
  score?: number;
}

export interface RecommendationFeedback {
  recommendation_id: string;
  helpful: boolean;
}

export const customerRecommendationsApi = {
  getPersonalized: (params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>('/recommendations/personalized', { params }),

  getSimilar: (productId: string, params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>(`/recommendations/similar/${productId}`, { params }),

  getFrequentlyBoughtTogether: (productId: string, params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>(`/recommendations/frequently-bought-together/${productId}`, { params }),

  getCompleteTheLook: (productId: string, params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>(`/recommendations/complete-the-look/${productId}`, { params }),

  getTrending: (params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>('/recommendations/trending', { params }),

  getPopular: (params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>('/recommendations/popular', { params }),

  getCartRecommendations: (params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>('/recommendations/cart', { params }),

  getEmptyCart: (params?: { limit?: number }) =>
    apiClient.get<RecommendedProduct[]>('/recommendations/empty-cart', { params }),

  submitFeedback: (data: RecommendationFeedback) =>
    apiClient.post<{ success: boolean }>('/recommendations/feedback', data),

  trackImpression: (recommendationIds: string[]) =>
    apiClient.post<{ success: boolean }>('/recommendations/track/impression', { recommendation_ids: recommendationIds }),

  trackClick: (recommendationId: string) =>
    apiClient.post<{ success: boolean }>('/recommendations/track/click', { recommendation_id: recommendationId }),

  trackConversion: (recommendationId: string, orderId: string) =>
    apiClient.post<{ success: boolean }>('/recommendations/track/conversion', { recommendation_id: recommendationId, order_id: orderId }),

  dismiss: (recommendationId: string) =>
    apiClient.delete<{ success: boolean }>(`/recommendations/dismiss/${recommendationId}`),
};
