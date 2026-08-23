// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, getApiUrl, healthCheck } from './api-client';
import * as tokenModule from '../auth/token';


describe('apiClient (Canonical API Client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. unwraps backend envelopes with { success: true, data: T } correctly', async () => {
    const mockData = { id: 101, title: 'Pulse Oximeter' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await apiClient.get<typeof mockData>('/catalog/products/101');
    expect(result).toEqual(mockData);
  });

  it('2. automatically attaches Bearer Authorization header when access token is present', async () => {
    vi.spyOn(tokenModule, 'getAccessToken').mockReturnValue('mock-jwt-token-xyz');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await apiClient.get('/users/me');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, config] = fetchSpy.mock.calls[0];
    expect((config?.headers as Record<string, string>)?.['Authorization']).toBe('Bearer mock-jwt-token-xyz');
  });

  it('3. omits Authorization header when skipAuth is true', async () => {
    vi.spyOn(tokenModule, 'getAccessToken').mockReturnValue('mock-jwt-token-xyz');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await apiClient.get('/catalog/public/categories', { skipAuth: true });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, config] = fetchSpy.mock.calls[0];
    expect((config?.headers as Record<string, string>)?.['Authorization']).toBeUndefined();
  });

  it('4. formats FastAPI/Pydantic validation error array into a readable message', async () => {
    const pydanticErrorResponse = {
      detail: [
        { loc: ['body', 'email'], msg: 'value is not a valid email address' },
        { loc: ['body', 'password'], msg: 'ensure this value has at least 8 characters' }
      ]
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(pydanticErrorResponse), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(apiClient.post('/auth/register', { email: 'bad' })).rejects.toThrow(
      'email: value is not a valid email address, password: ensure this value has at least 8 characters'
    );
  });

  it('5. deletes Content-Type header for FormData uploads to let browser set boundary', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: { url: '/uploads/image.png' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.png');

    await apiClient.post('/upload', formData);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, config] = fetchSpy.mock.calls[0];
    expect((config?.headers as Record<string, string>)?.['Content-Type']).toBeUndefined();
  });

  it('6. syncs auth cookie correctly when token is provided and cleared', () => {
    // Generate valid mock JWT payload { exp: timestamp }
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ exp: futureExp, sub: 'user-1' }));
    const mockJwt = `${header}.${payload}.signature`;

    apiClient.syncAuthCookie(mockJwt);
    expect(document.cookie).toContain('auth_token=');

    apiClient.syncAuthCookie(null);
    expect(document.cookie).not.toContain('auth_token=');
  });
});

