import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../endpoints';
import type { 
  VendorOrder, 
  VendorOrderDetail, 
  OrderListParams, 
  PaginatedResponse, 
  OrderStatus,
  TrackingInfo
} from '../types';

export function useOrders(params: OrderListParams) {
  const [data, setData] = useState<PaginatedResponse<VendorOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ordersApi.getOrders(params);
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = useCallback(async (orderId: string, itemId: string, status: OrderStatus) => {
    return await ordersApi.updateOrderStatus(orderId, itemId, status);
  }, []);

  const addTracking = useCallback(async (orderId: string, itemId: string, tracking: TrackingInfo) => {
    return await ordersApi.addTrackingInfo(orderId, itemId, tracking);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchOrders,
    updateStatus,
    addTracking
  };
}

export function useOrder(id: string) {
  const [data, setData] = useState<VendorOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await ordersApi.getOrder(id);
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch order details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { data, loading, error, refetch: fetchOrder };
}
