'use client';

import { useQuery } from '@tanstack/react-query';
import { customerLoyaltyApi, type LoyaltySummary } from '@/lib/api/endpoints/loyalty';

/**
 * Hook for fetching loyalty summary
 * Provides real-time loyalty data from the API instead of relying on auth store
 */
export function useLoyaltySummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: () => customerLoyaltyApi.getSummary(),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching loyalty ledger/history
 */
export function useLoyaltyLedger(params: { page?: number; limit?: number; transaction_type?: string } = {}) {
  return useQuery({
    queryKey: ['loyalty-ledger', params],
    queryFn: () => customerLoyaltyApi.getLedger(params),
    staleTime: 60000, // Consider history data fresh for 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for getting loyalty points and tier from API
 * Returns a simplified object with points and tier for easy use
 */
export function useLoyaltyPoints(options?: { enabled?: boolean }) {
  const { data: summary, isLoading, error } = useLoyaltySummary(options);

  return {
    points: summary?.total_points ?? 0,
    tier: summary?.current_tier?.name?.toLowerCase() ?? 'bronze',
    pointsToNextTier: summary?.points_to_next_tier ?? 0,
    nextTier: summary?.next_tier?.name?.toLowerCase(),
    tierMultiplier: summary?.current_tier?.multiplier ?? 1,
    isLoading,
    error,
    summary, // Full summary data if needed
  };
}
