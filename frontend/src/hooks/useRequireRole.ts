'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Role } from '@/types';

/**
 * Kiểm tra phân quyền và phiên đăng nhập.
 * Bắt buộc người dùng phải có phiên đăng nhập hợp lệ (có cả user và JWT token còn hạn)
 * trước khi cho phép truy cập các màn hình nhạy cảm (Checkout, Lịch sử đơn, Staff, Admin).
 */
export function useRequireRole(allowedRoles: Role[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, setAuth, logout } = useAuthStore();
  const [ready, setReady] = useState(false);
  const rolesKey = allowedRoles.join(',');
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Lấy token và user từ store hoặc localStorage
    const currentToken = token || localStorage.getItem('brewlite_token');
    let currentUser = user;

    if (!currentUser) {
      const storedUser = localStorage.getItem('brewlite_user');
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch {
          currentUser = null;
        }
      }
    }

    // 2. Nếu thiếu token hoặc thiếu user -> chưa đăng nhập
    if (!currentToken || !currentUser) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        setReady(false);
        logout();
        router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
      }
      return;
    }

    // 3. Kiểm tra tính hợp lệ và thời hạn của JWT Token
    try {
      const parts = currentToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token JWT đã hết hạn -> Buộc đăng xuất
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            setReady(false);
            logout();
            router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
          }
          return;
        }
      }
    } catch {
      // Bỏ qua lỗi decode nếu là mock token dev
    }

    // 4. Đồng bộ ngược lại Zustand store nếu state đang trống
    if (!user && currentUser) {
      setAuth(currentUser, currentToken);
    }

    // 5. Kiểm tra phân quyền vai trò (Role)
    const allowed = rolesKey.split(',') as Role[];
    if (!allowed.includes(currentUser.role)) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace('/');
      }
      return;
    }

    setReady(true);
  }, [rolesKey, pathname, router]);

  return { ready, user };
}
