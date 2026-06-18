import { apiClient } from '../client';
import type { DashboardStats, SalesTrendPoint, TopProduct } from '../types';

export const analyticsApi = {
  getDashboard: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await apiClient.get<DashboardStats>('/vendor/analytics/dashboard', { params: { period } });
    return response;
  },

  getSalesTrend: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<SalesTrendPoint[]>('/vendor/analytics/sales', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response;
  },

  getTopProducts: async (limit = 10) => {
    const response = await apiClient.get<TopProduct[]>('/vendor/analytics/top-products', { params: { limit } });
    return response;
  },
};
