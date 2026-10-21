'use client';

import React from 'react';
import { X, ExternalLink, Smartphone } from 'lucide-react';

interface MbBankSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount?: number;
  orderCode?: string;
}

export default function MbBankSimulatorModal({
  isOpen,
  onClose,
  amount,
  orderCode,
}: MbBankSimulatorModalProps) {
  if (!isOpen) return null;

  const bankQuery =
    amount || orderCode
      ? `?amount=${amount || ''}&orderCode=${orderCode || ''}&memo=BREWLITE%20${orderCode || ''}&name=BREWLITE%20COFFEE&account=99998888&bank=MBB`
      : '';
  const fullUrl = `/mbbank/index.html${bankQuery}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-black/95 border border-line-strong rounded-[36px] shadow-2xl w-full max-w-[430px] h-[92vh] max-h-[860px] overflow-hidden flex flex-col relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 10px #1e293b',
        }}
      >
        {/* Dynamic Island / iPhone Speaker Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-[#0f172a] rounded-full border border-gray-800 mr-2"></div>
          <div className="w-8 h-1 bg-gray-800 rounded-full"></div>
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-[#001f70] text-white z-10 border-b border-blue-900/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>MBBank Mobile</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-white/10 rounded text-xs flex items-center gap-1 text-cyan-300"
              title="Mở tab riêng"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MBBank Iframe Container */}
        <div className="flex-1 w-full h-full bg-slate-900 overflow-hidden relative">
          <iframe
            src={fullUrl}
            className="w-full h-full border-0 select-none"
            title="MBBank Simulator"
          />
        </div>
      </div>
    </div>
  );
}
