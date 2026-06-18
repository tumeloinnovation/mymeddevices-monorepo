import { apiClient } from '@mymeddevices/core/lib/services/api-client';

export interface ReturnItem {
  id: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason?: string;
  condition: string;
  images?: string[];
}

export interface ReturnRequest {
  id: string;
  return_number: string;
  customer_id: string;
  order_id: string;
  status: string;
  reason: string;
  description?: string;
  items: ReturnItem[];
  refund_method: string;
  refund_amount?: number;
  refund_transaction_id?: string;
  shipping_label?: string;
  tracking_number?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnItemCreate {
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason?: string;
  condition?: string;
  images?: string[];
}

export interface ReturnRequestCreate {
  order_id: string;
  reason: string;
  description?: string;
  items: ReturnItemCreate[];
  refund_method?: string;
}

export interface ReturnListResponse {
  items: ReturnRequest[];
  total: number;
  page: number;
  limit: number;
}

export const customerReturnsApi = {
  async getMyReturns(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ReturnListResponse> {
    const response = await apiClient.get<any>('/returns', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status,
      },
    });

    if (response && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  },

  async getReturn(returnId: string): Promise<ReturnRequest> {
    const response = await apiClient.get<any>(`/returns/${returnId}`);

    if (response && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  },

  async create(returnRequest: ReturnRequestCreate): Promise<ReturnRequest> {
    const response = await apiClient.post<any>('/returns', returnRequest);

    if (response && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  },

  async cancel(returnId: string): Promise<ReturnRequest> {
    const response = await apiClient.post<any>(`/returns/${returnId}/cancel`, {});

    if (response && response.data) {
      return response.data;
    }

    throw new Error('Invalid response format');
  },
};
