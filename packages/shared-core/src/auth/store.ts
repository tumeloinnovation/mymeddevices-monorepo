import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/api-client';
import { toast } from 'sonner';
import { setAccessToken as setToken, clearAccessToken as clearToken } from './token';
import type {
  AuthUser,
  LoginCredentials,
  RegisterData,
  LoginResponse,
  TokenResponse,
  UserRole,
  LoginMode,
  CheckoutStep,
  VendorRegisterRequest,
  VendorStatus,
  VendorListResponse,
  ChangePasswordData,
  ChangeEmailData,
  ConfirmEmailChangeData,
  DeleteAccountData,
} from './types';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
  hydrated: boolean;
  lastValidated: number | null;
  checkoutStep?: CheckoutStep;
  vendorStatus: VendorStatus | null;

  login: (credentials: LoginCredentials, mode?: LoginMode) => Promise<void>;
  loginWithOTP: (email: string, code: string) => Promise<void>;
  sendLoginOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerVendor: (data: VendorRegisterRequest) => Promise<void>;
  verifyOTP: (email: string, code: string, purpose: string) => Promise<any>;
  refreshAccessToken: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, password: string, email: string) => Promise<void>;

  changePassword: (data: ChangePasswordData) => Promise<void>;
  changeEmail: (data: ChangeEmailData) => Promise<void>;
  confirmEmailChange: (data: ConfirmEmailChangeData) => Promise<void>;
  deleteAccount: (data: DeleteAccountData) => Promise<void>;

  getVendorStatus: () => Promise<VendorStatus>;
  getSystemStatus: () => Promise<{ smtp: { host: string; port: number; enabled: boolean }; sms: { sender_id: string; enabled: boolean } }>;
  listVendorsAdmin: (params?: { status?: string; page?: number; page_size?: number }) => Promise<VendorListResponse>;
  approveVendor: (vendorId: string) => Promise<void>;
  rejectVendor: (vendorId: string, reason: string) => Promise<void>;
  suspendVendor: (vendorId: string, reason: string) => Promise<void>;
  reactivateVendor: (vendorId: string) => Promise<void>;

  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHydrated: () => void;

  isAdmin: () => boolean;
  isVendor: () => boolean;
  isCustomer: () => boolean;
  apiFetch: (endpoint: string, init?: RequestInit) => Promise<Response>;
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Server';
  const ua = window.navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  if (ua.includes('Edge')) return 'Edge Browser';
  return 'Web Browser';
}

