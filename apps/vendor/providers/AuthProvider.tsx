'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useSessionValidation } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  forceLogout: (expired?: boolean) => void;
  register: (data: { email: string; password: string; phone: string; company_name: string; vat_number?: string }) => Promise<any>;
  verifyOtp: (data: { userId: string; code: string; purpose: string }) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const store = useAuthStore();

  useSessionValidation(5 * 60 * 1000);

  // Synchronize Zustand tokens with local API client & cookies
  useEffect(() => {
    if (!store.hydrated) return;

    if (store.accessToken && store.isAuthenticated) {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : undefined;
      // Only sync tokens if a refresh token exists (prevents re-writing cleared tokens after session expiry)
      if (refreshToken) {
        apiClient.setTokens(store.accessToken, refreshToken);
      }
    } else if (!store.isAuthenticated) {
      apiClient.clearTokens();
    }
  }, [store.accessToken, store.isAuthenticated, store.hydrated]);

  const forceLogout = (expired: boolean = true) => {
    store.clearAuth();
    if (expired) {
      router.push('/login?expired=true');
    } else {
      router.push('/login');
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    return store.loginWithRole(
      { email: credentials.email, password: credentials.password },
      'vendor'
    );
  };

  const logout = async () => {
    await store.logout();
    router.push('/login');
  };

  const register = async (data: { email: string; password: string; phone: string; company_name: string; vat_number?: string }) => {
    return store.registerVendor({
      email: data.email,
      password: data.password,
      phone: data.phone,
      company_name: data.company_name,
      vat_number: data.vat_number,
    });
  };

  const verifyOtp = async (data: { userId: string; code: string; purpose: string }) => {
    return store.verifyOTP(data.userId, data.code, data.purpose);
  };

  const forgotPassword = async (email: string) => {
    return store.requestPasswordReset(email);
  };

  useEffect(() => {
    if (store.user && store.user.role !== 'vendor') {
      store.clearAuth();
      router.push('/login');
    }
  }, [store.user, router]);

  const value: AuthContextType = {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login,
    logout,
    forceLogout,
    register,
    verifyOtp,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
