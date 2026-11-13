'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductItem } from '@/types';
import { Modal, QuantityStepper, Button } from '@/components/ui';
import { Star, ArrowRight, Check, Coffee, Lock, ShoppingBag, Zap, Ticket, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import {
  SHOP_VOUCHERS,
  QuickVoucher,
  calcDiscountForVoucherList,
  toggleSmartVoucherSelection,
} from '@/lib/vouchers';
import { ALL_TOPPINGS, getToppingsForProduct, ToppingOption } from '@/lib/toppings';
export { ALL_TOPPINGS };
export type { ToppingOption };

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23F4EBE1'/%3E%3Cpath d='M150 210h100v70c0 25-20 45-45 45h-10c-25 0-45-20-45-45v-70z' fill='%234A3728'/%3E%3Cpath d='M250 225h16c8 0 14 6 14 14s-6 14-14 14h-16v-28z' fill='none' stroke='%234A3728' stroke-width='6'/%3E%3Cellipse cx='200' cy='350' rx='70' ry='12' fill='%23D9C7B6'/%3E%3Ctext x='200' y='390' font-family='sans-serif' font-size='15' font-weight='600' text-anchor='middle' fill='%237D5A44'%3EBrewLite Roastery%3C/text%3E%3C/svg%3E";

const SUGAR_LEVELS = ['100% Đường', '70% Đường', '50% Đường', '0% Không đường'];
const ICE_LEVELS = ['100% Đá', '50% Ít đá', '0% Không đá / Nóng'];

interface ProductQuickSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onAddToCart?: (
    item: {
      id: string;
      variantId: string;
      productId: string;
      productName: string;
      imageUrl: string;
      size: 'S' | 'M' | 'L';
      price: number;
      topping: string;
    },
    quantity: number
  ) => void;
  onBuyNow?: (
    item: {
      id: string;
      variantId: string;
      productId: string;
      productName: string;
      imageUrl: string;
      size: 'S' | 'M' | 'L';
      price: number;
      topping: string;
    },
    quantity: number
  ) => void;
}

