'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Eye, EyeOff, UserRound } from 'lucide-react';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Button, Card, Input, PageHeader } from '../../components/ui';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function ProfilePage() {
  const router = useRouter();
  const { ready } = useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN']);
  const { user, fetchProfile } = useAuthStore();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (ready) fetchProfile();
  }, [ready, fetchProfile]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'Mật khẩu mới cần tối thiểu 6 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'danger', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    try {
      setLoading(true);
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' });
    } catch (err: unknown) {
      setMessage({ type: 'danger', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    id,
    label,
    value,
    visible,
    autoComplete,
    onChange,
    onToggle,
  }: {
    id: string;
    label: string;
    value: string;
    visible: boolean;
    autoComplete: string;
    onChange: (value: string) => void;
    onToggle: () => void;
  }) => (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="block text-xs font-medium text-ink-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-10 px-3 pr-10 py-2 text-sm bg-surface text-ink placeholder:text-ink-3 border border-line hover:border-line-strong rounded transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-2 flex items-center text-ink-3 hover:text-ink"
          aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  if (!ready) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-xs text-ink-3">
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  if (!user) {
    router.replace('/login?redirect=/profile');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Trang cá nhân"
        description="Quản lý thông tin thành viên và bảo mật tài khoản BrewLite."
      />

      <Card className="space-y-4">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <div className="w-11 h-11 rounded bg-accent-soft text-accent flex items-center justify-center">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              {user.fullName || user.username}
            </h2>
            <p className="text-xs text-ink-3">{user.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Input label="Tên đăng nhập" value={user.username} readOnly />
          <Input label="Email" value={user.email || ''} readOnly />
          <Input label="Họ và tên" value={user.fullName || ''} readOnly />
          <Input
            label="Điểm tích lũy"
            value={`${user.loyaltyPoints || 0} điểm`}
            readOnly
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold text-ink">Đổi mật khẩu</h2>
          <p className="text-xs text-ink-3">
            Cập nhật mật khẩu đăng nhập cho tài khoản hiện tại.
          </p>
        </div>

        {message && (
          <div
            className={`p-3 border rounded flex items-start gap-2 text-xs ${
              message.type === 'success'
                ? 'bg-success-soft border-success/30 text-success'
                : 'bg-danger-soft border-danger/30 text-danger'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <PasswordInput
            id="old-password"
            label="Mật khẩu hiện tại"
            value={oldPassword}
            visible={showOldPassword}
            autoComplete="current-password"
            onChange={setOldPassword}
            onToggle={() => setShowOldPassword((value) => !value)}
          />
          <PasswordInput
            id="new-password"
            label="Mật khẩu mới"
            value={newPassword}
            visible={showNewPassword}
            autoComplete="new-password"
            onChange={setNewPassword}
            onToggle={() => setShowNewPassword((value) => !value)}
          />
          <PasswordInput
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            visible={showConfirmPassword}
            autoComplete="new-password"
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
          />

          <Button type="submit" variant="primary" size="md" loading={loading}>
            Lưu mật khẩu mới
          </Button>
        </form>
      </Card>
    </div>
  );
}
