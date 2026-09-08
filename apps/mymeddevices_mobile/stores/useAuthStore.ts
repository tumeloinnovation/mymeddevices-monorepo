import { create } from 'zustand';
import { AuthUser, AuthState, UpdateUserRequest } from '@/types/auth';
import { Customer } from '@/types/user';
import { authService } from '@/services/auth.service';
import { customerApi } from '@/features/user/services/customer.api';
import { clearLocalAppCache } from '@/services/appCache.service';
import { syncOneSignalUser, logoutOneSignalUser } from '@/services/notification.service';

export function mergeCustomerIntoUser(user: AuthUser, customer: Customer): AuthUser {
  return {
    ...user,
    first_name: customer.first_name || user.first_name,
    last_name: customer.last_name || user.last_name,
    avatar_url: customer.avatar_url || user.avatar_url,
    billing: customer.billing || user.billing,
    shipping: customer.shipping || user.shipping,
  };
}

interface AuthStore extends AuthState {
  customer: Customer | null;
  setUser: (user: AuthUser | null) => void;
  setCustomer: (customer: Customer | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetAuthState: () => void;
  updateUserData: (data: UpdateUserRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  customer: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setCustomer: (customer) =>
    set({
      customer,
    }),

  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setInitialized: (initialized) =>
    set({
      isInitialized: initialized,
    }),

  initialize: async () => {
    const { setUser, setCustomer, setTokens, setInitialized, setLoading } = get();
    
    setLoading(true);
    
    try {
      const accessToken = await authService.getStoredAccessToken();
      
      if (!accessToken) {
        setInitialized(true);
        setLoading(false);
        return;
      }

      // Check if token is expired and try to refresh
      if (authService.isTokenExpired(accessToken)) {
        const refreshResult = await authService.refreshToken();
        if (!refreshResult) {
          await authService.clearAuth();
          setInitialized(true);
          setLoading(false);
          return;
        }
        setTokens(refreshResult.access_token, refreshResult.refresh_token);
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);
        setInitialized(true);
        setLoading(false);
        return;
      }

      const refreshToken = await authService.getStoredRefreshToken();
      const user = await authService.getStoredUser();
      
      if (user) {
        setTokens(accessToken, refreshToken);
        setUser(user);
        
        if (user?.id) {
          try {
            const customer = await customerApi.getCustomer(user.id);
            if (customer) {
              setCustomer(customer);
              setUser(mergeCustomerIntoUser(user, customer));
            }
          } catch (error) {
            console.warn('Failed to fetch customer data on initialize:', error);
          }
        }
      } else {
        const fetchedUser = await authService.getCurrentUser();
        if (fetchedUser) {
          setTokens(accessToken, refreshToken);
          setUser(fetchedUser);
          
          try {
            const customer = await customerApi.getCustomer(fetchedUser.id);
            if (customer) {
              setCustomer(customer);
              setUser(mergeCustomerIntoUser(fetchedUser, customer));
            }
          } catch (error) {
            console.warn('Failed to fetch customer data on initialize:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await authService.clearAuth();
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  },

  login: async (username: string, password: string) => {
    const { setUser, setCustomer, setTokens, setLoading } = get();
    
    setLoading(true);
    
    try {
      const response = await authService.login({ username, password });
      
      if (response.success && response.data) {
        setTokens(response.data.access_token, response.data.refresh_token);
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);
        
        if (storedUser?.id) {
          void syncOneSignalUser(storedUser.id, storedUser.email);
          try {
            const customer = await customerApi.getCustomer(storedUser.id);
            if (customer) {
              setCustomer(customer);
              setUser(mergeCustomerIntoUser(storedUser, customer));
            }
          } catch (error) {
            console.warn('Failed to fetch customer data after login:', error);
          }
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  },

  logout: async () => {
    const { resetAuthState, setLoading } = get();
    
    setLoading(true);
    try {
      void logoutOneSignalUser();
      await authService.logout();
      await clearLocalAppCache();
      resetAuthState();
    } catch (error) {
      console.error('Logout error:', error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  },

  resetAuthState: () =>
    set({
      user: null,
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  updateUserData: async (data: UpdateUserRequest) => {
    const { setUser, setLoading } = get();
    
    setLoading(true);
    
    try {
      const updatedUser = await authService.updateUser(data);
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  },

  refreshUser: async () => {
    const { setUser, setCustomer, setLoading } = get();
    
    setLoading(true);
    
    try {
      const refreshedUser = await authService.getCurrentUser();
      if (refreshedUser) {
        setUser(refreshedUser);
        
        if (refreshedUser?.id) {
          try {
            const customer = await customerApi.getCustomer(refreshedUser.id);
            if (customer) {
              setCustomer(customer);
              setUser(mergeCustomerIntoUser(refreshedUser, customer));
            }
          } catch (error) {
            console.warn('Failed to refresh customer data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setLoading(false);
    }
  },
}));
