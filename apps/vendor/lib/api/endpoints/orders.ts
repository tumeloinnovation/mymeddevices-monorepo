import { apiClient } from '../client';
import type { 
  VendorOrder, 
  VendorOrderDetail, 
  OrderListParams, 
  PaginatedResponse, 
  OrderStatus,
  TrackingInfo
} from '../types';

export const ordersApi = {
  getOrders: async (params: OrderListParams) => {
    return await apiClient.get<PaginatedResponse<VendorOrder>>('/vendor/orders', { params: params as any });
  },

  getOrder: async (id: string) => {
    return await apiClient.get<VendorOrderDetail>(`/vendor/orders/${id}`);
  },

  updateOrderStatus: async (orderId: string, itemId: string, status: OrderStatus) => {
    const response = await apiClient.patch(`/vendor/orders/${orderId}/items/${itemId}/status`, { status }) as any;
    return response.success;
  },

  addTrackingInfo: async (orderId: string, itemId: string, tracking: TrackingInfo) => {
    const response = await apiClient.post(`/vendor/orders/${orderId}/items/${itemId}/tracking`, tracking) as any;
    return response.success;
  },

  generatePackingSlip: async (orderId: string) => {
    return await apiClient.get<Blob>(`/vendor/orders/${orderId}/packing-slip`);
  },
};
