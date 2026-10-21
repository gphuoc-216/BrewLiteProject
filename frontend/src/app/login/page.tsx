'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { useAuthStore, User } from '../../store/useAuthStore';
import { Button, Input, Card } from '../../components/ui';
import { AlertCircle } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeLogin = async (u: string, p: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetchApi<{ user: User; accessToken: string; refreshToken?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u.trim(), password: p }),
      });

      // Kiểm tra trạng thái tài khoản
      if (res.user?.status === 'LOCKED') {
        throw new Error('Tài khoản đã bị khoá, vui lòng liên hệ quầy');
      }

      setAuth(res.user, res.accessToken, res.refreshToken);

      if (res.user.role === 'STAFF') {
        router.push('/staff');
      } else if (res.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('khóa') || msg.includes('khoá') || msg.includes('LOCKED') || u === 'customer_locked') {
        setErrorMsg('Tài khoản đã bị khoá, vui lòng liên hệ quầy');
      } else if (u === 'admin' && p === '123456') {
        const mockUser = { accountId: 'acc-admin', id: 'admin-1', username: 'admin', fullName: 'Quản Trị Viên', email: 'admin@brewlite.vn', role: 'ADMIN' as const };
        setAuth(mockUser, 'mock_token_admin', 'mock_refresh');
        router.push('/admin');
      } else if (u === 'barista1' && p === '123456') {
        const mockUser = { accountId: 'acc-staff-1', id: 'staff-1', username: 'barista1', fullName: 'Nguyễn Văn Pha', email: 'barista1@brewlite.vn', role: 'STAFF' as const };
        setAuth(mockUser, 'mock_token_staff', 'mock_refresh');
        router.push('/staff');
      } else if (u === 'customer1' && p === '123456') {
        const mockUser = { accountId: 'acc-cust-1', id: 'cust-1', username: 'customer1', fullName: 'Hoàng Minh Khách', email: 'khach1@gmail.com', role: 'CUSTOMER' as const, loyaltyPoints: 120 };
        setAuth(mockUser, 'mock_token_cust', 'mock_refresh');
        router.push(redirectUrl);
      } else {
        setErrorMsg(msg || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    executeLogin(username, password);
  };

  return (
    <div className="max-w-[400px] mx-auto py-12 space-y-6">
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="font-display text-2xl font-semibold text-ink">Đăng nhập tài khoản</h1>
          <p className="text-xs text-ink-3">Nhập thông tin tài khoản thành viên BrewLite</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-danger-soft border border-danger/30 rounded flex items-start gap-2 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Tên đăng nhập"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ví dụ: minhanh26"
          />

          <Input
            label="Mật khẩu"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />

          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={loading}
            className="w-full font-semibold"
          >
            Đăng nhập
          </Button>
        </form>

        {/* Demo Fast Switch */}
        <div className="pt-3 border-t border-line space-y-2">
          <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider text-center">
            ⚡ Tài khoản demo nhanh:
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setUsername('customer1'); setPassword('123456'); }}
              className="py-2 px-1.5 bg-surface-2 hover:bg-surface-3 border border-line rounded-lg text-center text-ink font-medium transition-colors"
            >
              ☕ Khách hàng
            </button>
            <button
              type="button"
              onClick={() => { setUsername('barista1'); setPassword('123456'); }}
              className="py-2 px-1.5 bg-surface-2 hover:bg-surface-3 border border-line rounded-lg text-center text-ink font-medium transition-colors"
            >
              🧑‍🍳 Barista
            </button>
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('123456'); }}
              className="py-2 px-1.5 bg-surface-2 hover:bg-surface-3 border border-line rounded-lg text-center text-ink font-medium transition-colors"
            >
              👑 Quản trị
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-ink-3 pt-2 border-t border-line">
          <span>Chưa có tài khoản? </span>
          <Link href="/register" className="text-accent hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-[400px] mx-auto py-12 text-center text-xs text-ink-3">Đang tải...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
