'use client';

import { useAuthStore } from '../store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { AuthUser, LoginCredentials, RegisterData, LoginMode } from '../../auth/types';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithRole: (credentials: LoginCredentials, mode: LoginMode) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  verifyOTP: (userId: string, code: string, purpose: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  isVendor: () => boolean;
  isCustomer: () => boolean;
  isAdmin: () => boolean;
  getDashboardRoute: () => string;
}

export function useAuth(): UseAuthReturn {
  const authStore = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      authStore.error &&
      authStore.error.includes('Session expired') &&
      pathname !== '/login'
    ) {
      router.push('/login');
    }
  }, [authStore.error, pathname, router]);

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    isDemo: authStore.isDemo || false,
    error: authStore.error,

    login: authStore.login,
    loginWithRole: authStore.loginWithRole,
    logout: authStore.logout,
    register: authStore.register,
    verifyOTP: authStore.verifyOTP,
    requestPasswordReset: authStore.requestPasswordReset,
    resetPassword: async (token: string, newPassword: string) => {
      return authStore.resetPassword(token, newPassword, '');
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      return authStore.changePassword({ old_password: currentPassword, new_password: newPassword });
    },

    isVendor: authStore.isVendor,
    isCustomer: authStore.isCustomer,
    isAdmin: authStore.isAdmin,
    getDashboardRoute: authStore.getDashboardRoute,
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register') {
      return;
    }
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return { isAuthenticated, isLoading, user };
}

interface UseRoleAccessReturn {
  hasAccess: boolean;
  isLoading: boolean;
  requiredRole: string;
  userRoles: string[];
}

export function useRoleAccess(requiredRole: string): UseRoleAccessReturn {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userRoles: string[] = user?.role ? [user.role] : [];
  const hasAccess = isAuthenticated && userRoles.includes(requiredRole);

  return { hasAccess, isLoading, requiredRole, userRoles };
}

export function useVendorAccess() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isVendor = isAuthenticated && (user?.role === 'vendor');

  return { isVendor, isLoading, isAuthenticated };
}

export function useCustomerAccess() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isCustomer = isAuthenticated && user?.role === 'customer';

  return { isCustomer, isLoading, isAuthenticated };
}

export function useAdminAccess() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'worker');

  return { isAdmin, isLoading, isAuthenticated };
}

export function useSessionValidation(intervalMs: number = 5 * 60 * 1000) {
  const { isAuthenticated, isDemo } = useAuth();
  const authStore = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || isDemo) return;

    authStore.validateSession();

    const interval = setInterval(() => {
      authStore.validateSession();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isAuthenticated, isDemo, authStore, intervalMs]);
}

export type { UseAuthReturn, UseRoleAccessReturn };
