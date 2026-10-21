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
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

interface AvailableVoucher {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  badge: string;
  description: string;
  isEligible: boolean;
  missingAmount: number;
  progressPercent: number;
}

const DEFAULT_VOUCHERS: AvailableVoucher[] = [
  {
    id: 'promo-1',
    code: 'BREW10',
    name: 'Voucher Bạn Mới - Giảm 10%',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 40000,
    maxDiscount: 15000,
    badge: 'Giảm 10%',
    description: 'Giảm 10% (tối đa 15.000đ) cho đơn từ 40.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-2',
    code: 'GIAM20K',
    name: 'Ưu Đãi Giờ Vàng - Giảm 20K',
    discountType: 'FIXED',
    discountValue: 20000,
    minOrderValue: 60000,
    maxDiscount: 20000,
    badge: 'Giảm 20K',
    description: 'Giảm ngay 20.000đ cho đơn hàng từ 60.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-3',
    code: 'FREESHIP',
    name: 'Freeship Extra - Giảm 15K',
    discountType: 'FIXED',
    discountValue: 15000,
    minOrderValue: 50000,
    maxDiscount: 15000,
    badge: 'Freeship Extra',
    description: 'Miễn phí vận chuyển / dịch vụ 15.000đ cho đơn từ 50.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-4',
    code: 'TIKTOK30',
    name: 'TikTok Mega Live - Giảm 30%',
    discountType: 'PERCENT',
    discountValue: 30,
    minOrderValue: 80000,
    maxDiscount: 25000,
    badge: 'TikTok Live',
    description: 'Giảm 30% (tối đa 25.000đ) cho đơn từ 80.000đ',
    isEligible: false,
    missingAmount: 0,
    progressPercent: 0,
  },
  {
    id: 'promo-5',
    code: 'GIAM50K',
    name: 'Tiệc Nhóm Đồng Nghiệp - Giảm 50K',
    discountType: 'FIXED',
    discountValue: 50000,
    minOrderValue: 120000,
    maxDiscount: 50000,
    badge: 'Giảm 50K',
    description: 'Giảm 50.000đ cho đơn từ 120.000đ (Tiệc nhóm bạn)',
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
    applyPromotion,
    removePromotion,
    getSubtotal,
    getFinalTotal,
  } = useCartStore();
  const { user } = useAuthStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showVoucherWallet, setShowVoucherWallet] = useState(true);
  const [vouchers, setVouchers] = useState<AvailableVoucher[]>(DEFAULT_VOUCHERS);

  const subtotal = getSubtotal();
  const finalTotal = getFinalTotal();
  const discountAmount = promotion ? promotion.discountAmount : 0;

  // Tính toán tiến trình và tính khả dụng của voucher theo subtotal hiện tại
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

      const calculated = DEFAULT_VOUCHERS.map((v) => {
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

  // Kiểm tra nếu tổng đơn tụt xuống dưới điều kiện của voucher đã áp dụng thì tự động gỡ
  useEffect(() => {
    if (promotion) {
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
  }, [subtotal, promotion, vouchers, removePromotion]);

  const handleApplySpecificCoupon = async (code: string) => {
    const targetCode = code.trim().toUpperCase();
    if (!targetCode) return;

    try {
      setCouponLoading(true);
      setCouponError(null);

      // Thử gọi backend validate
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
      // Local fallback calculation based on tiered rules
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
        description={`Đang có ${items.length} món uống được chọn.`}
        action={
          <button
            onClick={clearCart}
            className="text-xs text-ink-3 hover:text-danger transition-colors"
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
        </div>

        {/* Right: Sticky Order Summary & Voucher Wallet (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-surface border border-line rounded p-5 space-y-4 shadow-sm">
            <h2 className="font-display text-base font-semibold text-ink border-b border-line pb-3">
              Tóm tắt đơn hàng
            </h2>

            {/* Subtotal & Discount rows */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-ink-2">
                <span>Tiền hàng</span>
                <span className="font-semibold text-ink tabular-nums">
                  {subtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {promotion && (
                <div className="flex justify-between text-success">
                  <span>Mã {promotion.code}</span>
                  <span className="font-semibold tabular-nums">
                    -{discountAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>

            {/* Promotion Coupon Manual Input Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-2 border-t border-line">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã (BREW10, GIAM20K...)"
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

              {promotion && (
                <div className="flex items-center justify-between text-[11.5px] text-success pt-1 font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded border border-emerald-300 dark:border-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã áp dụng: <b>{promotion.code}</b> ({promotion.name})</span>
                  </span>
                  <button
                    type="button"
                    onClick={removePromotion}
                    className="text-danger hover:underline ml-2 text-xs shrink-0 font-semibold"
                  >
                    Gỡ mã
                  </button>
                </div>
              )}
            </form>

            {/* Shopee / TikTok Style Tiered Voucher Wallet Section */}
            <div className="pt-2 border-t border-line space-y-2">
              <button
                type="button"
                onClick={() => setShowVoucherWallet(!showVoucherWallet)}
                className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-ink hover:text-accent transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-accent" />
                  <span>Kho Voucher Quán (Shopee / TikTok Style)</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-accent/10 text-accent text-[10px]">
                    {vouchers.filter((v) => v.isEligible).length}/{vouchers.length}
                  </span>
                </span>
                {showVoucherWallet ? (
                  <ChevronUp className="w-4 h-4 text-ink-3" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-3" />
                )}
              </button>

              {showVoucherWallet && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 pt-1">
                  {vouchers.map((v) => {
                    const isApplied = promotion?.code?.toUpperCase() === v.code.toUpperCase();

                    return (
                      <div
                        key={v.id}
                        className={`p-2.5 rounded border transition-all text-xs ${
                          isApplied
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                            : v.isEligible
                            ? 'border-line hover:border-accent bg-surface'
                            : 'border-line/60 bg-surface-2/60 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-accent text-on-accent">
                                {v.badge}
                              </span>
                              <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">
                                {v.code}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-ink font-medium leading-tight">
                              {v.description}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0">
                            {isApplied ? (
                              <button
                                type="button"
                                onClick={removePromotion}
                                className="px-2.5 py-1 text-[11px] font-semibold text-danger border border-danger/30 rounded hover:bg-danger/10 transition-colors"
                              >
                                Đang dùng
                              </button>
                            ) : v.isEligible ? (
                              <button
                                type="button"
                                disabled={couponLoading}
                                onClick={() => handleApplySpecificCoupon(v.code)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-on-accent bg-accent hover:bg-accent-hover rounded shadow-sm transition-colors"
                              >
                                Áp dụng
                              </button>
                            ) : (
                              <Link
                                href="/"
                                className="px-2 py-1 text-[10.5px] font-medium text-ink-2 bg-surface border border-line rounded hover:border-ink hover:text-ink transition-colors block text-center"
                              >
                                Mua thêm
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar (Shopee / TikTok style: "Mua thêm X để nhận voucher") */}
                        <div className="mt-2 pt-1.5 border-t border-line/50 space-y-1">
                          <div className="flex items-center justify-between text-[10.5px]">
                            {v.isEligible ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đạt điều kiện (Đơn từ {v.minOrderValue.toLocaleString('vi-VN')}đ)</span>
                              </span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">
                                Mua thêm <b>{v.missingAmount.toLocaleString('vi-VN')}đ</b> để áp dụng mã
                              </span>
                            )}
                            <span className="text-ink-3 font-mono">{v.progressPercent}%</span>
                          </div>

                          <div className="w-full h-1.5 bg-line/80 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                v.isEligible ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${v.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Final Total */}
            <div className="pt-3 border-t border-line flex items-baseline justify-between">
              <span className="text-xs font-semibold text-ink">Thanh toán</span>
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">
                {finalTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Login Notice for Guests */}
            {!user && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-[11.5px] text-amber-900 dark:text-amber-200 leading-relaxed">
                <span>⚠️ Bạn cần <b>đăng nhập tài khoản</b> để hệ thống xuất mã thanh toán VietQR và tích điểm thành viên.</span>
              </div>
            )}

            <Button
              variant={user ? "primary" : "secondary"}
              size="md"
              onClick={handleProceedToCheckout}
              className="w-full gap-2 font-semibold text-xs"
            >
              <span>{user ? 'Tiến hành thanh toán' : 'Đăng nhập để thanh toán'}</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

