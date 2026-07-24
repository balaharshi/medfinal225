/**
 * Centralized API client for MedZiva frontend.
 *
 * Uses httpOnly cookies for authentication (set by backend via withAccessCookie).
 * Handles: base URL, credentials, JSON parsing, error handling.
 *
 * Usage:
 *   import { api } from '@/lib/api';
 *   const categories = await api.get('/api/categories');
 *   const booking = await api.post('/api/bookings', { body: data });
 *   const updated = await api.patch('/api/service/123', { body: data });
 *   await api.delete('/api/service/123');
 */

const API_BASE = (() => {
  const envBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (envBase && !isLocalHost) return envBase;
  return '';
})();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip credentials: 'include' (default: true). */
  noCredentials?: boolean;
}

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

async function request<T = unknown>(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers = {}, noCredentials = false } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: requestHeaders,
    credentials: noCredentials ? 'omit' : 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // Response wasn't JSON
    }

    const error: ApiError = {
      status: response.status,
      message: (errorData.message as string) || `Request failed: ${response.status}`,
      errors: errorData.errors as Record<string, string[]> | undefined,
    };

    throw new Error(error.message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * MedZiva API client.
 *
 * All methods return parsed JSON (or undefined for 204).
 * Throw on non-2xx responses with `{ status, message, errors? }`.
 */
export const api = {
  get: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('GET', url, options),

  post: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('POST', url, options),

  put: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('PUT', url, options),

  patch: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('PATCH', url, options),

  delete: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, options),
};

export type { ApiError };
