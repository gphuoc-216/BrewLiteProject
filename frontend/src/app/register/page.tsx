'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Coffee, Lock, User, Mail, Sparkles, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          fullName,
          email,
          password,
        }),
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
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
          <h1 className="text-2xl font-black text-coffee-950">Tạo tài khoản mới</h1>
          <p className="text-xs text-coffee-500">Đăng ký thành viên để nhận ưu đãi và tích điểm đổi quà</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-coffee-700 block mb-1">Tên đăng nhập</label>
            <div className="relative">
              <User className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="ví dụ: tranvanan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-700 block mb-1">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Trần Văn An"
              className="w-full px-4 py-2.5 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-700 block mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="an.tran@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-700 block mb-1">Mật khẩu (tối thiểu 6 ký tự)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500"
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
            <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký thành viên'}</span>
          </button>

          <p className="text-center text-xs text-coffee-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-bold text-coffee-800 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
