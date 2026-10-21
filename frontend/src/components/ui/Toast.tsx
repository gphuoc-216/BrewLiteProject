'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'danger' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-success/30',
      text: 'text-success',
      bg: 'bg-surface',
    },
    danger: {
      icon: AlertCircle,
      border: 'border-danger/30',
      text: 'text-danger',
      bg: 'bg-surface',
    },
    info: {
      icon: Info,
      border: 'border-info/30',
      text: 'text-info',
      bg: 'bg-surface',
    },
  };

  const current = typeConfig[type];
  const Icon = current.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-surface border ${current.border} rounded shadow-float transition-all duration-150 max-w-sm`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${current.text}`} strokeWidth={1.75} />
      <span className="text-sm font-medium text-ink flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-ink-3 hover:text-ink transition-colors p-1"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
};
