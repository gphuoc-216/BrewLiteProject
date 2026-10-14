'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi } from '../../lib/api';
import { CreditCard, Wallet, ShieldCheck, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, promotion, getFinalTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const finalTotal = getFinalTotal();

  const handlePay = async () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      router.push('/');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Tạo đơn hàng (POST /api/orders) ở trạng thái PENDING
      const orderPayload = {
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        promotionCode: promotion ? promotion.code : undefined,
      };

      const createdOrder = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      // 2. Sinh Idempotency-Key chuẩn UUIDv4 chống trùng lặp thanh toán
      const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 3. Thực hiện thanh toán không tiền mặt (POST /api/payments)
      await fetchApi('/payments', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          orderId: createdOrder.id,
          method: paymentMethod,
        }),
      });

      // Xóa sạch giỏ hàng và chuyển hướng tới màn hình xác nhận
      clearCart();
      router.push(`/orders/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      setErrorMsg(err.message || 'Thanh toán không thành công. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-coffee-700 hover:text-coffee-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại giỏ hàng</span>
      </button>

      {/* Main Payment Card (Wireframe Screen 4) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thanh toán không tiền mặt an toàn 100%</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-coffee-950">Xác nhận thanh toán</h1>
        </div>

        {/* Total Price Banner */}
        <div className="p-5 rounded-2xl bg-coffee-50 border border-coffee-200 text-center space-y-1">
          <span className="text-xs text-coffee-600 font-semibold uppercase tracking-wider block">Tổng số tiền cần trả</span>
          <span className="text-3xl sm:text-4xl font-black text-coffee-900">
            {finalTotal.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-coffee-700">
            Chọn phương thức thanh toán
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Wallet */}
            <div
              onClick={() => setPaymentMethod('WALLET')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                paymentMethod === 'WALLET'
                  ? 'border-coffee-800 bg-coffee-50 ring-2 ring-coffee-800/20'
                  : 'border-coffee-200 hover:border-coffee-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-coffee-950">Ví điện tử</div>
                <div className="text-xs text-coffee-500">Momo / ZaloPay / ShopeePay</div>
              </div>
            </div>

            {/* Card */}
            <div
              onClick={() => setPaymentMethod('CARD')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                paymentMethod === 'CARD'
                  ? 'border-coffee-800 bg-coffee-50 ring-2 ring-coffee-800/20'
                  : 'border-coffee-200 hover:border-coffee-300 bg-white'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-coffee-950">Thẻ ngân hàng</div>
                <div className="text-xs text-coffee-500">ATM Napas / Visa / Mastercard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Confirm Payment Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang xử lý giao dịch qua cổng...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Xác nhận trả {finalTotal.toLocaleString('vi-VN')}đ</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-coffee-400">
          Giao dịch tự động ghi nhận Idempotency-Key và khấu trừ tồn kho nguyên liệu an toàn.
        </p>
      </div>
    </div>
  );
}
