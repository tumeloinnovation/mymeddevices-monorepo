import { apiClient } from '../client';
import type { 
  EarningsSummary, 
  Payout, 
  PayoutListParams, 
  PaginatedResponse, 
  PayoutMethod,
  CommissionBreakdown
} from '../types';

export const earningsApi = {
  getEarningsSummary: async () => {
    return await apiClient.get<EarningsSummary>('/vendor/earnings/summary');
  },

  getPayouts: async (params: PayoutListParams) => {
    return await apiClient.get<PaginatedResponse<Payout>>('/vendor/earnings/payouts', { params: params as any });
  },

  requestPayout: async (amount: number, method: PayoutMethod) => {
    return await apiClient.post<Payout>('/vendor/earnings/payouts/request', {
      amount,
      method
    });
  },

  getCommissionBreakdown: async (orderId: string) => {
    return await apiClient.get<CommissionBreakdown>(`/vendor/earnings/orders/${orderId}/commission`);
  },

  getEarningsStatement: async (startDate: string, endDate: string) => {
    return await apiClient.get<Blob>(`/vendor/earnings/statement`, {
      params: { start_date: startDate, end_date: endDate }
    });
  },
};
