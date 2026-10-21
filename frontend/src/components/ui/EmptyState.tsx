'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="text-center py-12 px-4 border border-line rounded bg-surface space-y-3 max-w-lg mx-auto">
      {Icon && (
        <div className="w-10 h-10 rounded border border-line flex items-center justify-center mx-auto text-ink-2 bg-surface-2">
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="text-xs text-ink-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
