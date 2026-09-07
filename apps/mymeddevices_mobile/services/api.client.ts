/**
 * Primary Axios client configuration connecting to FastAPI backend
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { tokenStorage } from "@/utils/tokenStorage";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

function getDevHost(): string | undefined {
  if (typeof Constants.expoConfig?.hostUri === "string") {
    return Constants.expoConfig.hostUri.split(":")[0];
  }
  const manifest2 = (Constants as any).manifest2;
  if (manifest2?.extra?.expoGo?.debuggerHost) {
    return String(manifest2.extra.expoGo.debuggerHost).split(":")[0];
  }
  const manifest = (Constants as any).manifest;
  if (manifest?.debuggerHost) {
    return String(manifest.debuggerHost).split(":")[0];
  }
  const expoGoConfig = (Constants as any).expoGoConfig;
  if (expoGoConfig?.debuggerHost) {
    return String(expoGoConfig.debuggerHost).split(":")[0];
  }
  if (Constants.experienceUrl) {
    const match = Constants.experienceUrl.match(/:\/\/([^:/]+)/);
    if (match && match[1]) return match[1];
  }
  return undefined;
}

const explicitUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_MMD_API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL;

const devHost = getDevHost();
const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_BASE_URL =
  explicitUrl ||
  (devHost ? `http://${devHost}:8000/api/v1` : `http://${defaultHost}:8000/api/v1`);
/**
 * Primary FastAPI client for MyMedDevices
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Request interceptor: Attach JWT access token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Auto-refresh access token on 401 with request queueing
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const data = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken = data?.access_token;
        const newRefreshToken = data?.refresh_token;

        if (newAccessToken) {
          await tokenStorage.setAccessToken(newAccessToken);
          if (newRefreshToken) {
            await tokenStorage.setRefreshToken(newRefreshToken);
          }

          onTokenRefreshed(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch {
        await tokenStorage.clearAuthSession();
        refreshSubscribers = [];
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
