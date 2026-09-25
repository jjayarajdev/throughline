import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse } from '@gigcruite/types';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Central HTTP client.
 *
 * Features:
 *   1. Reads VITE_API_URL (set by vite.config.ts from root .env.development).
 *   2. Attaches `Authorization: Bearer <accessToken>` from the auth store.
 *   3. On 401, performs a single-flight refresh via POST /auth/refresh
 *      (refresh token lives in an httpOnly cookie — hence withCredentials: true)
 *      and retries the original request once. Multiple concurrent 401s share
 *      the same in-flight promise to prevent a refresh storm.
 *   4. On refresh failure, clears auth state (caller can react via subscribe).
 *
 * Wave 2 note: /auth/refresh is not implemented until Wave 3, so the refresh
 * path will fail with 404 in development for now — which is the correct
 * logout-on-expiry behaviour.
 */

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send refresh cookie
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---- Request: attach Bearer token ----
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response: single-flight 401 refresh ----
type RetriableRequest = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  // Bare axios call (no interceptors) to avoid recursion.
  const res = await axios.post<{ success: true; data: { accessToken: string } }>(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true, timeout: 15_000 },
  );
  const newToken = res.data?.data?.accessToken;
  if (!newToken) {
    throw new Error('Refresh response missing accessToken');
  }
  useAuthStore.getState().setAccessToken(newToken);
  return newToken;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequest | undefined;
    const status = error.response?.status;

    // Only attempt refresh on 401, once per request, and skip for auth
    // endpoints (login returns 401 on bad credentials — not a token expiry).
    const isAuthCall = originalRequest?.url?.includes('/auth/');
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;

        // Replay original request with new token.
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return apiClient.request(originalRequest);
      } catch (refreshErr) {
        // Refresh failed — clear auth state so the app routes to login.
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Typed unwrap helper for `ApiSuccessResponse<T>` envelopes.
 * Usage:
 *   const user = await apiGet<User>('/users/me');
 */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<{ success: true; data: T }>(url, config);
  return res.data.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await apiClient.post<{ success: true; data: T }>(url, body, config);
  return res.data.data;
}

export async function apiPut<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await apiClient.put<{ success: true; data: T }>(url, body, config);
  return res.data.data;
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await apiClient.patch<{ success: true; data: T }>(url, body, config);
  return res.data.data;
}

export async function apiDelete<T = void>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await apiClient.delete<{ success: true; data: T }>(url, config);
  return res.data.data;
}
