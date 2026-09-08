import { api } from "@/services/api.client";

export const orderTrackingApi = {
  /**
   * Get shipment tracking status and courier details
   */
  getOrderTracking: async (orderId: string | number): Promise<any> => {
    try {
      const response = await api.get<{ data: any }>(
        `/shopping/orders/${orderId}/tracking`
      );
      return response.data?.data || response.data;
    } catch {
      try {
        const fallback = await api.get<{ data: any }>(
          `/logistics/tracking/${orderId}`
        );
        return fallback.data?.data || fallback.data;
      } catch {
        return null;
      }
    }
  },

  /**
   * Live GPS delivery tracking for assigned delivery
   */
  getLiveDeliveryTracking: async (deliveryId: string): Promise<any> => {
    try {
      const response = await api.get(
        `/logistics/tracking/delivery/${deliveryId}`
      );
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },
};
