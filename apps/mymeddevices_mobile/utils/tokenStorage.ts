import * as SecureStore from "expo-secure-store";

export const ACCESS_TOKEN_KEY = "auth_access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";
export const USER_KEY = "auth_user";

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Low-level SecureStore getters/setters
 */
export const setSecureItem = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};

export const deleteSecureItem = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};

/**
 * High-level typed Auth Token Storage
 */
export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    return await getSecureItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken: async (token: string): Promise<void> => {
    await setSecureItem(ACCESS_TOKEN_KEY, token);
  },
  deleteAccessToken: async (): Promise<void> => {
    await deleteSecureItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await getSecureItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken: async (token: string): Promise<void> => {
    await setSecureItem(REFRESH_TOKEN_KEY, token);
  },
  deleteRefreshToken: async (): Promise<void> => {
    await deleteSecureItem(REFRESH_TOKEN_KEY);
  },

  getUser: async <T = any>(): Promise<T | null> => {
    try {
      const userStr = await getSecureItem(USER_KEY);
      return userStr ? (JSON.parse(userStr) as T) : null;
    } catch {
      return null;
    }
  },
  setUser: async <T = any>(user: T): Promise<void> => {
    await setSecureItem(USER_KEY, JSON.stringify(user));
  },
  deleteUser: async (): Promise<void> => {
    await deleteSecureItem(USER_KEY);
  },

  storeAuthSession: async <T = any>(
    accessToken: string,
    refreshToken: string,
    user: T
  ): Promise<void> => {
    await Promise.all([
      setSecureItem(ACCESS_TOKEN_KEY, accessToken),
      setSecureItem(REFRESH_TOKEN_KEY, refreshToken),
      setSecureItem(USER_KEY, JSON.stringify(user)),
    ]);
  },

  clearAuthSession: async (): Promise<void> => {
    await Promise.all([
      deleteSecureItem(ACCESS_TOKEN_KEY),
      deleteSecureItem(REFRESH_TOKEN_KEY),
      deleteSecureItem(USER_KEY),
    ]);
  },
};

export default tokenStorage;
