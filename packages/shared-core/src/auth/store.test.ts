// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './store';
import { apiClient } from '../services/api-client';

describe('useAuthStore (Authentication & Role Management)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('1. initializes with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isDemo).toBe(false);
  });

  it('2. performs real API login, sets access token and normalizes user object', async () => {
    const mockApiResponse = {
      user: {
        id: 'usr-99',
        email: 'doctor@nairobi-hospital.org',
        role: 'customer',
        firstName: 'Dr. Jane',
        lastName: 'Kariuki',
      },
      tokens: {
        access_token: 'valid-access-jwt',
        refresh_token: 'valid-refresh-jwt',
        expires_in: 3600,
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockApiResponse);

    await useAuthStore.getState().login(
      { email: 'doctor@nairobi-hospital.org', password: 'SecurePassword123!' },
      'customer'
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isDemo).toBe(false);
    expect(state.user?.email).toBe('doctor@nairobi-hospital.org');
    expect(state.accessToken).toBe('valid-access-jwt');
  });

  it('3. rejects invalid credentials with error message', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Invalid email or password'));

    await expect(
      useAuthStore.getState().login(
        { email: 'invalid@example.com', password: 'wrongpassword' },
        'customer'
      )
    ).rejects.toThrow('Invalid email or password');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid email or password');
  });

  it('4. completely resets authentication state upon logout', async () => {
    const mockApiResponse = {
      user: {
        id: 'usr-1',
        email: 'user@example.com',
        role: 'customer',
      },
      tokens: {
        access_token: 'valid-jwt',
        refresh_token: 'valid-refresh',
        expires_in: 3600,
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockApiResponse);
    await useAuthStore.getState().login({ email: 'user@example.com', password: 'password123' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isDemo).toBe(false);
  });
});
