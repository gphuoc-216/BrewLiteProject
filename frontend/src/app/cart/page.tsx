'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { Button, QuantityStepper, PageHeader, EmptyState } from '../../components/ui';
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  ArrowLeft,
} from 'lucide-react';

interface AvailableVoucher {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  badge: string;
  description: string;
  isEligible: boolean;
  missingAmount: number;
  progressPercent: number;
}

const DEFAULT_COFFEE_VOUCHERS: AvailableVoucher[] = [
  {
    id: 'promo-banmoi',
    code: 'BANMOI',
    name: 'Chào Bạn Mới - Giảm 15%',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderValue: 30000,
    maxDiscount: 20000,
    badge: 'Giảm 15%',
    description: 'Giảm 15% (tối đa 20.000đ) cho đơn đồ uống từ 30.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-brew10',
    code: 'BREW10',
    name: 'Ưu Đãi Trải Nghiệm Cà Phê - Giảm 10%',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 30000,
    maxDiscount: 15000,
    badge: 'Giảm 10%',
    description: 'Giảm 10% (tối đa 15.000đ) cho đơn đồ uống từ 30.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-freeship',
    code: 'FREESHIP',
    name: 'Freeship Đồ Uống - Giảm 15K',
    discountType: 'FIXED',
    discountValue: 15000,
    minOrderValue: 45000,
    maxDiscount: 15000,
    badge: 'Giảm 15K',
    description: 'Giảm ngay 15.000đ cho đơn đồ uống từ 45.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-giam20k',
    code: 'GIAM20K',
    name: 'Ưu Đãi Giờ Vàng - Giảm 20K',
    discountType: 'FIXED',
    discountValue: 20000,
    minOrderValue: 60000,
    maxDiscount: 20000,
    badge: 'Giảm 20K',
    description: 'Giảm ngay 20.000đ cho đơn đồ uống từ 60.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-giam30k',
    code: 'GIAM30K',
    name: 'Tiệc Trà Chiều - Giảm 30K',
    discountType: 'FIXED',
    discountValue: 30000,
    minOrderValue: 80000,
    maxDiscount: 30000,
    badge: 'Giảm 30K',
    description: 'Giảm ngay 30.000đ cho đơn từ 80.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-coffeevip',
    code: 'COFFEEVIP',
    name: 'Tiệc Nhóm Đồng Nghiệp - Giảm 50K',
    discountType: 'FIXED',
    discountValue: 50000,
    minOrderValue: 120000,
    maxDiscount: 50000,
    badge: 'Giảm 50K',
    description: 'Giảm ngay 50.000đ cho hóa đơn nhóm từ 120.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
];

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    promotion,
    promotions,
    loyaltyPointsUsed,
    setLoyaltyPointsUsed,
    applyPromotion,
    togglePromotion,
    removePromotion,
    getSubtotal,
    getTotalCount,
    getFinalTotal,
  } = useCartStore();
  const { user } = useAuthStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<AvailableVoucher[]>(DEFAULT_COFFEE_VOUCHERS);

  const subtotal = getSubtotal();
  const totalCount = getTotalCount();
  const discountAmount = promotions.length > 0
    ? promotions.reduce((sum, p) => sum + (p.discountAmount || 0), 0)
    : (promotion ? promotion.discountAmount : 0);
  const availablePoints = user?.loyaltyPoints || 0;
  const remainingAfterVoucher = Math.max(0, subtotal - discountAmount);
  const maxPointsCanUse = Math.min(availablePoints, Math.floor(remainingAfterVoucher / 100));
  const pointsDiscount = (loyaltyPointsUsed || 0) * 100;
  const finalTotal = Math.max(0, subtotal - discountAmount - pointsDiscount);

  // Tính toán điều kiện áp dụng cho từng voucher theo tổng tiền hiện tại
  useEffect(() => {
    async function loadVouchers() {
      try {
        const data = await fetchApi<AvailableVoucher[]>(`/promotions/available?subtotal=${subtotal}`);
        if (data && Array.isArray(data) && data.length > 0) {
          setVouchers(data);
          return;
        }
      } catch {
        // Fallback local vouchers
      }

      const calculated = DEFAULT_COFFEE_VOUCHERS.map((v) => {
        const isEligible = subtotal >= v.minOrderValue;
        const missingAmount = Math.max(0, v.minOrderValue - subtotal);
        const progressPercent =
          v.minOrderValue > 0
            ? Math.min(100, Math.round((subtotal / v.minOrderValue) * 100))
            : 100;

        return {
          ...v,
          isEligible,
          missingAmount,
          progressPercent,
        };
      });
      setVouchers(calculated);
    }

    loadVouchers();
  }, [subtotal]);

  // Tự động gỡ voucher nếu tổng tiền bị giảm xuống dưới điều kiện tối thiểu
  useEffect(() => {
    if (promotions.length > 0) {
      promotions.forEach((p) => {
        const activeVoucher = vouchers.find(
          (v) => v.code.toUpperCase() === p.code.toUpperCase()
        );
        if (activeVoucher && subtotal < activeVoucher.minOrderValue) {
          removePromotion(p.code);
          setCouponError(
            `Mã "${p.code}" đã tự gỡ do giá trị đơn chưa đạt tối thiểu ${activeVoucher.minOrderValue.toLocaleString('vi-VN')}đ.`
          );
        }
      });
    } else if (promotion) {
      const activeVoucher = vouchers.find(
        (v) => v.code.toUpperCase() === promotion.code.toUpperCase()
      );
      if (activeVoucher && subtotal < activeVoucher.minOrderValue) {
        removePromotion();
        setCouponError(
          `Mã "${promotion.code}" đã tự gỡ do giá trị đơn chưa đạt tối thiểu ${activeVoucher.minOrderValue.toLocaleString('vi-VN')}đ.`
        );
      }
    }
  }, [subtotal, promotion, promotions, vouchers, removePromotion]);

  const handleToggleVoucher = async (v: AvailableVoucher) => {
    const isApplied = promotions.some((p) => p.code.toUpperCase() === v.code.toUpperCase());
    if (isApplied) {
      removePromotion(v.code);
      return;
    }

    if (subtotal < v.minOrderValue) {
      const missing = v.minOrderValue - subtotal;
      setCouponError(
        `Đơn hàng cần đạt tối thiểu ${v.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã "${v.code}" (còn thiếu ${missing.toLocaleString('vi-VN')}đ).`
      );
      return;
    }

    let calcDiscount = 0;
    if (v.discountType === 'PERCENT') {
      calcDiscount = Math.round((subtotal * v.discountValue) / 100);
      if (v.maxDiscount && calcDiscount > v.maxDiscount) {
        calcDiscount = v.maxDiscount;
      }
    } else {
      calcDiscount = v.discountValue;
    }
    calcDiscount = Math.min(calcDiscount, subtotal);

    togglePromotion({
      id: v.id,
      code: v.code,
      name: v.name,
      discountType: v.discountType,
      discountValue: v.discountValue,
      discountAmount: calcDiscount,
      minOrder: v.minOrderValue,
    });
  };

  const handleApplySpecificCoupon = async (code: string) => {
    const targetCode = code.trim().toUpperCase();
    if (!targetCode) return;

    try {
      setCouponLoading(true);
      setCouponError(null);

      const res = await fetchApi<{
        promotionId: string;
        code: string;
        name: string;
        discountType: 'PERCENT' | 'FIXED';
        discountValue: number;
        discountAmount: number;
      }>('/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: targetCode,
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
    } catch (err: unknown) {
      // Fallback local calculation
      const voucherDef = vouchers.find((v) => v.code.toUpperCase() === targetCode);
      if (voucherDef) {
        if (subtotal < voucherDef.minOrderValue) {
          const missing = voucherDef.minOrderValue - subtotal;
          setCouponError(
            `Đơn hàng cần đạt tối thiểu ${voucherDef.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã "${voucherDef.code}" (còn thiếu ${missing.toLocaleString('vi-VN')}đ).`
          );
          return;
        }

        let calcDiscount = 0;
        if (voucherDef.discountType === 'PERCENT') {
          calcDiscount = Math.round((subtotal * voucherDef.discountValue) / 100);
          if (voucherDef.maxDiscount && calcDiscount > voucherDef.maxDiscount) {
            calcDiscount = voucherDef.maxDiscount;
          }
        } else {
          calcDiscount = voucherDef.discountValue;
        }
        calcDiscount = Math.min(calcDiscount, subtotal);

        applyPromotion({
          id: voucherDef.id,
          code: voucherDef.code,
          name: voucherDef.name,
          discountType: voucherDef.discountType,
          discountValue: voucherDef.discountValue,
          discountAmount: calcDiscount,
        });
        setCouponCode('');
      } else {
        setCouponError(getErrorMessage(err));
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await handleApplySpecificCoupon(couponCode);
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
      <div className="py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Giỏ hàng đang trống"
          description="Bạn chưa chọn món uống nào. Hãy dạo quanh thực đơn và chọn cho mình một ly nước yêu thích nhé."
          actionLabel="Khám phá thực đơn"
          onAction={() => router.push('/')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Giỏ hàng của bạn"
        description={`Đang có ${items.length} món uống (${totalCount} ly) trong giỏ hàng.`}
        action={
          <button
            onClick={clearCart}
            className="text-xs text-ink-3 hover:text-danger transition-colors font-medium"
          >
            Xóa toàn bộ giỏ
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Item List (7 cols) */}
        <div className="lg:col-span-7 border-y border-line divide-y divide-line">
          {items.map((item) => {
            const lineTotal = item.price * item.quantity;

            return (
              <div key={item.id} className="py-4 flex gap-4 items-center">
                {/* Thumbnail */}
                <div className="relative w-16 h-20 bg-surface-2 border border-line rounded overflow-hidden shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-medium text-sm text-ink truncate">
                    {item.productName}
                  </h3>
                  <p className="text-xs text-ink-2">
                    Size: <span className="font-semibold text-ink">{item.size}</span>
                    {item.topping && item.topping !== 'Tiêu chuẩn' && (
                      <span className="text-ink-3 ml-2">· Topping: {item.topping}</span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-ink tabular-nums">
                    {Number(item.price).toLocaleString('vi-VN')}đ / ly
                  </p>
                </div>

                {/* Stepper & Line Total */}
                <div className="flex items-center gap-4 shrink-0">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(newQty) => updateQuantity(item.id, newQty)}
                    min={1}
                    max={20}
                  />

                  <div className="text-right min-w-[70px]">
                    <span className="font-semibold text-sm text-ink tabular-nums block">
                      {lineTotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-ink-3 hover:text-danger transition-colors rounded"
                    aria-label={`Xóa ${item.productName} khỏi giỏ`}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Nút Thêm sản phẩm khác (Chuẩn Activity Diagram: Mua thêm -> Thêm sản phẩm khác -> Xem menu) */}
          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-accent-hover bg-accent/10 hover:bg-accent/15 px-3.5 py-2.5 rounded-lg border border-accent/20 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm khác</span>
            </Link>
            <span className="text-[11.5px] text-ink-3">Quay lại thực đơn chọn thêm đồ uống</span>
          </div>
        </div>

        {/* Right: Sticky Order Summary & Coffee Shop Vouchers (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-surface border border-line rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="font-display text-base font-semibold text-ink border-b border-line pb-3">
              Tóm tắt đơn hàng
            </h2>

            {/* Subtotal & Discount rows */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-ink-2">
                <span>Tổng số lượng ly</span>
                <span className="font-semibold text-ink tabular-nums">
                  {totalCount} ly
                </span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>Tiền hàng</span>
                <span className="font-semibold text-ink tabular-nums">
                  {subtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {promotions.length > 0 ? (
                <div className="space-y-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="flex justify-between text-success font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Đã áp dụng {promotions.length} voucher ({promotions.map((p) => p.code).join(', ')})</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      -{discountAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePromotion()}
                      className="text-[11px] text-danger hover:underline"
                    >
                      Gỡ tất cả voucher
                    </button>
                  </div>
                </div>
              ) : promotion ? (
                <div className="flex justify-between text-success font-medium bg-emerald-50/60 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mã {promotion.code}</span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    -{discountAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ) : null}

              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium bg-amber-50/60 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Điểm tích lũy đã dùng ({loyaltyPointsUsed} điểm):</span>
                  </span>
                  <span className="font-semibold tabular-nums font-mono">
                    -{pointsDiscount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>

            {/* Promo Code Manual Input Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-3 border-t border-line">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-accent" />
                  <span>Mã ưu đãi</span>
                </span>
                {promotion && (
                  <button
                    type="button"
                    onClick={() => removePromotion()}
                    className="text-xs text-danger hover:underline font-normal"
                  >
                    Gỡ mã
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã (VD: BREW10)"
                  className="w-full h-8 px-2.5 text-xs bg-bg border border-line rounded text-ink uppercase placeholder:normal-case placeholder:text-ink-3 focus:border-accent focus:outline-none"
                />
                <Button variant="secondary" size="sm" type="submit" loading={couponLoading}>
                  Áp dụng
                </Button>
              </div>

              {couponError && (
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded text-[11px] text-danger flex items-start gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{couponError}</span>
                </div>
              )}
            </form>

            {/* Quick-Select Coffee Shop Vouchers (1-Click Tick) */}
            <div className="pt-2 border-t border-line space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Ưu đãi hiện có (Bấm để chọn)</span>
                </span>
                <span className="text-[10.5px] text-ink-3 font-normal">
                  {vouchers.filter((v) => v.isEligible).length}/{vouchers.length} áp dụng được
                </span>
              </div>

              <div className="space-y-2">
                {vouchers.map((v) => {
                  const isApplied = promotions.some(
                    (p) => p.code.toUpperCase() === v.code.toUpperCase()
                  ) || promotion?.code?.toUpperCase() === v.code.toUpperCase();

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (isApplied) {
                          removePromotion(v.code);
                        } else if (v.isEligible) {
                          handleToggleVoucher(v);
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                          : v.isEligible
                          ? 'border-line hover:border-accent bg-surface hover:bg-surface-2/40'
                          : 'border-line/60 bg-surface-2/30 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isApplied ? 'bg-emerald-600 text-white' : 'bg-accent/15 text-accent'
                          }`}>
                            {v.code} {isApplied ? '✓' : ''}
                          </span>
                          <span className="font-semibold text-ink text-[11.5px] truncate">
                            {v.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-3 leading-tight">
                          {v.isEligible
                            ? v.description
                            : `Đơn từ ${v.minOrderValue.toLocaleString('vi-VN')}đ (còn thiếu ${(v.minOrderValue - subtotal).toLocaleString('vi-VN')}đ)`}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!v.isEligible && !isApplied}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded shrink-0 transition-colors ${
                          isApplied
                            ? 'bg-emerald-600 text-white font-bold'
                            : v.isEligible
                            ? 'bg-accent text-on-accent hover:bg-accent-hover'
                            : 'text-ink-3 bg-line/50'
                        }`}
                      >
                        {isApplied ? 'Đã áp dụng ✓' : 'Chọn'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Khung Điểm Thưởng Tích Lũy Thành Viên (1 điểm = 100đ) */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-ink">
                <span className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Điểm Thưởng Tích Lũy</span>
                </span>
                {user ? (
                  <span className="text-[11px] text-ink-3">
                    Khả dụng: <b className="text-amber-600 dark:text-amber-400 font-mono">{availablePoints} điểm</b> ({Number(availablePoints * 100).toLocaleString('vi-VN')}đ)
                  </span>
                ) : (
                  <span className="text-[10.5px] text-ink-3">Tích lũy 5% mỗi đơn</span>
                )}
              </div>

              {user ? (
                maxPointsCanUse > 0 ? (
                  <label className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                    loyaltyPointsUsed > 0
                      ? 'bg-amber-100/60 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600'
                      : 'bg-surface border-line hover:border-amber-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={loyaltyPointsUsed > 0}
                      onChange={(e) => {
                        setLoyaltyPointsUsed(e.target.checked ? maxPointsCanUse : 0);
                      }}
                      className="mt-0.5 h-4 w-4 rounded accent-amber-600 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink text-xs flex items-center justify-between">
                        <span>Dùng {loyaltyPointsUsed > 0 ? loyaltyPointsUsed : maxPointsCanUse} điểm tích lũy để giảm giá</span>
                        <span className="text-amber-700 dark:text-amber-300 font-bold font-mono">
                          -{Number((loyaltyPointsUsed > 0 ? loyaltyPointsUsed : maxPointsCanUse) * 100).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <p className="text-[10.5px] text-ink-3 mt-0.5">
                        {loyaltyPointsUsed > 0
                          ? `Đã áp dụng giảm ${Number(pointsDiscount).toLocaleString('vi-VN')}đ vào đơn này (1 điểm = 100đ)`
                          : `Tick chọn để giảm ${Number(maxPointsCanUse * 100).toLocaleString('vi-VN')}đ bằng ${maxPointsCanUse} điểm thưởng`}
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="text-[11px] text-ink-3 p-1.5 bg-surface/60 rounded border border-line/60">
                    {availablePoints === 0
                      ? 'Bạn chưa có điểm tích lũy. Tích lũy 5% giá trị mỗi đơn khi thanh toán thành công!'
                      : 'Đơn hàng đã được giảm tối đa hoặc không cần dùng thêm điểm thưởng.'}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between text-[11px] text-ink-2 p-1.5 bg-surface/60 rounded border border-line/60">
                  <span>Đăng nhập để dùng điểm thưởng tích lũy (1 điểm = 100đ).</span>
                  <Link
                    href="/login?redirect=/cart"
                    className="text-accent hover:underline font-semibold text-[11px] shrink-0 ml-2"
                  >
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>

            {/* Final Total */}
            <div className="pt-3 border-t border-line flex items-baseline justify-between">
              <span className="text-xs font-semibold text-ink">Tổng thanh toán</span>
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">
                {finalTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Login Notice for Guests */}
            {!user && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-[11.5px] text-amber-900 dark:text-amber-200 leading-relaxed">
                <span>⚠️ Bạn cần <b>đăng nhập tài khoản</b> để tạo mã QR thanh toán ngân hàng và tích điểm thành viên.</span>
              </div>
            )}

            <Button
              variant={user ? "primary" : "secondary"}
              size="md"
              onClick={handleProceedToCheckout}
              className="w-full gap-2 font-semibold text-xs py-3"
            >
              <span>
                {user
                  ? `Tiến hành thanh toán (${finalTotal.toLocaleString('vi-VN')}đ)`
                  : `Đăng nhập để thanh toán (${finalTotal.toLocaleString('vi-VN')}đ)`}
              </span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-ink-3 hover:text-accent font-medium transition-colors"
              >
                ← Tiếp tục chọn thêm món
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
