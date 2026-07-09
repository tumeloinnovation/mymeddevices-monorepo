import { toast } from 'sonner';
import { getAccessToken, setAccessToken, clearAccessToken } from '../../auth/token';

// For browser/client-side requests, use relative path to leverage Next.js rewrites
// For server-side requests (SSR), use the full backend URL
const API_URL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : '';
const API_PREFIX = '/api/v1';

// ============================================================================
// Types
// ============================================================================

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ApiClientConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  data?: any;
  skipAuth?: boolean;
  skipCSRF?: boolean;
  signal?: AbortSignal;
  params?: object;
}

interface ApiRequestOptions extends ApiClientConfig {
  endpoint: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  error_code?: string;
  detail?: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

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

// ============================================================================
// CSRF Token Management
// ============================================================================

class CSRFTokenManager {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private fetching: boolean = false;

  async getToken(): Promise<string | null> {
    // Skip CSRF in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Return cached token if still valid (5 minutes)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Prevent concurrent fetches
    if (this.fetching) {
      return this.token; // Return old token while fetching new one
    }

    try {
      this.fetching = true;
      const response = await fetch(`${API_URL}${API_PREFIX}/csrf-token`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data?.data?.csrf_token || data?.csrf_token;
        this.tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
        return this.token;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    } finally {
      this.fetching = false;
    }

    return null;
  }

  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}

const csrfManager = new CSRFTokenManager();

// ============================================================================
// Refresh Token Management
// ============================================================================

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;

  async refreshAccessToken(): Promise<string | null> {
    // Prevent concurrent refresh attempts
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
      // Get refresh token from localStorage
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${API_URL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const result = await response.json();
        const data: RefreshTokenResponse = result.data;

        // Store new access token
        setAccessToken(data.access_token);

        // Store new refresh token
        localStorage.setItem('refresh_token', data.refresh_token);

        return data.access_token;
      } else {
        // Refresh token is invalid or expired
        localStorage.removeItem('refresh_token');
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  clearRefreshToken(): void {
    localStorage.removeItem('refresh_token');
  }
}

const tokenManager = new TokenManager();

// ============================================================================
// Request Deduplication
// ============================================================================

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

// ============================================================================
// API Client
// ============================================================================

/**
 * Production-ready API client for backend integration
 *
 * Features:
 * - Automatic CSRF token handling
 * - JWT access token injection
 * - Refresh token rotation on 401
 * - Request deduplication
 * - AbortController support
 * - Error handling with toast notifications
 * - Query parameter serialization
 */
export const apiClient = {
  /**
   * Make an authenticated GET request
   */
  async get<T>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'GET', ...config });
  },

