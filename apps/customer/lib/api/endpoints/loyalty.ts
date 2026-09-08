import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface LoyaltyTier {
  name: string;
  multiplier: number;
  benefits: string[];
}

export interface LoyaltySummary {
  customer_id: string;
  total_points: number;
  current_tier: LoyaltyTier;
  next_tier?: {
    name: string;
    points_needed: number;
  };
  points_to_next_tier: number;
  tier_progress: number;
}

export interface LoyaltyLedgerEntry {
  id: string;
  transaction_type: string;
  points: number;
  balance_after: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

export interface LoyaltyLedger {
  items: LoyaltyLedgerEntry[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Loyalty API
// ============================================================================

export const customerLoyaltyApi = {
  /**
   * Get loyalty summary
   */
  async getSummary(): Promise<LoyaltySummary> {
    try {
      const response = await apiClient.get<any>('/customers/me/loyalty/summary');

      if (response) {
        return response.data || response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch loyalty summary:', error);
      throw error;
    }
  },

  /**
   * Get loyalty ledger/history
   */
  async getLedger(params: { page?: number; limit?: number; transaction_type?: string } = {}): Promise<LoyaltyLedger> {
    try {
      const response = await apiClient.get<any>('/customers/me/loyalty/ledger', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          transaction_type: params.transaction_type,
        },
      });

      if (response) {
        return response.data || response;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch loyalty ledger:', error);
      throw error;
    }
  },

  /**
   * Redeem loyalty points
   */
  async redeem(points: number, description: string): Promise<{
    message: string;
    entry_id: string;
    new_balance: number;
  }> {
    try {
      const response = await apiClient.post<any>('/customers/me/loyalty/redeem', {
        points,
        description,
      });

      if (response) {
        const data = response.data || response;
        toast.success(data.message || 'Points redeemed successfully');
        return data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to redeem points:', error);
      toast.error('Failed to redeem points');
      throw error;
    }
  },
};
