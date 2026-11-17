'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [draft, setDraft] = useState<string>(String(value));
  const latestValRef = useRef<number>(value);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    latestValRef.current = value;
    setDraft(String(value));
  }, [value]);

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const step = useCallback(
    (delta: 1 | -1) => {
      const next = Math.min(max, Math.max(min, latestValRef.current + delta));
      if (next !== latestValRef.current) {
        latestValRef.current = next;
        setDraft(String(next));
        onChange(next);
      } else {
        stopHold();
      }
    },
    [min, max, onChange, stopHold]
  );

  const startHold = (delta: 1 | -1, e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    stopHold();
    step(delta);
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => step(delta), 65);
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    if (digitsOnly === '') {
      setDraft('');
      return;
    }
    const parsed = parseInt(digitsOnly, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(max, parsed);
    setDraft(String(clamped));
    if (clamped >= min) {
      latestValRef.current = clamped;
      onChange(clamped);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(draft, 10);
    const clamped = Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
    latestValRef.current = clamped;
    setDraft(String(clamped));
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  const btnSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const inputWidth = size === 'sm' ? 'w-8' : 'w-10';

  return (
    <div className="inline-flex items-center gap-1 border border-line rounded p-0.5 bg-surface select-none">
      <button
        type="button"
        disabled={value <= min}
        onPointerDown={(e) => startHold(-1, e)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            step(-1);
          }
        }}
        className={`${btnSize} flex items-center justify-center rounded text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent touch-none`}
        aria-label="Giảm số lượng"
      >
        <Minus className={iconSize} strokeWidth={1.75} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={(e) => e.target.select()}
        aria-label="Số lượng"
        className={`${inputWidth} text-center text-xs font-semibold tabular-nums text-ink bg-transparent focus:outline-none focus:bg-surface-2 rounded py-0.5`}
      />
      <button
        type="button"
        disabled={value >= max}
        onPointerDown={(e) => startHold(1, e)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            step(1);
          }
        }}
        className={`${btnSize} flex items-center justify-center rounded text-ink hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent touch-none`}
        aria-label="Tăng số lượng"
      >
        <Plus className={iconSize} strokeWidth={1.75} />
      </button>
    </div>
  );
};
