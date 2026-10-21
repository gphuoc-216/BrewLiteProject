'use client';

import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-surface-2 animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
};
