import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface PaymentMethod {
  id: string;
  customer_id: string;
  payment_type: 'mpesa' | 'card' | 'bank_transfer';
  is_default: boolean;
  is_active: boolean;
  display_name?: string;

  // M-Pesa fields
  phone_number?: string;

  // Card fields
  card_last4?: string;
  card_brand?: string;
  card_expiry_month?: string;
  card_expiry_year?: string;
  cardholder_name?: string;

  // Bank fields
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;

  created_at: string;
  updated_at: string;
}

export interface PaymentMethodListResponse {
  items: PaymentMethod[];
  total: number;
}

export interface MpesaPaymentMethodCreate {
  phone_number: string;
  is_default?: boolean;
  display_name?: string;
}

export interface CardPaymentMethodCreate {
  card_token: string;
  card_last4: string;
  card_brand: string;
  card_expiry_month: string;
  card_expiry_year: string;
  cardholder_name: string;
  is_default?: boolean;
  display_name?: string;
}

export interface BankPaymentMethodCreate {
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  is_default?: boolean;
  display_name?: string;
}

// ============================================================================
// Payment Methods API
// ============================================================================

export const customerPaymentMethodsApi = {
  /**
   * Get all payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get<any>('/payment-methods');

      if (response && response.data) {
        return response.data.items || [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  },

  /**
   * Get default payment method
   */
  async getDefaultPaymentMethod(): Promise<PaymentMethod | null> {
    try {
      const response = await apiClient.get<any>('/payment-methods/default');

      if (response && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch default payment method:', error);
      return null;
    }
  },

  /**
   * Create M-Pesa payment method
   */
  async createMpesaMethod(data: MpesaPaymentMethodCreate): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post<any>('/payment-methods/mpesa', data);

      if (response && response.data) {
        toast.success('M-Pesa payment method added');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add M-Pesa payment method:', error);
      toast.error('Failed to add payment method');
      throw error;
    }
  },

  /**
   * Create card payment method
   */
  async createCardMethod(data: CardPaymentMethodCreate): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post<any>('/payment-methods/card', data);

      if (response && response.data) {
        toast.success('Card payment method added');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add card payment method:', error);
      toast.error('Failed to add payment method');
      throw error;
    }
  },

  /**
   * Create bank payment method
   */
  async createBankMethod(data: BankPaymentMethodCreate): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post<any>('/payment-methods/bank', data);

      if (response && response.data) {
        toast.success('Bank payment method added');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add bank payment method:', error);
      toast.error('Failed to add payment method');
      throw error;
    }
  },

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    methodId: string,
    data: { is_default?: boolean; display_name?: string; is_active?: boolean }
  ): Promise<PaymentMethod> {
    try {
      const response = await apiClient.put<any>(`/payment-methods/${methodId}`, null, {
        params: data,
      });

      if (response && response.data) {
        toast.success('Payment method updated');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to update payment method ${methodId}:`, error);
      toast.error('Failed to update payment method');
      throw error;
    }
  },

  /**
   * Set as default payment method
   */
  async setDefault(methodId: string): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post<any>(`/payment-methods/${methodId}/set-default`, {});

      if (response && response.data) {
        toast.success('Default payment method updated');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to set default payment method ${methodId}:`, error);
      toast.error('Failed to update default payment method');
      throw error;
    }
  },

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      await apiClient.delete(`/payment-methods/${methodId}`);
      toast.success('Payment method deleted');
    } catch (error) {
      console.error(`Failed to delete payment method ${methodId}:`, error);
      toast.error('Failed to delete payment method');
      throw error;
    }
  },
};
