import { apiClient } from './api-client';
import type {
  VendorProfileResponse,
  VendorProfileUpdate,
  VendorStatus,
} from '../auth/types';

export const vendorService = {
  async getMyStatus(): Promise<VendorStatus> {
    return apiClient.get<VendorStatus>('/vendors/me/status');
  },

  async getMyProfile(): Promise<VendorProfileResponse> {
    return apiClient.get<VendorProfileResponse>('/vendors/me/profile');
  },

  async updateMyProfile(data: VendorProfileUpdate): Promise<{ message: string; approval_status: string }> {
    return apiClient.patch('/vendors/me/profile', data);
  },

  async getAdminProfile(vendorId: string): Promise<VendorProfileResponse> {
    return apiClient.get<VendorProfileResponse>(`/vendors/admin/${vendorId}/profile`);
  },
};
