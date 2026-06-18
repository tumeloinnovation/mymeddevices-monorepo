import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../endpoints';
import type { DashboardStats } from '../types';

export function useDashboardStats(period: '7d' | '30d' | '90d' = '30d') {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await analyticsApi.getDashboard(period);
      if (stats) setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard stats'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
