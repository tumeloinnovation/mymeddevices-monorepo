import { toast } from 'sonner';
import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/token';

// For browser/client-side requests, use relative path to leverage Next.js rewrites
// For server-side requests (SSR), use the full backend URL
const API_URL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : '';
const API_PREFIX = '/api/v1';

// Get base URL - for client-side, prefix is already handled by Next.js rewrites
// For server-side, we need the full URL
function getBaseUrl(): string {
  const isTestOrSsr =
    typeof window === 'undefined' ||
    !window.location ||
    !window.location.origin ||
    window.location.origin === 'null' ||
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  if (isTestOrSsr) {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${base}${API_PREFIX}`;
  }
  return API_PREFIX;
}


type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiClientConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  skipAuth?: boolean;
  signal?: AbortSignal;
  params?: object;
}

interface ApiRequestOptions extends ApiClientConfig {
  endpoint: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  error_code?: string;
  detail?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

function sanitize(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(sanitize);
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = ['password', 'password_hash', 'otp', 'token', 'refresh_token', 'access_token', 'code', 'credentials'];
  for (const key of Object.keys(val)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitize(val[key]);
    }
  }
  return sanitized;
}

class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;

  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (!refreshToken) {
        return null;
      }

      // Use full URL for server-side, relative for client-side (via Next.js rewrites)
      const refreshUrl = typeof window === 'undefined'
        ? `${API_URL}${API_PREFIX}/auth/refresh`
        : `/auth/refresh`;

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const result = await response.json();
        const data: RefreshTokenResponse = result.data || result;

        if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', data.refresh_token);
            setAccessToken(data.access_token);
            // Keep the auth store + auth_token cookie in sync with this refresh so
            // validateSession / SSR proxy don't keep using a stale token/expiry.
            window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
              detail: { accessToken: data.access_token, expiresIn: data.expires_in },
            }));
        }

        return data.access_token;
      } else {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('refresh_token');
            clearAccessToken();
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  clearRefreshToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token');
        clearAccessToken();
    }
  }
}

const tokenManager = new TokenManager();

class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

const deduplicator = new RequestDeduplicator();

export const apiClient = {
  async get<T>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'GET', ...config });
  },

  async post<T>(endpoint: string, data: any, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'POST', body: data, ...config });
  },

  async patch<T>(endpoint: string, data: any, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'PATCH', body: data, ...config });
  },

  async put<T>(endpoint: string, data: any, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'PUT', body: data, ...config });
  },

  async delete<T>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'DELETE', ...config });
  },

  async request<T>(options: ApiRequestOptions): Promise<T> {
    const deduplicationKey = this.getDeduplicationKey(options);

    return deduplicator.deduplicate(deduplicationKey, async () => {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          const response = await this.rawRequest(options);
          
          if (response.status === 401 && attempts === 0) {
            const newToken = await tokenManager.refreshAccessToken();
            if (newToken) {
              attempts++;
              continue;
            } else {
              this.handleAuthFailure();
              throw new Error('Session expired. Please login again.');
            }
          }

          const isAuthOrOtp = options.endpoint.includes('/auth/') || options.endpoint.includes('/otp/');
          let responseData: any = null;
          if (isAuthOrOtp && response.ok) {
            try {
              const clone = response.clone();
              const contentType = response.headers.get('content-type');
              if (contentType?.includes('application/json')) {
                responseData = await clone.json();
              } else {
                responseData = await clone.text();
              }
            } catch (e) {
              responseData = 'Unparseable response body';
            }
          }

          if (isAuthOrOtp) {
            console.log(`[AUTH LOG] Request details:`, {
              endpoint: options.endpoint,
              payload: sanitize(options.body || options.params || null),
              status: response.status,
              response: sanitize(responseData),
            });
          }

          return await this.parseResponse<T>(response);
        } catch (error: any) {
          const isAuthOrOtp = options.endpoint.includes('/auth/') || options.endpoint.includes('/otp/');
          if (isAuthOrOtp) {
            console.log(`[AUTH LOG] Request failed:`, {
              endpoint: options.endpoint,
              payload: sanitize(options.body || options.params || null),
              status: error.status || 'unknown',
              response: sanitize(error.message || error),
            });
          }
          // Do not retry client-side 4xx errors (e.g. validation, forbidden, bad request)
          if (error.status && error.status >= 400 && error.status < 500) {
            throw error;
          }
          if (attempts === maxAttempts - 1) {
            throw error;
          }
          attempts++;
        }
      }


      throw new Error('Request failed after retry');
    });
  },

  async rawRequest(options: ApiRequestOptions): Promise<Response> {
    const {
      endpoint,
      method = 'GET',
      headers = {},
      body,
      skipAuth = false,
      signal,
      params,
    } = options;

    let url = endpoint.startsWith('http') ? endpoint : `${getBaseUrl()}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add Authorization header if not skipping auth
    if (!skipAuth) {
      const token = getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include',
      signal,
    };

    if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
      if (body instanceof FormData) {
        config.body = body;
        delete requestHeaders['Content-Type'];
      } else {
        config.body = JSON.stringify(body);
      }
    }

    return fetch(url, config);
  },

  async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData = await response.json();
        // Handle Pydantic validation errors which can be objects or arrays
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.error === 'object' && errorData.error.msg) {
            // Pydantic error object
            errorMessage = errorData.error.msg;
          } else if (Array.isArray(errorData.error)) {
            // Array of validation errors
            errorMessage = errorData.error.map((e: any) =>
              typeof e === 'string' ? e : e.msg || JSON.stringify(e)
            ).join(', ');
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((e: any) => {
              if (typeof e === 'string') return e;
              const field = e.loc ? e.loc[e.loc.length - 1] : '';
              return `${field ? field + ': ' : ''}${e.msg || JSON.stringify(e)}`;
            }).join(', ');
          } else if (typeof errorData.detail === 'object' && errorData.detail.error) {
            errorMessage = errorData.detail.error;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        }
      } catch {
        // use default
      }

      if (response.status === 429) {
        const rateLimitMessage = 'Too many attempts. Please wait a moment before trying again.';
        toast.error(rateLimitMessage);
        throw new Error(rateLimitMessage);
      }

      if (response.status !== 401) {
        toast.error(String(errorMessage));
      }

      const err: any = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }


    if (contentType?.includes('application/json')) {
      const json = await response.json();

      // Handle wrapped response format { success: true, data: {...} }
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        if (json.success === true) {
          return json.data as T;
        }
        // If success is false, this is an error response
        throw new Error(json.error || 'Request failed');
      }

      return json;
    }

    return response.text() as unknown as T;
  },

  getDeduplicationKey(options: ApiRequestOptions): string {
    const { endpoint, method = 'GET' } = options;
    if (method !== 'GET') {
      return `${Date.now()}-${Math.random()}`;
    }
    return `${method}:${endpoint}:${JSON.stringify(options.params)}`;
  },

  /**
   * Synchronize auth token to cookie for SSR middleware compatibility
   */
  syncAuthCookie(accessToken: string | null): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if (!accessToken) {
      document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
      return;
    }

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    let maxAge = 86400 * 7; // Default 7 days

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.exp) {
        const expMs = payload.exp * 1000;
        maxAge = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      }
    } catch {
      // Keep default maxAge
    }

    document.cookie = `auth_token=${accessToken}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  },

  handleAuthFailure(): void {
    tokenManager.clearRefreshToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      clearAccessToken();
      this.syncAuthCookie(null);
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  },
};

/**
 * Check if backend API is reachable
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const url = typeof window === 'undefined' ? `${API_URL}/health` : '/health';
    const response = await fetch(url, { credentials: 'include' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get API base URL
 */
export function getApiUrl(): string {
  return API_URL;
}

export class AuthExpiredError extends Error {
  name = 'AuthExpiredError';
  code?: string;
  isRefreshError?: boolean;

  constructor(
    message: string = 'Session expired. Please login again.',
    code?: string,
    isRefreshError: boolean = false
  ) {
    super(message);
    this.code = code;
    this.isRefreshError = isRefreshError;
    Object.setPrototypeOf(this, AuthExpiredError.prototype);
  }
}

export function isAuthExpiredError(error: unknown): error is AuthExpiredError {
  return error instanceof Error && error.name === 'AuthExpiredError';
}

