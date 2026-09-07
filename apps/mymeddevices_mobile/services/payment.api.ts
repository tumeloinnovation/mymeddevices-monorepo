import { api } from "@/services/api.client";

export interface StkPushParams {
  order_id: string | number;
  phone_number: string;
  amount?: number;
}

export interface StkPushResponse {
  merchant_request_id?: string;
  checkout_request_id?: string;
  response_code?: string;
  response_description?: string;
  customer_message?: string;
}

export interface StkPushStatusResponse {
  checkout_request_id: string;
  status: "pending" | "verified" | "completed" | "failed" | "reversed" | string;
  amount?: number;
  phone_number?: string;
  notes?: string;
}

export interface PaymentMethod {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  type: "mobile_money" | "card" | "bank_transfer" | "cash_on_delivery";
}

export interface PaymentTransaction {
  id: string;
  order_id: string | number;
  transaction_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  phone_number?: string;
  created_at: string;
}

export const paymentApi = {
  /**
   * Trigger M-Pesa Daraja STK Push prompt to customer's phone
   */
  initiateStkPush: async (params: StkPushParams): Promise<StkPushResponse> => {
    let formattedPhone = params.phone_number.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
      formattedPhone = `254${formattedPhone}`;
    }

    try {
      const response = await api.post("/shopping/mpesa/stk-push", {
        order_id: params.order_id,
        phone_number: formattedPhone,
        amount: params.amount,
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post("/payments/stkpush/initiate", {
        order_id: params.order_id,
        phone: formattedPhone,
        amount: params.amount,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Poll STK Push transaction status using CheckoutRequestID
   */
  getStkPushStatus: async (
    checkoutRequestId: string,
    guestToken?: string
  ): Promise<StkPushStatusResponse> => {
    try {
      const response = await api.get(`/shopping/mpesa/status/${checkoutRequestId}`, {
        params: guestToken ? { guest_token: guestToken } : undefined,
      });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post("/payments/stkpush/status", {
        checkout_request_id: checkoutRequestId,
      });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * List available payment options
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const response = await api.get("/payments/methods");
      return (
        response.data?.data ||
        (Array.isArray(response.data)
          ? response.data
          : [
              {
                id: "mpesa",
                title: "M-Pesa Express",
                description: "Pay instantly with M-Pesa STK push",
                enabled: true,
                type: "mobile_money",
              },
              {
                id: "cod",
                title: "Cash on Delivery",
                description: "Pay upon receiving your equipment",
                enabled: true,
                type: "cash_on_delivery",
              },
            ])
      );
    } catch {
      return [
        {
          id: "mpesa",
          title: "M-Pesa Express",
          description: "Pay instantly with M-Pesa STK push",
          enabled: true,
          type: "mobile_money",
        },
        {
          id: "cod",
          title: "Cash on Delivery",
          description: "Pay upon receiving your equipment",
          enabled: true,
          type: "cash_on_delivery",
        },
      ];
    }
  },

  /**
   * Customer payment transactions history
   */
  getTransactions: async (page = 1, pageSize = 20): Promise<PaymentTransaction[]> => {
    try {
      const response = await api.get("/payments/transactions", {
        params: { page, page_size: pageSize },
      });
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  },

  /**
   * Single payment transaction detail
   */
  getTransaction: async (id: string): Promise<PaymentTransaction | null> => {
    try {
      const response = await api.get(`/payments/transactions/${id}`);
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },
};

export default paymentApi;
