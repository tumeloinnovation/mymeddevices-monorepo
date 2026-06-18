import { useState, useEffect, useCallback } from 'react';
import { vendorAnalyticsApi } from '../endpoints';
import type { VendorAnalyticsData } from '../types';

export function useVendorAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  const [data, setData] = useState<VendorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const analytics = await vendorAnalyticsApi.getDashboard(period);
      if (analytics) setData(analytics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}

export function useVendorSalesAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const sales = await vendorAnalyticsApi.getSales(period);
      if (sales) setData(sales);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sales data'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { data, loading, error, refetch: fetchSales };
}

export function useVendorPerformanceAnalytics() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const performance = await vendorAnalyticsApi.getPerformance();
      if (performance) setData(performance);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch performance data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { data, loading, error, refetch: fetchPerformance };
}

export function useVendorEarningsAnalytics() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const earnings = await vendorAnalyticsApi.getEarnings();
      if (earnings) setData(earnings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch earnings data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return { data, loading, error, refetch: fetchEarnings };
}
