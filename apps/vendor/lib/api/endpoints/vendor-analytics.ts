import { apiClient } from '../client';
import type { VendorAnalyticsData } from '../types';

export const vendorAnalyticsApi = {
  getDashboard: async (period: '7d' | '30d' | '90d' = '30d'): Promise<VendorAnalyticsData> => {
    return await apiClient.get<VendorAnalyticsData>('/vendor/analytics/dashboard', {
      params: { period }
    });
  },

  getSales: async (period: '7d' | '30d' | '90d' = '30d') => {
    return await apiClient.get<any>('/vendor/analytics/sales', {
      params: { period }
    });
  },

  getSalesTrend: async (startDate: string, endDate: string, granularity = 'day') => {
    return await apiClient.get<any>('/vendor/analytics/sales/trend', {
      params: { start_date: startDate, end_date: endDate, granularity }
    });
  },

  getTopProducts: async (limit = 10, startDate?: string, endDate?: string) => {
    return await apiClient.get<any>('/vendor/analytics/sales/products', {
      params: { limit, start_date: startDate, end_date: endDate }
    });
  },

  getPerformance: async () => {
    return await apiClient.get<any>('/vendor/analytics/performance');
  },

  getEarnings: async (startDate?: string, endDate?: string) => {
    return await apiClient.get<any>('/vendor/analytics/earnings', {
      params: { start_date: startDate, end_date: endDate }
    });
  },

  getMetrics: async () => {
    return await apiClient.get<any>('/vendor/analytics/metrics');
  },

  trackEvent: async (eventData: {
    event_type: string;
    event_category?: string;
    properties?: Record<string, any>;
    event_value?: number;
  }) => {
    return await apiClient.post<any>('/vendor/analytics/events/track', eventData);
  },

  getEvents: async (startDate?: string, endDate?: string) => {
    return await apiClient.get<any>('/vendor/analytics/events', {
      params: { start_date: startDate, end_date: endDate }
    });
  },

  generateReport: async (
    reportType: 'sales' | 'performance' | 'earnings' | 'inventory' | 'orders',
    options: {
      startDate?: string;
      endDate?: string;
      period?: string;
      format?: 'json' | 'csv';
    } = {}
  ) => {
    return await apiClient.get<any>(`/vendor/analytics/reports/${reportType}`, {
      params: {
        start_date: options.startDate,
        end_date: options.endDate,
        period: options.period || 'month',
        format: options.format || 'json'
      }
    });
  },
};
