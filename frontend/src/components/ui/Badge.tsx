'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface-2 text-ink-2 border border-line',
    accent: 'bg-accent-soft text-accent border border-accent/20',
    success: 'bg-success-soft text-success border border-success/20',
    warning: 'bg-warning-soft text-warning border border-warning/20',
    danger: 'bg-danger-soft text-danger border border-danger/20',
    info: 'bg-info-soft text-info border border-info/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
