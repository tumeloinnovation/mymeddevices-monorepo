import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/services/api-client';
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
  CustomerUser,
  VendorUser,
} from './types';

const DEMO_CUSTOMER: CustomerUser = {
  id: 1,
  email: 'john.doe@example.com',
  role: 'customer',
  phone: '+254712345678',
  is_active: true,
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format',
  wooCustomerId: 1,
};

const DEMO_VENDOR: VendorUser = {
  id: 101,
  email: 'vendor@medistore.co.ke',
  role: 'vendor',
  phone: '+254722987654',
  is_active: true,
  name: 'Sarah Kamau',
  store_name: 'MediStore Kenya',
};

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
  getRateLimits: () => Promise<Record<string, [number, number]>>;
  updateRateLimits: (limits: Record<string, [number, number]>) => Promise<void>;
  listVendorsAdmin: (params?: { status?: string; page?: number; page_size?: number }) => Promise<VendorListResponse>;
  approveVendor: (vendorId: string) => Promise<void>;
  rejectVendor: (vendorId: string, reason: string) => Promise<void>;
  suspendVendor: (vendorId: string, reason: string) => Promise<void>;
  reactivateVendor: (vendorId: string) => Promise<void>;

  loginWithRole: (credentials: LoginCredentials, mode: LoginMode) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  setDemoCustomer: () => void;
  setDemoVendor: () => void;
  setCheckoutEmail: (email: string) => void;
  setCheckoutStep: (step: CheckoutStep) => void;
  setOTPVerified: (user?: AuthUser) => void;
  completeCheckoutProfile: (profile: Partial<AuthUser>) => void;
  resetCheckout: () => void;
  getDashboardRoute: () => string;

  setUser: (user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  setHydrated: () => void;

  isAdmin: () => boolean;
  isVendor: () => boolean;
  isCustomer: () => boolean;
  apiFetch: (endpoint: string, init?: RequestInit) => Promise<Response>;
}

