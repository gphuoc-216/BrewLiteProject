'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-surface border border-line rounded p-4 sm:p-5 transition-colors ${
        hoverable ? 'hover:border-line-strong' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
