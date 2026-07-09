/**
 * Centralized API client for MedZiva frontend.
 *
 * Replaces raw fetch() calls throughout the app.
 * Handles: base URL, auth tokens, credentials, JSON parsing, error handling.
 *
 * Usage:
 *   import { api } from '@/lib/api';
 *   const categories = await api.get('/api/categories');
 *   const booking = await api.post('/api/bookings', { body: data });
 *   const updated = await api.patch('/api/service/123', { body: data });
 *   await api.delete('/api/service/123');
 */

const API_BASE = (() => {
  const envBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (envBase && !isLocalHost) return envBase;
  return '';
})();

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip auth token injection (e.g., for public endpoints). */
  noAuth?: boolean;
  /** Skip credentials: 'include' (default: true). */
  noCredentials?: boolean;
}

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem('medziva_user_token') ||
      localStorage.getItem('medziva_vendor_token') ||
      localStorage.getItem('medziva_admin_token')
    );
  } catch {
    return null;
  }
}

async function request<T = unknown>(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers = {}, noAuth = false, noCredentials = false } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!noAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

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

    // Auto-clear stale tokens on auth errors
    if (response.status === 401) {
      try {
        localStorage.removeItem('medziva_user_token');
        localStorage.removeItem('medziva_vendor_token');
        localStorage.removeItem('medziva_admin_token');
      } catch {
        // localStorage not available
      }
    }

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

  patch: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('PATCH', url, options),

  delete: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, options),
};

export type { ApiError };
