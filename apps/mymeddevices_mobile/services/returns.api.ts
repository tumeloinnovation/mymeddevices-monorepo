import { api } from "@/services/api.client";

export interface ReturnItem {
  order_item_id: string | number;
  product_id: string | number;
  product_name?: string;
  quantity: number;
  reason?: string;
}

export interface ReturnRequest {
  id: string;
  return_number?: string;
  order_id: string | number;
  status: "pending" | "approved" | "rejected" | "received" | "refunded" | string;
  reason: string;
  description?: string;
  refund_method?: string;
  refund_amount?: number;
  items: ReturnItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateReturnParams {
  order_id: string | number;
  reason: string;
  description?: string;
  items: ReturnItem[];
  refund_method?: "original" | "store_credit" | "mpesa" | string;
}

export const returnsApi = {
  /**
   * List return & refund requests
   */
  getReturns: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ReturnRequest[]> => {
    try {
      const response = await api.get<{ data: any }>("/returns", { params });
      const data = response.data?.data || response.data;
      return data?.items || (Array.isArray(data) ? data : []);
    } catch {
      return [];
    }
  },

  /**
   * Submit a return request for delivered items
   */
  createReturn: async (params: CreateReturnParams): Promise<ReturnRequest> => {
    const response = await api.post("/returns", params);
    return response.data?.data || response.data;
  },

  /**
   * Get return request details
   */
  getReturn: async (returnId: string): Promise<ReturnRequest> => {
    const response = await api.get(`/returns/${returnId}`);
    return response.data?.data || response.data;
  },
};

export default returnsApi;
