import { useState, useEffect, useCallback } from 'react';
import { earningsApi } from '../endpoints';
import type { 
  EarningsSummary, 
  Payout, 
  PayoutListParams, 
  PaginatedResponse, 
  PayoutMethod 
} from '../types';

export function useEarnings() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const result = await earningsApi.getEarningsSummary();
      if (result) setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch earnings summary'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

export function usePayouts(params: PayoutListParams) {
  const [data, setData] = useState<PaginatedResponse<Payout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await earningsApi.getPayouts(params);
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payouts'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const requestPayout = useCallback(async (amount: number, method: PayoutMethod) => {
    return await earningsApi.requestPayout(amount, method);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchPayouts,
    requestPayout
  };
}
