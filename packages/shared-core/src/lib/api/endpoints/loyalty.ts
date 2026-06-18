import { apiClient } from '@/lib/services/api-client';

export interface LoyaltySummary {
  total_points: number;
  earned_points: number;
  redeemed_points: number;
  current_tier: {
    id: string;
    name: string;
    min_points: number;
    multiplier: number;
    benefits: string[];
  };
  next_tier: {
    id: string;
    name: string;
    min_points: number;
    points_needed: number;
    benefits: string[];
  } | null;
  tier_progress: number;
  points_to_next_tier: number;
}

export interface LedgerEntry {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
  balance_after: number;
}

export const customerLoyaltyApi = {
  getSummary: () =>
    apiClient.get<LoyaltySummary>('/loyalty/summary'),

  getLedger: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ items: LedgerEntry[]; total: number; page: number; limit: number }>('/loyalty/ledger', { params }),

  redeem: (points: number, description: string) =>
    apiClient.post<LedgerEntry>('/loyalty/redeem', { points, description }),
};
