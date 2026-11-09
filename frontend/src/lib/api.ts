const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function isLocalHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]'
  );
}

function isLocalLan(host: string): boolean {
  return (
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    host.endsWith('.local')
  );
}

function isDevTunnel(host: string): boolean {
  return (
    host.includes('trycloudflare.com') ||
    host.includes('ngrok') ||
    host.includes('loca.lt')
  );
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // 1. Localhost: ưu tiên NEXT_PUBLIC_API_URL nếu có, fallback về http://localhost:3001/api
    if (isLocalHost(host)) {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    }

    // 2. Dev Tunnel (Cloudflare Tunnel, ngrok, loca.lt): dùng NEXT_PUBLIC_API_URL hoặc relative /api
    if (isDevTunnel(host)) {
      if (
        process.env.NEXT_PUBLIC_API_URL &&
        !process.env.NEXT_PUBLIC_API_URL.includes('localhost') &&
        !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
      ) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      return '/api';
    }

    // 3. Mạng LAN cục bộ (khi test điện thoại cùng Wi-Fi, ví dụ 192.168.x.x)
    if (isLocalLan(host)) {
      if (
        process.env.NEXT_PUBLIC_API_URL &&
        !process.env.NEXT_PUBLIC_API_URL.includes('localhost') &&
        !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
      ) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      const port = process.env.NEXT_PUBLIC_API_PORT || '3001';
      return `${window.location.protocol}//${host}:${port}/api`;
    }

    // 4. Môi trường Production (Vercel hoặc tên miền thực tế):
    // Dùng chính xác NEXT_PUBLIC_API_URL đã cấu hình (ví dụ: https://<backend-render>.onrender.com/api)
    // Tuyệt đối không tự ghép domain hiện tại với cổng :3001.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (
      !apiUrl ||
      !apiUrl.trim() ||
      apiUrl.includes('localhost') ||
      apiUrl.includes('127.0.0.1')
    ) {
      throw new ApiError(
        'Chưa cấu hình biến môi trường NEXT_PUBLIC_API_URL hợp lệ cho môi trường production. Vui lòng thiết lập NEXT_PUBLIC_API_URL trên Vercel trỏ tới backend Render (ví dụ: https://<backend-render>.onrender.com/api).',
        500
      );
    }
    return apiUrl.trim();
  }

  // SSR / Build time fallback
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
  const optionHeaders = (options.headers as Record<string, string> | undefined) || {};
  const retryable = optionHeaders['X-Retry-After-Refresh'] !== '1';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...optionHeaders,
  };
  delete headers['X-Retry-After-Refresh'];

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const rawBaseUrl = getApiBaseUrl();
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined' && retryable) {
    const refreshToken = localStorage.getItem('brewlite_refresh_token');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshJson = await refreshResponse.json();
        const tokenData = refreshJson?.data || refreshJson;

        if (refreshResponse.ok && tokenData?.accessToken) {
          localStorage.setItem('brewlite_token', tokenData.accessToken);
          if (tokenData.refreshToken) {
            localStorage.setItem('brewlite_refresh_token', tokenData.refreshToken);
          }
          return fetchApi<T>(endpoint, {
            ...options,
            headers: {
              ...optionHeaders,
              'X-Retry-After-Refresh': '1',
            },
          });
        }
      } catch {
        // Nếu refresh lỗi, tiếp tục đăng xuất ở bên dưới.
      }
    }

    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_refresh_token');
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
