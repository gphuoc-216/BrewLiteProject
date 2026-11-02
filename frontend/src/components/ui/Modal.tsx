'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
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
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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
        className={`relative w-full ${widthStyles[maxWidth]} max-h-[92vh] flex flex-col bg-surface border border-line rounded-2xl shadow-float z-10 transition-all overflow-hidden`}
      >
        {/* Fixed Header */}
        <div className={`flex items-start justify-between gap-4 p-5 sm:p-6 ${footer ? 'pb-3.5 border-b border-line' : 'mb-3'} shrink-0 bg-surface`}>
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
            className="text-ink-3 hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto ${footer ? 'px-5 sm:px-6 py-4' : 'px-5 sm:px-6 pb-5 sm:pb-6'} flex-1 space-y-4`}>
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-line bg-surface/95 backdrop-blur-xs shrink-0 shadow-subtle z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
