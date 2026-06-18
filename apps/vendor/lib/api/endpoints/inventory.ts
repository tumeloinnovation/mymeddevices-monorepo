import { apiClient } from '../client';
import type { 
  InventoryItem, 
  InventoryParams, 
  PaginatedResponse, 
  StockMovement, 
  StockAdjustment,
  LowStockAlert
} from '../types';

export const inventoryApi = {
  getInventory: async (params: InventoryParams) => {
    return await apiClient.get<PaginatedResponse<InventoryItem>>('/vendor/inventory', { params: params as any });
  },

  getStockMovements: async (productId?: string) => {
    return await apiClient.get<StockMovement[]>('/vendor/inventory/movements', {
      params: { product_id: productId }
    });
  },

  adjustStock: async (productId: string, adjustment: StockAdjustment) => {
    const response = await apiClient.post(`/vendor/inventory/products/${productId}/adjust`, adjustment) as any;
    return response.success;
  },

  getLowStockAlerts: async () => {
    return await apiClient.get<LowStockAlert[]>('/vendor/inventory/low-stock');
  },
};
