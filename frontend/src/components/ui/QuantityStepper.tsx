'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface QuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const btnSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <div className="inline-flex items-center gap-2 border border-line rounded p-0.5 bg-surface">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${btnSize} flex items-center justify-center rounded text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
        aria-label="Giảm số lượng"
      >
        <Minus className={iconSize} strokeWidth={1.75} />
      </button>
      <span className="min-w-[20px] text-center text-xs font-semibold tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${btnSize} flex items-center justify-center rounded text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
        aria-label="Tăng số lượng"
      >
        <Plus className={iconSize} strokeWidth={1.75} />
      </button>
    </div>
  );
};
