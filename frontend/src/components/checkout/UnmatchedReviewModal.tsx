'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Bot, Send, Headphones, Receipt } from 'lucide-react';

export interface UnmatchedTransaction {
  id: string;
  time: string;
  receivedMemo: string;
  expectedMemo: string;
  amount: number;
  penaltyAmount: number;
  refundAmount: number;
  status: 'PENDING_REVIEW' | 'REFUNDED';
}

interface UnmatchedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  unmatchedList: UnmatchedTransaction[];
}

export default function UnmatchedReviewModal({
  isOpen,
  onClose,
  orderCode,
  unmatchedList,
}: UnmatchedReviewModalProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: `Chào bạn! Tôi là Trợ lý AI CSKH BrewLite. Nếu bạn đã chuyển khoản nhưng ghi sai nội dung hoặc thiếu mã "${orderCode}", vui lòng gửi thông tin để tôi hỗ trợ đối soát hồ sơ và gửi sang bộ phận Kế toán nhé!`,
      time: 'Ngay bây giờ',
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const botReply = {
        sender: 'bot' as const,
        text: `Dạ em đã ghi nhận thông tin đối soát cho đơn hàng "${orderCode}"! Em đã lập phiếu chuyển sang Kế toán xử lý. Theo chính sách ngân hàng, khoản chuyển sai nội dung sẽ được hoàn lại 90% (khấu trừ 10% phí thủ tục Napas) vào STK nguồn của bạn. Bạn cũng có thể liên hệ hotline 1900 6868 để được ưu tiên xử lý khẩn cấp nhé!`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line-strong rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-danger" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Tra Soát Chuyển Sai Nội Dung & CSKH
              </h3>
              <p className="text-[11px] text-ink-3">
                Đơn hàng: <span className="font-mono font-bold text-accent">{orderCode}</span>
              </p>
            </div>
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-ink-2">
          {/* Section 1: Danh sách giao dịch sai nội dung ghi nhận */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-accent" />
                Giao Dịch Ghi Nhận Chưa Khớp Mã ({unmatchedList.length})
              </span>
              <span className="text-[11px] text-danger font-medium">Chế tài trừ 10% phí tra soát</span>
            </div>

            {unmatchedList.length === 0 ? (
              <div className="p-4 border border-dashed border-line rounded-lg text-center text-ink-3 bg-surface-2/40">
                Chưa có giao dịch sai nội dung nào được ghi nhận cho mã {orderCode}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {unmatchedList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-danger-soft/40 border border-danger/25 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-danger text-[11.5px]">{item.id}</span>
                      <span className="text-ink-3 text-[11px]">{item.time}</span>
                    </div>
                    <div className="text-[11.5px]">
                      Lời nhắn nhận được: <b className="text-danger italic">&ldquo;{item.receivedMemo}&rdquo;</b> (Không chứa mã {item.expectedMemo})
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-danger/15 text-[11.5px]">
                      <span>Số tiền gửi: <b>{item.amount.toLocaleString('vi-VN')}đ</b></span>
                      <span className="text-danger">Khấu trừ 10%: -{item.penaltyAmount.toLocaleString('vi-VN')}đ</span>
                      <span className="text-success font-semibold">Hoàn lại 90%: {item.refundAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Khung Chat AI CSKH & Hỗ trợ Kế toán */}
          <div className="border border-line rounded-xl overflow-hidden bg-surface-2 flex flex-col">
            <div className="px-3.5 py-2.5 bg-surface border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <Bot className="w-4 h-4 text-accent" />
                <span>Chatbot AI Tra Soát & Tiếp Nhận Hồ Sơ Hoàn Tiền</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-ink-3">
                <Headphones className="w-3.5 h-3.5 text-success" />
                <span>Hotline: 1900 6868</span>
              </div>
            </div>

            {/* Chat Box Messages */}
            <div className="p-3.5 space-y-2.5 max-h-48 overflow-y-auto">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-accent text-on-accent'
                        : 'bg-surface border border-line text-ink'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-ink-3 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 border-t border-line bg-surface flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập số tài khoản hoặc lời nhắn bạn đã ghi khi chuyển..."
                className="flex-1 px-3 py-2 text-xs bg-surface-2 border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-ink"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-surface-2 flex justify-between items-center text-[11px] text-ink-3">
          <span>Cam kết bảo mật & hoàn tiền chuẩn quy chế ngân hàng</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-surface border border-line hover:border-line-strong text-ink text-xs font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
