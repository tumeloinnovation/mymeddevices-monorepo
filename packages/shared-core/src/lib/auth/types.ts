'use client';

export * from '../../auth/types';

export interface AuthState {
  user: import('../../auth/types').AuthUser | null;
  accessToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
  hydrated: boolean;
  lastValidated: number | null;
  checkoutStep?: import('../../auth/types').CheckoutStep;
}

export interface SessionExpiredDetail {
  errorCode?: string;
  errorMessage?: string;
}
