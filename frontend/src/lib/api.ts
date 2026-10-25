const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      const port = process.env.NEXT_PUBLIC_API_PORT || '3001';
      return `${window.location.protocol}//${host}:${port}/api`;
    }
  }
  return API_URL;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
}

export async function fetchApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const rawError = data?.message || data?.error || 'Đã có lỗi xảy ra khi gọi API';
    const message = Array.isArray(rawError) ? rawError.join(', ') : String(rawError);
    throw new ApiError(message, response.status);
  }

  // Bóc tách format của TransformInterceptor: { success, data, ... }
  if (data && 'data' in data && data.data !== undefined) {
    return data.data as T;
  }
  return data as T;
}
