'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi } from '../../lib/api';
import { Trash2, Plus, Minus, Ticket, ArrowRight, ShoppingBag, Coffee, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, promotion, applyPromotion, removePromotion, getSubtotal, getFinalTotal } = useCartStore();
  const { user } = useAuthStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const finalTotal = getFinalTotal();
  const discountAmount = promotion ? promotion.discountAmount : 0;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      setCouponError(null);
      const res = await fetchApi('/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode.trim(),
          orderSubtotal: subtotal,
        }),
      });

      applyPromotion({
        id: res.promotionId,
        code: res.code,
        name: res.name,
        discountType: res.discountType,
        discountValue: res.discountValue,
        discountAmount: res.discountAmount,
      });
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Mã khuyến mãi không hợp lệ');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5 bg-white rounded-3xl p-8 border border-coffee-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-coffee-100 text-coffee-600 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-coffee-950">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-coffee-500">Hãy dạo quanh thực đơn và chọn cho mình ly cà phê thơm ngon nhé!</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-coffee-800 text-white font-bold text-sm hover:bg-coffee-900 transition-colors shadow"
        >
          <Coffee className="w-4 h-4" />
          <span>Khám phá thực đơn</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-coffee-950 flex items-center gap-2">
          <span>Giỏ hàng của bạn</span>
          <span className="text-sm font-semibold text-coffee-500">({items.length} món)</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
        >
          Xóa toàn bộ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="bg-white rounded-2xl p-4 border border-coffee-200 shadow-sm flex items-center gap-4 hover:border-coffee-300 transition-colors"
            >
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-20 h-20 rounded-xl object-cover bg-coffee-100 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-coffee-950 text-base truncate">{item.productName}</h3>
                <div className="text-xs text-coffee-500 font-medium mt-0.5">
                  Size <span className="font-bold text-coffee-800">{item.size}</span>
                  {item.topping && <span> • {item.topping}</span>}
                </div>
                <div className="text-sm font-black text-coffee-900 mt-1">
                  {Number(item.price).toLocaleString('vi-VN')}đ
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 bg-coffee-50 border border-coffee-200 rounded-xl p-1">
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg bg-white text-coffee-800 font-bold hover:bg-coffee-100 flex items-center justify-center text-xs shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold text-coffee-950 w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white text-coffee-800 font-bold hover:bg-coffee-100 flex items-center justify-center text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeItem(item.variantId)}
                className="text-coffee-400 hover:text-red-500 p-2 transition-colors"
                title="Xóa món"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary & Voucher */}
        <div className="space-y-6">
          {/* Voucher Box */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-coffee-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-coffee-700" />
              <span>Mã khuyến mãi (Voucher)</span>
            </h3>

            {promotion ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900">{promotion.code}</div>
                  <div className="text-[11px] text-amber-700">{promotion.name}</div>
                </div>
                <button
                  onClick={removePromotion}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Nhập mã (BREW10, GIAM20K)"
                    className="flex-1 px-3 py-2 rounded-xl bg-coffee-50 border border-coffee-200 text-xs font-semibold uppercase placeholder:normal-case focus:border-coffee-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 rounded-xl bg-coffee-800 hover:bg-coffee-900 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? 'Kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
                {couponError && (
                  <div className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{couponError}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Payment Summary Box */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-coffee-900">Chi tiết thanh toán</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-coffee-600">
                <span>Tạm tính</span>
                <span className="font-semibold text-coffee-900">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá voucher</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="pt-3 border-t border-coffee-100 flex justify-between items-baseline">
                <span className="font-bold text-coffee-950">Tổng thanh toán</span>
                <span className="text-2xl font-black text-coffee-900">{finalTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
            >
              <span>Tiến hành Thanh toán</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