function normalizeUser(user: any): any {
  if (!user || typeof user !== 'object') return user;
  const normalized = { ...user };
  if ('is_vendor_verified' in normalized && !('isVendorVerified' in normalized)) {
    normalized.isVendorVerified = normalized.is_vendor_verified;
  }
  if ('isVendorVerified' in normalized && !('is_vendor_verified' in normalized)) {
    normalized.is_vendor_verified = normalized.isVendorVerified;
  }
  if ('first_name' in normalized && !('firstName' in normalized)) {
    normalized.firstName = normalized.first_name;
  }
  if ('last_name' in normalized && !('lastName' in normalized)) {
    normalized.lastName = normalized.last_name;
  }
  return normalized;
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

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setError: (error) => set({ error }),

      setLoading: (loading) => set({ isLoading: loading }),

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
          apiClient.syncAuthCookie(null);
        }
      },

      login: async (credentials, mode = 'customer') => {
        console.log('🔐 [AuthStore] Login started:', { email: credentials.email, mode });
        set({ isLoading: true, error: null });
        try {
          const device_id = credentials.device_id || getOrCreateDeviceId();
          const device_name = credentials.device_name || getDeviceName();

          const result = await apiClient.post<any>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
            device_id,
            device_name,
            remember_me: credentials.rememberMe || false,
          });

          // Handle potentially wrapped response {"success": true, "data": {...}}
          const responseData = result && typeof result === 'object' && 'success' in result && 'data' in result && result.success === true ? result.data : result;

          console.log('✅ [AuthStore] Login API response received:', {
            user: responseData.user?.email,
            hasAccessToken: !!responseData.access_token,
            hasRefreshToken: !!responseData.refresh_token,
            expiresIn: responseData.expires_in,
          });

          const expiresIn = (responseData.expires_in || 1800) * 1000;
          const tokenExpiry = Date.now() + expiresIn;

          if (typeof window !== 'undefined') {
            if (responseData.refresh_token) {
              localStorage.setItem('refresh_token', responseData.refresh_token);
              console.log('💾 [AuthStore] Refresh token saved to localStorage');
            }
            setToken(responseData.access_token);
            apiClient.syncAuthCookie(responseData.access_token);
          }

          const normalizedUser = normalizeUser(responseData.user);

          set({
            user: normalizedUser,
            accessToken: responseData.access_token,
            tokenExpiry,
            isAuthenticated: true,
            isLoading: false,
            lastValidated: Date.now(),
          });

          console.log('✅ [AuthStore] Login successful, auth state updated:', {
            isAuthenticated: true,
            user: normalizedUser,
            userEmail: normalizedUser?.email,
            userKeys: normalizedUser ? Object.keys(normalizedUser) : [],
          });
          toast.success('Login successful!');
        } catch (error: any) {
          console.error('❌ [AuthStore] Login failed:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      loginWithOTP: async (email, code) => {
        set({ isLoading: true, error: null });
        try {
          const device_id = getOrCreateDeviceId();
          const device_name = getDeviceName();

          const result = await apiClient.post<any>('/auth/login/otp', {
            email,
            code,
            device_id,
            device_name,
          });

          // Handle potentially wrapped response {"success": true, "data": {...}}
          const responseData = result && typeof result === 'object' && 'success' in result && 'data' in result && result.success === true ? result.data : result;

          const expiresIn = (responseData.expires_in || 1800) * 1000;
          const tokenExpiry = Date.now() + expiresIn;

          if (typeof window !== 'undefined') {
            if (responseData.refresh_token) {
              localStorage.setItem('refresh_token', responseData.refresh_token);
            }
            setToken(responseData.access_token);
            apiClient.syncAuthCookie(responseData.access_token);
          }

          const normalizedUser = normalizeUser(responseData.user);

          set({
            user: normalizedUser,
            accessToken: responseData.access_token,
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
          const response = await apiClient.post<any>('/auth/register/vendor', data);
          set({ isLoading: false });
          toast.success('Vendor application submitted! Our team will review it.');
          return response;
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

      getRateLimits: async () => {
        try {
          const result = await apiClient.get<Record<string, [number, number]>>('/admin/system/rate-limits');
          return result;
        } catch (error: any) {
          toast.error('Failed to fetch rate limits');
          throw error;
        }
      },

      updateRateLimits: async (limits) => {
        try {
          await apiClient.put('/admin/system/rate-limits', limits);
          toast.success('Rate limits updated successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to update rate limits');
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
        if (get().isDemo) {
          return true;
        }
        try {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
          if (!refreshToken) {
            // Don't clear auth - user might still be authenticated with a valid access token
            // Let API requests handle 401s which will trigger proper logout
            return false;
          }

          // Use fetch directly for token refresh to avoid logging out users on temporary network failure.
          // For client-side, leverage rewrites. For server-side (SSR), use full URL.
          const apiPrefix = typeof window === 'undefined'
            ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
            : '';

          const response = await fetch(`${apiPrefix}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (response.ok) {
            const result = await response.json();
            // Handle potentially wrapped response {"success": true, "data": {...}}
            const data = result && typeof result === 'object' && 'success' in result && 'data' in result && result.success === true ? result.data : result;
            const expiresIn = (data.expires_in || 1800) * 1000;
            const tokenExpiry = Date.now() + expiresIn;

            if (typeof window !== 'undefined') {
              localStorage.setItem('refresh_token', data.refresh_token);
              setToken(data.access_token);
              apiClient.syncAuthCookie(data.access_token);
            }

            set({
              accessToken: data.access_token,
              tokenExpiry,
              lastValidated: Date.now(),
            });

            return true;
          } else {
            // Only clear auth on specific client errors (400, 401, 403) indicating invalid/expired token.
            // Avoid logging out user on 5xx server errors.
            if (response.status === 400 || response.status === 401 || response.status === 403) {
              get().clearAuth();
            }
            return false;
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Do not call clearAuth() on network/fetch errors to prevent premature logout.
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

      loginWithRole: async (credentials, mode) => {
        await get().login(credentials, mode);
        const user = get().user;
        if (user && user.role !== mode && mode !== 'customer') {
          const expected = mode === 'admin' ? 'admin' : 'vendor';
          if (user.role !== expected && !(mode === 'admin' && user.role === 'worker')) {
            get().clearAuth();
            throw new Error(`Access denied. ${expected} account required.`);
          }
        }
      },

      requestPasswordReset: async (email: string) => {
        return get().forgotPassword(email);
      },

      setDemoCustomer: () => {
        set({
          user: DEMO_CUSTOMER,
          accessToken: 'demo-customer-token',
          tokenExpiry: Date.now() + 3600 * 1000,
          isAuthenticated: true,
          isDemo: true,
        });
        if (typeof window !== 'undefined') {
          setToken('demo-customer-token');
          apiClient.syncAuthCookie('demo-customer-token');
        }
      },

      setDemoVendor: () => {
        set({
          user: DEMO_VENDOR,
          accessToken: 'demo-vendor-token',
          tokenExpiry: Date.now() + 3600 * 1000,
          isAuthenticated: true,
          isDemo: true,
        });
        if (typeof window !== 'undefined') {
          setToken('demo-vendor-token');
          apiClient.syncAuthCookie('demo-vendor-token');
        }
      },

      setCheckoutEmail: (email) =>
        set({
          user: { email } as AuthUser,
          checkoutStep: 'otp',
          error: null,
        }),

      setCheckoutStep: (step) =>
        set({ checkoutStep: step, error: null }),

      setOTPVerified: (user) => {
        if (user) {
          const displayName =
            user.displayName ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            user.email?.split('@')[0] ||
            'Guest User';

          set({
            user: { ...user, displayName },
            checkoutStep: 'complete',
            isAuthenticated: true,
            isDemo: true,
            error: null,
          });
        } else {
          set({ checkoutStep: 'profile', error: null });
        }
      },

      completeCheckoutProfile: (profile) => {
        const currentUser = get().user;
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        const displayName =
          profile.displayName || `${firstName} ${lastName}`.trim() || 'Guest User';

        const updatedUser = {
          ...currentUser,
          ...profile,
          displayName,
          firstName,
          lastName,
        };

        set({
          user: updatedUser as AuthUser,
          checkoutStep: 'complete',
          isAuthenticated: true,
          isDemo: true,
          error: null,
        });
      },

      resetCheckout: () =>
        set({ checkoutStep: undefined }),

      getDashboardRoute: () => {
        const state = get();
        if (!state.user) return '/';
        if (state.isAdmin()) return '/admin/dashboard';
        if (state.isVendor()) return '/vendor/dashboard';
        return '/dashboard';
      },

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
      partialize: (state) => {
        const partial = {
          user: state.user,
          // Exclude accessToken and tokenExpiry for security (memory-only storage)
          isAuthenticated: state.isAuthenticated,
          isDemo: state.isDemo,
          vendorStatus: state.vendorStatus,
        };
        console.log('💾 [AuthStore] Persisting state:', {
          hasUser: !!partial.user,
          userEmail: partial.user?.email,
          isAuthenticated: partial.isAuthenticated,
        });
        return partial;
      },
      onRehydrateStorage: () => (state) => {
        // Debug: Check what's in localStorage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('auth-storage');
            console.log('📦 [AuthStore] Raw localStorage data:', stored ? `${stored.substring(0, 100)}...` : 'null');
            if (stored) {
              const parsed = JSON.parse(stored);
              console.log('📦 [AuthStore] Parsed localStorage:', {
                hasState: !!parsed.state,
                hasUser: !!parsed.state?.user,
                userEmail: parsed.state?.user?.email,
                isAuthenticated: parsed.state?.isAuthenticated,
              });
            }
          } catch (e) {
            console.error('📦 [AuthStore] Failed to read localStorage:', e);
          }
        }

        console.log('🔄 [AuthStore] Rehydration started:', {
          hasState: !!state,
          isAuthenticated: state?.isAuthenticated,
          user: state?.user,
          userEmail: state?.user?.email,
          isDemo: state?.isDemo,
        });

        // After hydration, set hydrated immediately to allow UI to render
        state?.setHydrated();

        // Then attempt to refresh the access token in background if user is authenticated
        // Don't clear auth on refresh failure - user remains authenticated with persisted state
        if (state && state.isAuthenticated && state.user && !state.isDemo) {
          console.log('🔑 [AuthStore] Attempting background token refresh for user:', state.user.email);
          state.refreshAccessToken().catch((err) => {
            console.warn('⚠️ [AuthStore] Token refresh failed on rehydration, but user remains authenticated:', err);
            // Don't clear auth - let the API requests handle 401s with token refresh
          });
        } else {
          console.log('✅ [AuthStore] Rehydration complete, no token refresh needed');
        }
      },
    }
  )
);

// Handle session expired event globally to sync store state
if (typeof window !== 'undefined') {
  window.addEventListener('auth:session-expired', () => {
    console.log('🚨 [AuthStore] session-expired event received, updating isAuthenticated to false');
    useAuthStore.setState({ isAuthenticated: false });
  });
}

