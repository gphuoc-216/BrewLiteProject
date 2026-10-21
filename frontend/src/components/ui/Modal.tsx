'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={`relative w-full ${widthStyles[maxWidth]} bg-surface border border-line rounded shadow-float p-6 z-10 transition-all`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 id="modal-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h3>
            {description && (
              <p id="modal-description" className="text-xs text-ink-2 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
