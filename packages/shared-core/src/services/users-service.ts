import { apiClient } from './api-client';
import { AdminCustomerCreateInput } from '../lib/validation/admin';

// ============================================================================
// Types
// ============================================================================

export interface UserStats {
  total_customers: number;
  active_customers: number;
  total_vendors: number;
  active_vendors: number;
  pending_vendors: number;
  total_staff: number;
  active_staff: number;
  new_this_month: number;
  active_today: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  status: 'active' | 'inactive' | 'suspended';
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  joined_date: string;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  is_verified: boolean;
  joined_date: string;
  last_login?: string;
  loyalty_tier?: string;
  loyalty_points?: number;
  notes?: string;
  avatar_url?: string;
  email_order_updates?: boolean;
  email_promotions?: boolean;
  email_newsletter?: boolean;
  email_security?: boolean;
  sms_order_updates?: boolean;
  sms_promotions?: boolean;
  sms_security?: boolean;
  language?: string;
  timezone?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  status: 'active' | 'inactive' | 'pending';
  department?: string;
  last_login?: string;
  joined_date: string;
  permissions_count: number;
}

export interface StaffListResponse {
  staff: StaffMember[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StaffDetail {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  phone?: string;
  department?: string;
  is_active: boolean;
  is_verified: boolean;
  joined_date: string;
  last_login?: string;
}

export interface VendorOverview {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  store_name?: string;
  status: string;
  is_verified: boolean;
  joined_date: string;
  approval_date?: string;
}

export interface VendorListOverviewResponse {
  vendors: VendorOverview[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// Service
// ============================================================================

export const usersService = {
  // ============================================================================
  // Stats
  // ============================================================================

  async getStats(): Promise<UserStats> {
    return apiClient.get<UserStats>('/admin/users/stats');
  },

  // ============================================================================
  // Customers
  // ============================================================================

  async getCustomers(params: {
    search?: string;
    status_filter?: 'active' | 'inactive' | 'suspended';
    page?: number;
    page_size?: number;
  }): Promise<CustomerListResponse> {
    return apiClient.get<CustomerListResponse>('/admin/users/customers', { params });
  },

  async getCustomer(id: string): Promise<CustomerDetail> {
    return apiClient.get<CustomerDetail>(`/admin/users/customers/${id}`);
  },

  async updateCustomerStatus(id: string, action: 'activate' | 'deactivate' | 'suspend'): Promise<{
    message: string;
    status: string;
  }> {
    return apiClient.patch(`/admin/users/customers/${id}/status`, null, {
      params: { action }
    });
  },

  async createCustomer(data: AdminCustomerCreateInput): Promise<{
    id: string;
    email: string;
    message: string;
  }> {
    return apiClient.post('/admin/users/customers', data);
  },

  // ============================================================================
  // Staff
  // ============================================================================

  async getStaff(params: {
    search?: string;
    role_filter?: 'admin' | 'worker';
    status_filter?: 'active' | 'inactive' | 'pending';
    page?: number;
    page_size?: number;
  }): Promise<StaffListResponse> {
    return apiClient.get<StaffListResponse>('/admin/users/staff', { params });
  },

  async getStaffMember(id: string): Promise<StaffDetail> {
    return apiClient.get<StaffDetail>(`/admin/users/staff/${id}`);
  },

  async createStaff(data: {
    email: string;
    role: 'admin' | 'worker';
    first_name: string;
    last_name: string;
  }): Promise<{
    id: string;
    email: string;
    role: string;
    message: string;
  }> {
    return apiClient.post('/admin/users/staff', null, {
      params: data
    });
  },

  async updateStaffStatus(id: string, action: 'activate' | 'deactivate'): Promise<{
    message: string;
    status: string;
  }> {
    return apiClient.patch(`/admin/users/staff/${id}/status`, null, {
      params: { action }
    });
  },

  async deleteStaff(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/admin/users/staff/${id}`);
  },

  // ============================================================================
  // Vendors (Overview)
  // ============================================================================

  async getVendorsOverview(params: {
    status_filter?: string;
    page?: number;
    page_size?: number;
  }): Promise<VendorListOverviewResponse> {
    return apiClient.get<VendorListOverviewResponse>('/admin/users/vendors/overview', { params });
  },
};

// Re-export for convenience
export default usersService;
