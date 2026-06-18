import { apiClient } from '../client';
import type { 
  StoreProfile, 
  UpdateStoreProfileDto, 
  StorePolicies 
} from '../types';

export const profileApi = {
  getStoreProfile: async () => {
    return await apiClient.get<StoreProfile>('/vendor/profile');
  },

  updateStoreProfile: async (data: UpdateStoreProfileDto) => {
    return await apiClient.put<any>('/vendor/profile', data);
  },

  uploadLogo: async (file: File) => {
    try {
      return await apiClient.upload<{ logo_url: string }>('/vendor/profile/logo', file);
    } catch {
      return { logo_url: '' };
    }
  },

  updatePolicies: async (policies: StorePolicies) => {
    try {
      return await apiClient.put<StorePolicies>('/vendor/profile', { policies });
    } catch {
      return policies;
    }
  },
};

