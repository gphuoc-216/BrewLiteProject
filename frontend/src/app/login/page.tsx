'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Coffee, Lock, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      setAuth(res.user, res.accessToken, res.refreshToken);

      if (res.user.role === 'STAFF') {
        router.push('/staff');
      } else if (res.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coffee-700 to-coffee-900 text-white mx-auto flex items-center justify-center shadow-md">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-coffee-950">Đăng nhập tài khoản</h1>
          <p className="text-xs text-coffee-500">Đăng nhập để đặt món, tích lũy điểm thưởng và quản lý đơn hàng</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-coffee-700 block mb-1">Tên đăng nhập / Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-700 block mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500 transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-coffee-100 flex items-center justify-between text-xs text-coffee-500">
          <span>Chưa có tài khoản?</span>
          <Link href="/register" className="font-bold text-coffee-800 hover:text-coffee-950 hover:underline">
            Đăng ký thành viên
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-10 text-center text-coffee-600">Đang tải biểu mẫu đăng nhập...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
