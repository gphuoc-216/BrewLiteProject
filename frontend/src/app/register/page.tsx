'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { useAuthStore, User } from '../../store/useAuthStore';
import { Button, Input, Card } from '../../components/ui';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMsg('Email không đúng định dạng.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không khớp.');
        return;
      }

      const res = await fetchApi<{ user: User; accessToken: string; refreshToken?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/');
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[400px] mx-auto py-12 space-y-6">
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="font-display text-2xl font-semibold text-ink">Đăng ký tài khoản</h1>
          <p className="text-xs text-ink-3">Tạo tài khoản thành viên để đặt món và tích điểm</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-danger-soft border border-danger/30 rounded flex items-start gap-2 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <Input
            label="Tên đăng nhập"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="minhanh26"
          />

          <Input
            label="Họ và tên"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Minh Anh"
          />

          <Input
            label="Địa chỉ email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="minhanh@example.com"
          />

          <div className="space-y-1.5 text-left">
            <label htmlFor="register-password" className="block text-xs font-medium text-ink-2">
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full h-10 px-3 pr-10 py-2 text-sm bg-surface text-ink placeholder:text-ink-3 border border-line hover:border-line-strong rounded transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-2 flex items-center text-ink-3 hover:text-ink"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="register-confirm-password" className="block text-xs font-medium text-ink-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full h-10 px-3 pr-10 py-2 text-sm bg-surface text-ink placeholder:text-ink-3 border border-line hover:border-line-strong rounded transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-2 flex items-center text-ink-3 hover:text-ink"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={loading}
              className="w-full font-semibold"
            >
              Đăng ký thành viên
            </Button>
          </div>
        </form>

        <div className="text-center text-xs text-ink-3 pt-1 border-t border-line">
          <span>Đã có tài khoản? </span>
          <Link href="/login" className="text-accent hover:underline font-medium">
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
}
