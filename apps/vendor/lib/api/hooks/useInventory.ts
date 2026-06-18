import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../endpoints';
import type { 
  InventoryItem, 
  InventoryParams, 
  PaginatedResponse, 
  StockAdjustment 
} from '../types';

export function useInventory(params: InventoryParams) {
  const [data, setData] = useState<PaginatedResponse<InventoryItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryApi.getInventory(params);
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const adjustStock = useCallback(async (productId: string, adjustment: StockAdjustment) => {
    return await inventoryApi.adjustStock(productId, adjustment);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchInventory,
    adjustStock
  };
}

export function useLowStockAlerts() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryApi.getLowStockAlerts();
      if (result) setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch low stock alerts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { data, loading, error, refetch: fetchAlerts };
}
