'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-ink-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full h-10 px-3 py-2 text-sm bg-surface text-ink placeholder:text-ink-3 border rounded transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-line hover:border-line-strong'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-xs text-danger font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-ink-3">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