export const ProductQuickSelectModal: React.FC<ProductQuickSelectModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onBuyNow,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [sugarLevel, setSugarLevel] = useState('100% Đường');
  const [iceLevel, setIceLevel] = useState('100% Đá');
  const [quantity, setQuantity] = useState(1);
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_IMAGE);
  const [selectedVoucherCodes, setSelectedVoucherCodes] = useState<string[]>([]);
  const [usePoints, setUsePoints] = useState(false);
  const [manualVoucherCode, setManualVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const [isVouchersOpen, setIsVouchersOpen] = useState(false);

  const toggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  useEffect(() => {
    if (product) {
      setImgSrc(product.imageUrl || FALLBACK_IMAGE);
      if (product.variants && product.variants.length > 0) {
        const availableVar = product.variants.find((v) => !v.isOutOfStock) || product.variants[0];
        setSelectedSize(availableVar.size as 'S' | 'M' | 'L');
      }
      setSelectedToppings([]);
      setSugarLevel('100% Đường');
      setIceLevel('100% Đá');
      setQuantity(1);
      setSelectedVoucherCodes([]);
      setUsePoints(false);
      setManualVoucherCode('');
      setVoucherError(null);
      setIsVouchersOpen(false);
    }
  }, [product]);

  if (!product || !isOpen) return null;

  const variants = product.variants || [];
  const availableSizes = Array.from(new Set(variants.map((v) => v.size as 'S' | 'M' | 'L')));
  const currentSize = availableSizes.includes(selectedSize) ? selectedSize : availableSizes[0] || 'S';

  const variantsForSize = variants.filter((v) => v.size === currentSize);
  const baseVariant =
    variantsForSize.find((v) => v.topping === 'Tiêu chuẩn') || variantsForSize[0];

  let selectedVariant = baseVariant;
  const hasBoba = selectedToppings.includes('Trân châu đường đen');
  const hasCheese = selectedToppings.includes('Kem Cheese Macchiato');

  if (hasBoba && hasCheese) {
    const combo = variantsForSize.find(
      (v) => v.topping?.includes('Trân châu') && v.topping?.includes('Kem Cheese')
    );
    if (combo) selectedVariant = combo;
  } else if (hasBoba) {
    const single = variantsForSize.find(
      (v) => v.topping?.includes('Trân châu') && !v.topping?.includes('Kem Cheese')
    );
    if (single) selectedVariant = single;
  } else if (hasCheese) {
    const single = variantsForSize.find(
      (v) => v.topping?.includes('Kem Cheese') && !v.topping?.includes('Trân châu')
    );
    if (single) selectedVariant = single;
  }

  const isSelectedVariantOutOfStock = Boolean(selectedVariant?.isOutOfStock) || Boolean(product?.isOutOfStock);

  // Phân phối Topping chính xác theo từng món thực tế
  const toppingsForCategory = getToppingsForProduct(product);

  // Giá gốc theo size đã chọn
  const baseSizePrice = Number(baseVariant?.price || product.minPrice || 0);

  // Tổng tiền các topping đang được tick chọn
  const extraToppingsPrice = selectedToppings.reduce((sum, name) => {
    const opt = ALL_TOPPINGS.find((o) => o.name === name);
    return sum + (opt ? opt.price : 0);
  }, 0);

  // Đơn giá 1 ly = Giá size gốc + tiền các topping
  const unitPrice = baseSizePrice + extraToppingsPrice;
  const totalPrice = unitPrice * (quantity || 1);

  const availablePoints = user?.loyaltyPoints || 0;
  const { totalDiscount: voucherDiscount } = calcDiscountForVoucherList(
    SHOP_VOUCHERS,
    selectedVoucherCodes,
    totalPrice
  );
  const remainingAfterVoucher = Math.max(0, totalPrice - voucherDiscount);
  const maxPointsCanUse = Math.min(availablePoints, Math.floor(remainingAfterVoucher / 100));
  const pointsUsed = usePoints ? maxPointsCanUse : 0;
  const pointsDiscount = pointsUsed * 100;
  const finalPrice = Math.max(0, totalPrice - voucherDiscount - pointsDiscount);
  const totalSavings = totalPrice - finalPrice;

  const handleToggleVoucher = (v: QuickVoucher) => {
    setVoucherError(null);
    const { nextCodes, error } = toggleSmartVoucherSelection(selectedVoucherCodes, v, totalPrice);
    if (error) {
      setVoucherError(error);
      return;
    }
    setSelectedVoucherCodes(nextCodes);
  };

  const handleApplyManualVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualVoucherCode.trim().toUpperCase();
    if (!code) return;
    const found = SHOP_VOUCHERS.find((v) => v.code.toUpperCase() === code);
    if (!found) {
      setVoucherError(`Mã "${code}" không hợp lệ hoặc đã hết hạn.`);
      return;
    }
    handleToggleVoucher(found);
    setManualVoucherCode('');
  };

  const optionsList = [
    ...selectedToppings,
    sugarLevel !== '100% Đường' ? sugarLevel : null,
    iceLevel !== '100% Đá' ? iceLevel : null,
  ].filter(Boolean);
  const toppingLabel = optionsList.length > 0 ? optionsList.join(' · ') : 'Tiêu chuẩn';

  const handleConfirm = (isBuyNow = false) => {
    if (!selectedVariant || isSelectedVariantOutOfStock) return;

    const cartPayload = {
      id: `${selectedVariant.id}:${toppingLabel}`,
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: selectedVariant.size as 'S' | 'M' | 'L',
      price: unitPrice,
      topping: toppingLabel,
    };

    if (isBuyNow) {
      const buyNowItem = {
        ...cartPayload,
        quantity,
        appliedVouchers: selectedVoucherCodes,
        voucherDiscount,
        loyaltyPointsUsed: pointsUsed,
        pointsDiscount,
        finalPrice,
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('brewlite_buy_now_item', JSON.stringify([buyNowItem]));
      }
      onClose();
      if (!user) {
        router.push('/login?redirect=/checkout?buyNow=1');
        return;
      }
      router.push('/checkout?buyNow=1');
    } else {
      if (onAddToCart) {
        onAddToCart(cartPayload, quantity);
      } else {
        addItem(cartPayload, quantity);
      }
      onClose();
    }
  };

  // Sticky footer with quantity stepper, live price with savings breakdown, and action buttons
  const modalFooter = (
    <div className="space-y-3">
      {/* Stepper + Dynamic Price Summary */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-2">Số lượng:</span>
          <QuantityStepper
            value={quantity}
            onChange={(q) => setQuantity(q)}
            min={1}
            max={20}
          />
        </div>

        <div className="text-right">
          <div className="text-[11px] text-ink-3">Tạm tính:</div>
          <div className="flex items-baseline justify-end gap-2">
            {totalSavings > 0 && (
              <span className="text-xs line-through text-ink-3 tabular-nums">
                {Number(totalPrice).toLocaleString('vi-VN')}đ
              </span>
            )}
            <span className="font-display text-lg font-bold text-ink tabular-nums">
              {Number(finalPrice).toLocaleString('vi-VN')}đ
            </span>
          </div>
          {totalSavings > 0 && (
            <span className="inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Tiết kiệm {Number(totalSavings).toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons: Thêm vào giỏ & Mua ngay (hoặc Báo hết hàng nếu out of stock) */}
      {isSelectedVariantOutOfStock ? (
        <div className="space-y-2">
          <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>Món này (hoặc kích cỡ đang chọn) tạm hết nguyên liệu pha chế tại quầy.</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled
            className="w-full opacity-50 cursor-not-allowed font-semibold text-xs py-2.5"
          >
            Tạm hết nguyên liệu pha chế
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => handleConfirm(false)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 font-semibold text-xs border-line-strong hover:border-ink bg-surface text-ink transition-all active:scale-[0.99]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-ink-2" />
            <span>Thêm vào giỏ</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => handleConfirm(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 font-semibold text-xs shadow-sm bg-accent hover:bg-accent-hover text-on-accent transition-all active:scale-[0.99]"
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>Mua ngay</span>
          </Button>
        </div>
      )}

      {/* Micro-notice for applied discounts */}
      {(voucherDiscount > 0 || pointsDiscount > 0) && (
        <div className="flex items-center justify-between text-[10.5px] text-ink-3 px-0.5 pt-0.5 border-t border-line/60">
          <span>
            {voucherDiscount > 0 && `Voucher -${voucherDiscount.toLocaleString('vi-VN')}đ`}
            {voucherDiscount > 0 && pointsDiscount > 0 && ' · '}
            {pointsDiscount > 0 && `Điểm -${pointsDiscount.toLocaleString('vi-VN')}đ`}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã áp dụng ưu đãi</span>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      description={product.description || 'Tùy chọn kích cỡ, đá, đường & topping'}
      maxWidth="lg"
      footer={modalFooter}
    >
      <div className="space-y-4">
        {/* Drink Thumbnail & Quick Summary Bar */}
        <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-line">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface border border-line shadow-xs">
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="56px"
              unoptimized
              onError={() => setImgSrc(FALLBACK_IMAGE)}
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink/10 text-ink">
                  {product.category}
                </span>
                {product.isOutOfStock && (
                  <span className="text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    ⛔ Tạm hết hàng
                  </span>
                )}
                {product.reviewCount && product.reviewCount > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-ink-2 font-medium">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{product.rating}</span>
                    <span className="text-ink-3">({product.reviewCount})</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded">
                    Mới · Chưa có đánh giá
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/products/${product.id}`);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20 transition-all shrink-0 cursor-pointer"
              >
                <span>Chi tiết món</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-ink-2 mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span>Đơn giá:</span>
              <span className="font-semibold text-sm tabular-nums text-ink">
                {Number(unitPrice || 0).toLocaleString('vi-VN')}đ
              </span>
              {extraToppingsPrice > 0 && (
                <span className="text-[10.5px] text-ink-3 font-normal">
                  (Gốc {Number(baseSizePrice).toLocaleString('vi-VN')}đ + {Number(extraToppingsPrice).toLocaleString('vi-VN')}đ topping)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center justify-between">
            <span>Kích cỡ (Size)</span>
            <span className="text-[11px] text-ink-3 font-normal">Bắt buộc chọn 1</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['S', 'M', 'L'] as const).map((size) => {
              const hasSize = availableSizes.includes(size);
              const isSelected = currentSize === size;
              const sizeVariant = variants.find((v) => v.size === size);
              const priceForSize = sizeVariant ? Number(sizeVariant.price) : null;
              const isVariantOutOfStock = Boolean(sizeVariant?.isOutOfStock);
              const disabled = !hasSize || isVariantOutOfStock;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedSize(size)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    disabled
                      ? 'border-line/40 bg-surface-2 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'border-ink bg-surface-2 text-ink shadow-xs ring-2 ring-ink'
                      : 'border-line bg-surface hover:border-line-strong text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Size {size}</span>
                    {isVariantOutOfStock ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-1 rounded">
                        Hết
                      </span>
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
                    ) : null}
                  </div>
                  {priceForSize !== null && (
                    <span className="text-[11px] text-ink-3 block mt-0.5 tabular-nums">
                      {Number(priceForSize || 0).toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization: Độ ngọt & Lượng đá */}
        <div className="space-y-3 pt-2 border-t border-line">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-ink">
              <span>Độ ngọt (Mức đường)</span>
              <span className="text-[11px] font-normal text-ink-3">{sugarLevel}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SUGAR_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSugarLevel(lvl)}
                  className={`py-2 px-1 text-[11px] rounded-md border text-center transition-all ${
                    sugarLevel === lvl
                      ? 'border-ink bg-ink text-white font-medium shadow-xs'
                      : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {lvl.replace(' Đường', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-ink">
              <span>Lượng đá</span>
              <span className="text-[11px] font-normal text-ink-3">{iceLevel}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {ICE_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setIceLevel(lvl)}
                  className={`py-2 px-1 text-[11px] rounded-md border text-center transition-all ${
                    iceLevel === lvl
                      ? 'border-ink bg-ink text-white font-medium shadow-xs'
                      : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topping Selection (Natural scrolling - no nested scroll container) */}
        <div className="space-y-2 pt-2 border-t border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Topping đi kèm</span>
            <span className="text-[11px] text-ink-3 font-medium">
              {selectedToppings.length > 0
                ? `Đã chọn ${selectedToppings.length} topping (+${extraToppingsPrice.toLocaleString('vi-VN')}đ)`
                : 'Tùy chọn nhiều'}
            </span>
          </div>

          <div className="space-y-1.5">
            {toppingsForCategory.map((top) => {
              const isChecked = selectedToppings.includes(top.name);
              return (
                <div
                  key={top.id}
                  onClick={() => toggleTopping(top.name)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer select-none ${
                    isChecked
                      ? 'border-line-strong bg-surface-2 text-ink font-medium ring-1 ring-line-strong'
                      : 'border-line bg-surface hover:bg-surface-2 text-ink-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? 'border-ink bg-ink text-white shadow-xs' : 'border-ink/40 bg-surface'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                    </span>

                    {/* Topping Thumbnail */}
                    <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 border border-line bg-surface-2">
                      <Image
                        src={top.imageUrl}
                        alt={top.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0">
                      <span className="font-medium text-ink block">{top.name}</span>
                      <div className="text-[10.5px] text-ink-3 truncate mt-0.5">{top.desc}</div>
                    </div>
                  </div>

                  <span className="text-ink font-semibold text-xs tabular-nums shrink-0 ml-2">
                    +{top.price.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Voucher / Discount Code Section */}
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setIsVouchersOpen(!isVouchersOpen)}
            className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-accent" />
              <span>Mã giảm giá / Voucher</span>
              {selectedVoucherCodes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {selectedVoucherCodes.length} đã áp dụng
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-ink-3">
              {voucherDiscount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  -{voucherDiscount.toLocaleString('vi-VN')}đ
                </span>
              )}
              <span className="text-[11px] font-normal underline text-accent">
                {isVouchersOpen ? 'Thu gọn' : 'Chọn mã'}
              </span>
            </div>
          </button>

          {isVouchersOpen && (
            <div className="p-3 pt-1 border-t border-line space-y-2.5 bg-surface-2/40 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-3">Nhập mã ưu đãi hoặc chọn từ danh sách:</span>
                {selectedVoucherCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedVoucherCodes([])}
                    className="text-[11px] text-danger hover:underline font-medium"
                  >
                    Gỡ tất cả voucher
                  </button>
                )}
              </div>

              <form onSubmit={handleApplyManualVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={manualVoucherCode}
                  onChange={(e) => setManualVoucherCode(e.target.value)}
                  placeholder="Nhập mã (VD: BREW10)"
                  className="flex-1 h-8 px-2.5 text-xs bg-surface border border-line rounded-md text-ink uppercase placeholder:normal-case placeholder:text-ink-3 focus:border-accent focus:outline-none"
                />
                <Button variant="secondary" size="sm" type="submit">
                  Áp dụng
                </Button>
              </form>

              {voucherError && (
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-md text-[11px] text-danger flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{voucherError}</span>
                </div>
              )}

              {/* Quick-Select Voucher List with clear conditions */}
              <div className="space-y-1.5 pt-0.5">
                {SHOP_VOUCHERS.map((v) => {
                  const isSelected = selectedVoucherCodes.includes(v.code);
                  const isEligible = totalPrice >= v.minOrder;
                  const isMaxDiscount = totalPrice - voucherDiscount <= 0 && !isSelected;
                  const disabled = !isEligible || isMaxDiscount;

                  return (
                    <div
                      key={v.code}
                      onClick={() => {
                        if (!disabled || isSelected) handleToggleVoucher(v);
                      }}
                      className={`p-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                          : isEligible && !isMaxDiscount
                          ? 'bg-surface hover:bg-surface-2 text-ink border-line hover:border-accent'
                          : 'bg-surface-2/40 text-ink-3 border-line/50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-accent/15 text-accent'
                            }`}
                          >
                            {v.code}
                          </span>
                          <span className="font-semibold text-ink text-[11px] truncate">
                            {v.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-ink-3">
                          {isEligible ? (
                            <span>Đơn từ {v.minOrder.toLocaleString('vi-VN')}đ · {v.isStackable ? '⚡ Cộng dồn' : 'Tối đa 1 mã'}</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              Chưa hợp lệ: Đơn cần từ {v.minOrder.toLocaleString('vi-VN')}đ (thiếu {(v.minOrder - totalPrice).toLocaleString('vi-VN')}đ)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={disabled && !isSelected}
                        className={`px-2 py-1 text-[10.5px] font-semibold rounded shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : isEligible && !isMaxDiscount
                            ? 'bg-accent text-on-accent hover:bg-accent-hover'
                            : 'text-ink-3 bg-line/50'
                        }`}
                      >
                        {isSelected ? 'Đã chọn ✓' : isEligible ? 'Chọn' : 'Chưa đủ'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Khung Điểm Thưởng Tích Lũy Thành Viên (1 điểm = 100đ) */}
        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-ink">
            <span className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-400 font-medium">
              <span className="font-serif text-accent">✦</span>
              <span>Điểm Thưởng Tích Lũy</span>
            </span>
            {user ? (
              <span className="text-[11px] text-ink-3">
                Khả dụng: <b className="text-amber-700 dark:text-amber-400 font-mono">{availablePoints} điểm</b> ({Number(availablePoints * 100).toLocaleString('vi-VN')}đ)
              </span>
            ) : (
              <span className="text-[10.5px] text-ink-3">1 điểm = 100đ</span>
            )}
          </div>

          {user ? (
            maxPointsCanUse > 0 ? (
              <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                usePoints
                  ? 'bg-amber-100/60 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600'
                  : 'bg-surface border-line hover:border-amber-300'
              }`}>
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-amber-600 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink text-xs flex items-center justify-between">
                    <span>Dùng {maxPointsCanUse} điểm tích lũy</span>
                    <span className="text-amber-800 dark:text-amber-300 font-bold font-mono">
                      -{Number(maxPointsCanUse * 100).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <p className="text-[10.5px] text-ink-3 mt-0.5">
                    {usePoints
                      ? `Đã áp dụng giảm ${Number(pointsDiscount).toLocaleString('vi-VN')}đ (1 điểm = 100đ)`
                      : `Tick chọn để giảm ${Number(maxPointsCanUse * 100).toLocaleString('vi-VN')}đ cho đơn hàng này`}
                  </p>
                </div>
              </label>
            ) : (
              <div className="text-[11px] text-ink-3 p-2 bg-surface/60 rounded-md border border-line/60">
                {availablePoints === 0
                  ? 'Bạn chưa có điểm tích lũy. Tích lũy 5% giá trị mỗi đơn khi thanh toán thành công!'
                  : 'Đơn hàng đã được giảm tối đa hoặc không cần dùng thêm điểm thưởng.'}
              </div>
            )
          ) : (
            <div className="flex items-center justify-between text-[11px] text-ink-2 p-2 bg-surface/60 rounded-md border border-line/60">
              <span>Đăng nhập để dùng điểm thưởng tích lũy (1 điểm = 100đ).</span>
              <Link
                href="/login?redirect=/checkout"
                className="text-accent hover:underline font-semibold text-[11px] shrink-0 ml-2"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

