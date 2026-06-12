/**
 * Token storage and accessor for API client.
 *
 * This module provides a simple interface for storing and retrieving access tokens
 * outside of the zustand persist storage to avoid circular dependencies.
 * The access token is stored in memory-only in zustand, but we also cache it here
 * for the api-client to access.
 */

const ACCESS_TOKEN_KEY = 'auth_access_token';

/**
 * Get the current access token.
 * Returns null if not found.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the access token.
 */
export function setAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to store access token:', error);
  }
}

/**
 * Clear the access token.
 */
export function clearAccessToken(): void {
  setAccessToken(null);
}
