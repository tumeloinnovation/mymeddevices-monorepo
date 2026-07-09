import { apiClient } from './api-client';
import type {
  VendorProfileResponse,
  VendorProfileUpdate,
  VendorStatus,
} from '../auth/types';

export const vendorService = {
  async getMyStatus(): Promise<VendorStatus> {
    const result = await apiClient.get<any>('/vendors/me/status');
    return result?.data || result;
  },

  async getMyProfile(): Promise<VendorProfileResponse> {
    const result = await apiClient.get<any>('/vendors/me/profile');
    return result?.data || result;
  },

  async updateMyProfile(data: VendorProfileUpdate): Promise<{ message: string; approval_status: string }> {
    const result = await apiClient.patch<any>('/vendors/me/profile', data);
    return result?.data || result;
  },

  async getAdminProfile(vendorId: string): Promise<VendorProfileResponse> {
    const result = await apiClient.get<any>(`/vendors/admin/${vendorId}/profile`);
    return result?.data || result;
  },
};
