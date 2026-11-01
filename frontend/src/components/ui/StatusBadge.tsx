'use client';

import React from 'react';
import { OrderStatus } from '@/types';
import { ORDER_STATUS } from '@/lib/orderStatus';

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = (ORDER_STATUS as Record<string, { label: string; bg: string; text: string; border: string }>)[status] || {
    label: status,
    bg: 'bg-surface-2',
    text: 'text-ink-2',
    border: 'border-line',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
};
