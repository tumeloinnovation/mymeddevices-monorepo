'use client';

export type UserRole = 'admin' | 'worker' | 'vendor' | 'customer';
export type LoginMode = 'admin' | 'vendor' | 'customer';
export type CheckoutStep = 'email' | 'login' | 'otp' | 'profile' | 'complete';

export interface BaseUser {
  id: number | string;
  email: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  displayName?: string;
  isVendor?: boolean;
  isVendorVerified?: boolean;
}

export interface AdminUser extends BaseUser {
  role: 'admin' | 'worker';
}

export interface VendorUser extends BaseUser {
  role: 'vendor';
  store_name?: string;
  permissions?: string[];
}

export interface CustomerUser extends BaseUser {
  role: 'customer';
  wooCustomerId?: number;
}

export type AuthUser = AdminUser | VendorUser | CustomerUser;

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  device_id?: string;
  device_name?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  vatNumber?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in: number;
  user: AuthUser;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: any;
}

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
}

export interface SessionExpiredDetail {
  errorCode?: string;
  errorMessage?: string;
}
