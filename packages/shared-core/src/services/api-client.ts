import { toast } from 'sonner';
import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

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

      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
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

          return await this.parseResponse<T>(response);
        } catch (error) {
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

    let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${API_PREFIX}${endpoint}`;
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

      throw new Error(errorMessage);
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

  handleAuthFailure(): void {
    tokenManager.clearRefreshToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  },
};
