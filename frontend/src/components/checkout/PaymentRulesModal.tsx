'use client';

import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface PaymentRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
}

export default function PaymentRulesModal({
  isOpen,
  onClose,
  orderCode,
}: PaymentRulesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line-strong rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-2">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-accent" />
            <h3 className="font-display text-base font-semibold text-ink">
              Quy Chế Thanh Toán Qua VietQR & MBBank
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink rounded-lg hover:bg-surface transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-ink-2 leading-relaxed">
          <div className="p-3.5 bg-danger-soft/60 border border-danger/20 rounded-lg">
            <div className="flex items-center gap-2 text-danger font-semibold mb-1 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Chế tài khấu trừ 10% khi chuyển sai nội dung</span>
            </div>
            <p className="text-[11.5px] text-danger/90">
              Hệ thống xử lý tự động đối soát ngân hàng theo mã hóa đơn. Nếu bạn nhập sai hoặc thiếu mã <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-danger">BREWLITE {orderCode}</code>, hệ thống sẽ từ chối kích hoạt đơn hàng và chuyển sang diện tra soát thủ công (khấu trừ 10% phí vận hành).
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink block">1. Nhập chính xác nội dung chuyển khoản</strong>
                Nội dung chuyển khoản bắt buộc phải chứa đúng mã: <span className="font-mono font-bold text-accent">BREWLITE {orderCode}</span>. Hệ thống Napas 247 sẽ đọc mã này và tự động phát âm thanh Ting Ting xác nhận chỉ sau 1–2 giây.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink block">2. Hiệu lực mã QR 05 phút</strong>
                Mã VietQR có hiệu lực trong vòng 300 giây (05:00) nhằm đảm bảo tỷ giá và số lượng nguyên liệu trong kho không bị trùng lắp. Nếu quá hạn, vui lòng bấm nút “Làm mới mã QR”.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink block">3. Chuyển khoản sai nội dung (Sai memo)</strong>
                Hệ thống <strong>tuyệt đối KHÔNG kích hoạt đơn hàng</strong> và <strong>KHÔNG có âm thanh Ting Ting</strong>. Mã QR vẫn giữ nguyên trạng thái chờ. Bạn cần vào mục <em>“Tra Soát Sai Nội Dung & CSKH”</em> để đối soát.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink block">4. Chính sách hoàn tiền 90%</strong>
                Các khoản tiền chuyển sai nội dung sẽ được Kế toán hoàn lại <strong>90% giá trị</strong> vào số tài khoản nguồn của quý khách trong vòng 24h làm việc (khấu trừ 10% chi phí kiểm tra ngân hàng Napas).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-surface-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-lg transition-colors"
          >
            Tôi Đã Hiểu Rõ
          </button>
        </div>
      </div>
    </div>
  );
}
