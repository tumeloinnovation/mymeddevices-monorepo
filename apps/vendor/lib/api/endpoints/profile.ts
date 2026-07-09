import { apiClient } from '../client';
import type { 
  StoreProfile, 
  UpdateStoreProfileDto, 
  StorePolicies 
} from '../types';

export const profileApi = {
  getStoreProfile: async () => {
    return await apiClient.get<StoreProfile>('/vendors/me/profile');
  },

  updateStoreProfile: async (data: UpdateStoreProfileDto) => {
    return await apiClient.patch<any>('/vendors/me/profile', data);
  },

  uploadLogo: async (file: File) => {
    try {
      return await apiClient.upload<{ logo_url: string }>('/vendors/me/profile/logo', file);
    } catch {
      return { logo_url: '' };
    }
  },

  updatePolicies: async (policies: StorePolicies) => {
    try {
      return await apiClient.patch<StorePolicies>('/vendors/me/profile', { policies });
    } catch {
      return policies;
    }
  },
};