  /**
   * Make an authenticated POST request
   */
  async post<T>(endpoint: string, data: any, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'POST', body: data, ...config });
  },

  /**
   * Make an authenticated PATCH request
   */
  async patch<T>(endpoint: string, data: any, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'PATCH', body: data, ...config });
  },

  /**
   * Make an authenticated PUT request
   */
  async put<T>(endpoint: string, data: any, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'PUT', body: data, ...config });
  },

  /**
   * Make an authenticated DELETE request
   */
  async delete<T>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return this.request<T>({ endpoint, method: 'DELETE', ...config });
  },

  /**
   * Upload a file with multipart/form-data
   */
  async upload<T>(
    endpoint: string,
    file: File | Blob,
    config: ApiClientConfig = {}
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<T>({
      endpoint,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - browser does it automatically with boundary
      },
      ...config,
    });
  },

  /**
   * Download a file
   */
  async download(
    endpoint: string,
    filename: string,
    config: ApiClientConfig = {}
  ): Promise<void> {
    const response = await this.rawRequest({
      endpoint,
      method: 'GET',
      ...config,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Core request method with authentication and error handling
   */
  async request<T>(options: ApiRequestOptions): Promise<T> {
    const deduplicationKey = this.getDeduplicationKey(options);

    return deduplicator.deduplicate(deduplicationKey, async () => {
      let attempts = 0;
      const maxAttempts = 2; // Original + 1 retry after refresh

      while (attempts < maxAttempts) {
        try {
          const response = await this.rawRequest(options);

          // Handle 401 with token refresh
          if (response.status === 401 && attempts === 0) {
            const newToken = await tokenManager.refreshAccessToken();
            if (newToken) {
              attempts++;
              continue; // Retry with new token
            } else {
              // No valid refresh token - user needs to login
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
              payload: sanitize(options.body || options.data || options.params || null),
              status: response.status,
              response: sanitize(responseData),
            });
          }

          const data = await this.parseResponse<T>(response);
          return data;
        } catch (error: any) {
          const isAuthOrOtp = options.endpoint.includes('/auth/') || options.endpoint.includes('/otp/');
          if (isAuthOrOtp) {
            console.log(`[AUTH LOG] Request failed:`, {
              endpoint: options.endpoint,
              payload: sanitize(options.body || options.data || options.params || null),
              status: error.status || 'unknown',
              response: sanitize(error.message || error),
            });
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

  /**
   * Make a raw request without response parsing
   */
  async rawRequest(options: ApiRequestOptions): Promise<Response> {
    const {
      endpoint,
      method = 'GET',
      headers = {},
      body,
      data,
      skipAuth = false,
      skipCSRF = false,
      signal,
      params,
    } = options;

    const requestBody = body || data;

    // Build URL with query parameters
    let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${API_PREFIX}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params as Record<string, string | number | boolean | undefined>).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add Authorization header if token exists and not skipped
    if (!skipAuth) {
      const token = getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add CSRF token for state-changing methods
    if (!skipCSRF && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const csrfToken = await csrfManager.getToken();
      if (csrfToken) {
        requestHeaders['X-CSRF-Token'] = csrfToken;
      }
    }

    // Prepare request config
    const config: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // Send cookies
      signal,
    };

    // Add body for methods that support it
    if (requestBody && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      if (requestBody instanceof FormData) {
        config.body = requestBody;
        delete requestHeaders['Content-Type']; // Let browser set it with boundary
      } else {
        config.body = JSON.stringify(requestBody);
      }
    }

    return fetch(url, config);
  },

  /**
   * Parse API response
   */
  async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.error === 'object' && errorData.error.msg) {
            errorMessage = errorData.error.msg;
          } else if (Array.isArray(errorData.error)) {
            errorMessage = errorData.error.map((e: any) =>
              typeof e === 'string' ? e : e.msg || JSON.stringify(e)
            ).join(', ');
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object' && errorData.detail.error) {
            errorMessage = errorData.detail.error;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((e: any) => {
              if (typeof e === 'string') return e;
              const loc = Array.isArray(e.loc) ? e.loc.join('.') : (e.loc || '');
              const field = loc ? `${loc}: ` : '';
              return `${field}${e.msg || 'Invalid value'}`;
            }).join(', ');
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        }
      } catch {
        // Use default error message
      }

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        const rateLimitMessage = 'Too many attempts. Please wait a moment before trying again.';
        toast.error(rateLimitMessage);
        throw new Error(rateLimitMessage);
      }

      // Show toast for non-401 errors
      if (response.status !== 401) {
        toast.error(errorMessage);
      }

      throw new Error(errorMessage);
    }

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  },

  /**
   * Get deduplication key for request
   */
  getDeduplicationKey(options: ApiRequestOptions): string {
    const { endpoint, method = 'GET', body } = options;

    // Only deduplicate GET requests
    if (method !== 'GET') {
      return `${Date.now()}-${Math.random()}`;
    }

    // For GET requests, include query params in key
    return `${method}:${endpoint}:${JSON.stringify(options.params)}`;
  },

  /**
   * Sync the access token to a cookie for SSR support
   */
  syncAuthCookie(accessToken: string | null): void {
    if (typeof window === 'undefined') return;

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    if (!accessToken) {
      document.cookie = `auth_token=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
      return;
    }

    // Standard max age (30 days) if we can't parse expiry from JWT
    let maxAge = 60 * 60 * 24 * 30;
    
    try {
      const payloadPart = accessToken.split('.')[1];
      if (payloadPart) {
        const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
        const payload = JSON.parse(atob(paddedPayload));
        if (typeof payload.exp === 'number') {
          maxAge = Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
        }
      }
    } catch (e) {
      console.warn('Failed to parse token expiry for cookie:', e);
    }

    document.cookie = `auth_token=${accessToken}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  },

  /**
   * Handle authentication failure
   */
  handleAuthFailure(): void {
    // Clear tokens
    tokenManager.clearRefreshToken();
    csrfManager.clearToken();
    
    // Also clear access token and cookie
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      clearAccessToken();
      this.syncAuthCookie(null);
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  },
};

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check if API is available
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const url = typeof window === 'undefined' ? `${API_URL}/health` : '/health';
    const response = await fetch(url, {
      credentials: 'include',
    });
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

// ============================================================================
// Export
// ============================================================================

// ============================================================================
// AuthExpiredError
// ============================================================================

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
  return (
    error instanceof Error &&
    error.name === 'AuthExpiredError'
  );
}

export type { ApiClientConfig, ApiErrorResponse, ApiSuccessResponse, ApiResponse };
