/**
 * Session Management for Vendor Web
 *
 * Handles authentication session, token storage, and user state for vendors.
 */

import { apiClient } from '../api/client';

export interface VendorUser {
  id: string;
  email: string;
  role: 'vendor';
  name?: string;
  store_name?: string;
  phone: string;
  is_active: boolean;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: VendorUser;
}

// Session keys for localStorage
const SESSION_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user', // Matching shared-core's persist key if applicable, or just standardizing
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : '/api/v1';

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(SESSION_KEYS.ACCESS_TOKEN);
}

/**
 * Get current session data
 */
export function getSession(): { user: VendorUser | null; accessToken: string | null } {
  if (typeof window === 'undefined') {
    return { user: null, accessToken: null };
  }

  const userJson = localStorage.getItem(SESSION_KEYS.USER);
  const accessToken = localStorage.getItem(SESSION_KEYS.ACCESS_TOKEN);

  let user: VendorUser | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user data', e);
    }
  }

  return { user, accessToken };
}

/**
 * Set session data after successful login
 */
export function setSession(data: LoginResponse): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, data.refresh_token);
  }
  if (data.user) {
    localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(data.user));
  }

  // Update API client with new token
  apiClient.setTokens(data.access_token, data.refresh_token);
}

/**
 * Clear session data (logout)
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(SESSION_KEYS.USER);

  // Clear API client tokens
  apiClient.clearTokens();
}

/**
 * Login vendor
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.detail || 'Login failed');
  }
  const data = result.data;

  // Verify user has vendor role
  if (data.user && data.user.role !== 'vendor') {
    throw new Error('Access denied. Vendor account required.');
  }

  setSession(data);
  return data;
}

/**
 * Register vendor
 */
export async function register(data: {
  email: string;
  password: string;
  phone: string;
  company_name: string;
  vat_number?: string;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/register/vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      phone: data.phone,
      company_name: data.company_name,
      vat_number: data.vat_number,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.detail || 'Registration failed');
  }
  return result;
}

/**
 * Verify OTP
 */
export async function verifyOtp(data: {
  userId: string;
  code: string;
  purpose: string;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: data.userId,
      code: data.code,
      purpose: data.purpose,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.detail || 'Verification failed');
  }
  return result;
}

/**
 * Request password reset link
 */
export async function forgotPassword(email: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.detail || 'Password reset request failed');
  }
  return result;
}

/**
 * Logout vendor
 */
export async function logout(): Promise<void> {
  try {
    const { accessToken } = getSession();
    if (accessToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout request failed', error);
  } finally {
    clearSession();
  }
}