function getTokenExpiry(accessToken: string): number | null {
  try {
    const payloadPart = accessToken.split('.')[1];
    if (!payloadPart) return null;
    const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const payload = JSON.parse(atob(paddedPayload));
    if (typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      isLoading: false,
      isDemo: false,
      error: null,
      hydrated: false,
      lastValidated: null,
      vendorStatus: null,

      setHydrated: () => set({ hydrated: true }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          tokenExpiry: null,
          isAuthenticated: false,
          isDemo: false,
          error: null,
          vendorStatus: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refresh_token');
          clearToken();
        }
      },

      login: async (credentials, mode = 'customer') => {
        set({ isLoading: true, error: null });
        try {
          const device_id = credentials.device_id || getOrCreateDeviceId();
          const device_name = credentials.device_name || getDeviceName();

          const response = await apiClient.post<LoginResponse>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
            device_id,
            device_name,
            remember_me: credentials.rememberMe || false,
          });

          const expiresIn = (response.expires_in || 1800) * 1000;
          const tokenExpiry = Date.now() + expiresIn;

          if (typeof window !== 'undefined') {
            if (response.refresh_token) {
              localStorage.setItem('refresh_token', response.refresh_token);
            }
            setToken(response.access_token);
          }

          set({
            user: response.user,
            accessToken: response.access_token,
            tokenExpiry,
            isAuthenticated: true,
            isLoading: false,
            lastValidated: Date.now(),
          });

          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      loginWithOTP: async (email, code) => {
        set({ isLoading: true, error: null });
        try {
          const device_id = getOrCreateDeviceId();
          const device_name = getDeviceName();

          const response = await apiClient.post<LoginResponse>('/auth/login/otp', {
            email,
            code,
            device_id,
            device_name,
          });

          const expiresIn = (response.expires_in || 1800) * 1000;
          const tokenExpiry = Date.now() + expiresIn;

          if (typeof window !== 'undefined') {
            if (response.refresh_token) {
              localStorage.setItem('refresh_token', response.refresh_token);
            }
            setToken(response.access_token);
          }

          set({
            user: response.user,
            accessToken: response.access_token,
            tokenExpiry,
            isAuthenticated: true,
            isLoading: false,
            lastValidated: Date.now(),
          });

          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      sendLoginOTP: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/otp/send', { email, purpose: 'login' });
          set({ isLoading: false });
          toast.success('Verification code sent to your email!');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
          if (refreshToken) {
            await apiClient.post('/auth/logout', { refresh_token: refreshToken });
          }
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          get().clearAuth();
          set({ isLoading: false });
          toast.success('Logged out successfully');
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const payload: any = {
            email: data.email,
            password: data.password,
            role: data.role || 'customer',
          };
          if (data.firstName) payload.first_name = data.firstName;
          if (data.lastName) payload.last_name = data.lastName;
          if (data.phone) payload.phone = data.phone;
          if (data.companyName) payload.company_name = data.companyName;
          if (data.vatNumber) payload.vat_number = data.vatNumber;

          await apiClient.post('/auth/register', payload);
          set({ isLoading: false });
          toast.success('Registration successful!');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      registerVendor: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/register/vendor', data);
          set({ isLoading: false });
          toast.success('Vendor application submitted! Our team will review it.');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/forgot-password', { email });
          set({ isLoading: false });
          toast.success('Password reset instructions sent to your email!');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      resetPassword: async (code, password, email) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/reset-password', { code, new_password: password, email });
          set({ isLoading: false });
          toast.success('Password reset successful! Please login with your new password.');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      verifyOTP: async (email, code, purpose) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/otp/verify', { email, code, purpose });
          set({ isLoading: false });
          return response;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      getVendorStatus: async () => {
        set({ isLoading: true, error: null });
        try {
          const status = await apiClient.get<VendorStatus>('/vendors/me/status');
          set({ vendorStatus: status, isLoading: false });
          return status;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      getSystemStatus: async () => {
        try {
          const result = await apiClient.get<{ smtp: { host: string; port: number; enabled: boolean }; sms: { sender_id: string; enabled: boolean } }>('/system/status');
          return result;
        } catch (error: any) {
          toast.error('Failed to fetch system status');
          throw error;
        }
      },

      listVendorsAdmin: async (params) => {
        try {
          const result = await apiClient.get<VendorListResponse>('/vendors/admin/list', {
            params: params || {},
          });
          return result;
        } catch (error: any) {
          throw error;
        }
      },

      approveVendor: async (vendorId) => {
        try {
          await apiClient.post(`/vendors/admin/${vendorId}/approve`, { action: 'approve' });
          toast.success('Vendor approved successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to approve vendor');
          throw error;
        }
      },

      rejectVendor: async (vendorId, reason) => {
        try {
          await apiClient.post(`/vendors/admin/${vendorId}/reject`, { action: 'reject', reason });
          toast.success('Vendor application rejected');
        } catch (error: any) {
          toast.error(error.message || 'Failed to reject vendor');
          throw error;
        }
      },

      suspendVendor: async (vendorId, reason) => {
        try {
          await apiClient.post(`/vendors/admin/${vendorId}/suspend`, { action: 'suspend', reason });
          toast.success('Vendor suspended successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to suspend vendor');
          throw error;
        }
      },

      changePassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/change-password', data);
          set({ isLoading: false });
          toast.success('Password changed successfully');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      changeEmail: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post<{ message: string }>('/auth/change-email', data);
          set({ isLoading: false });
          toast.success('Verification code sent to your new email');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      confirmEmailChange: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/confirm-email-change', data);
          set({ isLoading: false });
          toast.success('Email address updated successfully');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      deleteAccount: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete('/auth/account', { body: data as any });
          get().clearAuth();
          set({ isLoading: false });
          toast.success('Account deleted successfully');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      reactivateVendor: async (vendorId) => {
        try {
          await apiClient.post(`/vendors/admin/${vendorId}/reactivate`, { action: 'approve' });
          toast.success('Vendor reactivated successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to reactivate vendor');
          throw error;
        }
      },

      refreshAccessToken: async () => {
        try {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
          if (!refreshToken) {
            get().clearAuth();
            return false;
          }

          const response = await apiClient.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken });

          const expiresIn = (response.expires_in || 1800) * 1000;
          const tokenExpiry = Date.now() + expiresIn;

          if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', response.refresh_token);
            setToken(response.access_token);
          }

          set({
            accessToken: response.access_token,
            tokenExpiry,
            lastValidated: Date.now(),
          });

          return true;
        } catch (error) {
          get().clearAuth();
          return false;
        }
      },

      validateSession: async () => {
        const state = get();
        if (!state.isAuthenticated || state.isDemo) return false;

        if (state.tokenExpiry && Date.now() < state.tokenExpiry - 60000) {
          return true;
        }

        return await get().refreshAccessToken();
      },

      isAdmin: () => get().user?.role === 'admin' || get().user?.role === 'worker',
      isVendor: () => get().user?.role === 'vendor',
      isCustomer: () => get().user?.role === 'customer',

      apiFetch: async (endpoint: string, init?: RequestInit): Promise<Response> => {
        return apiClient.rawRequest({
          endpoint,
          method: (init?.method as any) || 'GET',
          headers: init?.headers as Record<string, string> | undefined,
          body: init?.body,
          signal: init?.signal ?? undefined,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        // Exclude accessToken and tokenExpiry for security (memory-only storage)
        isAuthenticated: state.isAuthenticated,
        isDemo: state.isDemo,
        vendorStatus: state.vendorStatus,
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration, refresh the access token if user is authenticated
        // Only set hydrated after refresh completes to avoid race conditions
        if (state && state.isAuthenticated && state.user) {
          state.refreshAccessToken()
            .catch(() => {
              // If refresh fails, clear auth state
              state.clearAuth();
            })
            .finally(() => {
              state?.setHydrated();
            });
        } else {
          // No refresh needed, set hydrated immediately
          state?.setHydrated();
        }
      },
    }
  )
);
