'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductItem } from '@/types';
import { Modal, QuantityStepper, Button } from '@/components/ui';
import { Star, ArrowRight, Check, Coffee, Lock, ShoppingBag, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23F4EBE1'/%3E%3Cpath d='M150 210h100v70c0 25-20 45-45 45h-10c-25 0-45-20-45-45v-70z' fill='%234A3728'/%3E%3Cpath d='M250 225h16c8 0 14 6 14 14s-6 14-14 14h-16v-28z' fill='none' stroke='%234A3728' stroke-width='6'/%3E%3Cellipse cx='200' cy='350' rx='70' ry='12' fill='%23D9C7B6'/%3E%3Ctext x='200' y='390' font-family='sans-serif' font-size='15' font-weight='600' text-anchor='middle' fill='%237D5A44'%3EBrewLite Roastery%3C/text%3E%3C/svg%3E";

import { ALL_TOPPINGS, getToppingsForProduct, ToppingOption } from '@/lib/toppings';
export { ALL_TOPPINGS };
export type { ToppingOption };

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
        const firstVar = product.variants[0];
        setSelectedSize(firstVar.size as 'S' | 'M' | 'L');
      }
      setSelectedToppings([]);
      setSugarLevel('100% Đường');
      setIceLevel('100% Đá');
      setQuantity(1);
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

  // Phân phối Topping chính xác theo từng món thực tế (Trà đào/vải -> thạch đào/nha đam; Trà sữa -> trân châu/khúc bạch; Cà phê -> espresso/cheese)
  const toppingsForCategory = getToppingsForProduct(product);

  // Giá gốc theo size đã chọn
  const baseSizePrice = Number(baseVariant?.price || product.minPrice || 0);

  // Tổng tiền các topping đang được tick chọn
  const extraToppingsPrice = selectedToppings.reduce((sum, name) => {
    const opt = ALL_TOPPINGS.find((o) => o.name === name);
    return sum + (opt ? opt.price : 0);
  }, 0);

  // Đơn giá 1 ly = Giá size gốc + tiền các topping (TĂNG GIẢM NGAY LẬP TỨC khi tick chọn)
  const unitPrice = baseSizePrice + extraToppingsPrice;
  const totalPrice = unitPrice * (quantity || 1);

  const optionsList = [
    ...selectedToppings,
    sugarLevel !== '100% Đường' ? sugarLevel : null,
    iceLevel !== '100% Đá' ? iceLevel : null,
  ].filter(Boolean);
  const toppingLabel = optionsList.length > 0 ? optionsList.join(' · ') : 'Tiêu chuẩn';

  const handleConfirm = (isBuyNow = false) => {
    if (!selectedVariant) return;

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
      if (onBuyNow) {
        onBuyNow(cartPayload, quantity);
        onClose();
        return;
      }
      addItem(cartPayload, quantity);
      onClose();
      if (!user) {
        return;
      }
      router.push('/cart');
    } else {
      if (onAddToCart) {
        onAddToCart(cartPayload, quantity);
      } else {
        addItem(cartPayload, quantity);
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      description={product.description || 'Tùy chọn kích cỡ & số lượng'}
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Drink Thumbnail Bar */}
        <div className="flex items-center gap-3 p-2.5 bg-surface-2 rounded border border-line">
          <div className="relative w-14 h-14 rounded overflow-hidden shrink-0 bg-surface border border-line">
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink/10 text-ink">
                  {product.category}
                </span>
                {product.rating && (
                  <span className="flex items-center gap-0.5 text-xs text-ink-2 font-medium">
                    <Star className="w-3 h-3 text-ink fill-ink" />
                    {product.rating}
                  </span>
                )}
              </div>
              <Link
                href={`/products/${product.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline bg-accent/10 px-2 py-0.5 rounded border border-accent/20 transition-all shrink-0"
              >
                <span>Xem chi tiết & đánh giá</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs font-semibold text-accent mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Đơn giá:</span>
              <span className="font-bold text-sm tabular-nums text-accent">
                {Number(unitPrice || 0).toLocaleString('vi-VN')}đ
              </span>
              {extraToppingsPrice > 0 && (
                <span className="text-[10px] text-accent/80 font-normal">
                  (Gốc {Number(baseSizePrice).toLocaleString('vi-VN')}đ + {Number(extraToppingsPrice).toLocaleString('vi-VN')}đ topping)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink flex items-center justify-between">
            <span>Kích cỡ (Size)</span>
            <span className="text-[11px] text-ink-3">Chọn 1</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['S', 'M', 'L'] as const).map((size) => {
              const hasSize = availableSizes.includes(size);
              const isSelected = currentSize === size;
              const sizeVariant = variants.find((v) => v.size === size);
              const priceForSize = sizeVariant ? Number(sizeVariant.price) : null;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={!hasSize}
                  onClick={() => setSelectedSize(size)}
                  className={`p-2 rounded border text-left transition-all ${
                    !hasSize
                      ? 'border-line/40 bg-surface-2 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'border-ink bg-surface-2 text-ink shadow-sm ring-1 ring-ink'
                      : 'border-line bg-surface hover:border-line-strong text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Size {size}</span>
                    {isSelected && <Check className="w-3 h-3 text-ink" strokeWidth={2.5} />}
                  </div>
                  {priceForSize !== null && (
                    <span className="text-[11px] text-ink-3 block mt-0.5">
                      {Number(priceForSize || 0).toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mức đường & Mức đá (Chuẩn đặt đồ uống Highlands / Phê La / ShopeeFood) */}
        <div className="space-y-3 pt-2 border-t border-line">
          <div className="space-y-1">
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
                  className={`py-1.5 px-1 text-[11px] rounded border text-center transition-all ${
                    sugarLevel === lvl
                      ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                      : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {lvl.replace(' Đường', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
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
                  className={`py-1.5 px-1 text-[11px] rounded border text-center transition-all ${
                    iceLevel === lvl
                      ? 'border-accent bg-accent text-white font-semibold shadow-xs'
                      : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topping Selection (Chuẩn mô típ ShopeeFood / GrabFood: Checkbox chọn nhiều, CÓ ẢNH MINH HỌA) */}
        <div className="space-y-1.5 pt-2 border-t border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Topping đi kèm (chọn nhiều)</span>
            <span className="text-[11px] text-accent font-medium">
              {selectedToppings.length > 0
                ? `Đã chọn ${selectedToppings.length} topping (+${extraToppingsPrice.toLocaleString('vi-VN')}đ)`
                : 'Tùy chọn thêm'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {toppingsForCategory.map((top) => {
              const isChecked = selectedToppings.includes(top.name);
              return (
                <div
                  key={top.id}
                  onClick={() => toggleTopping(top.name)}
                  className={`p-2 rounded border text-left text-xs transition-all flex items-center justify-between cursor-pointer select-none ${
                    isChecked
                      ? 'border-accent bg-accent/5 text-ink font-medium ring-1 ring-accent'
                      : 'border-line bg-surface hover:bg-surface-2 text-ink-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? 'border-accent bg-accent text-white shadow-xs' : 'border-ink/40 bg-surface'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                    </span>

                    {/* Hình ảnh minh họa Topping */}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink">{top.name}</span>
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                          +{top.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-3 truncate mt-0.5">{top.desc}</div>
                    </div>
                  </div>

                  <span className="text-accent font-semibold text-xs tabular-nums shrink-0 ml-2">
                    +{top.price.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between pt-2 border-t border-line">
          <span className="text-xs font-medium text-ink">Số lượng ly</span>
          <QuantityStepper
            value={quantity}
            onChange={(q) => setQuantity(q)}
            min={1}
            max={20}
          />
        </div>

        {/* Actions: Thêm vào giỏ & Mua ngay */}
        <div className="pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleConfirm(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 font-semibold text-xs border-ink/30 hover:border-ink"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Thêm vào giỏ</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => handleConfirm(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 font-semibold text-xs shadow-sm bg-accent hover:bg-accent-hover text-on-accent"
            >
              <Zap className="w-4 h-4 shrink-0 fill-current" />
              <span>Mua ngay</span>
            </Button>
          </div>

          <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-ink-3">
            <div>
              <span>Tạm tính: </span>
              <strong className="text-accent font-bold text-sm tabular-nums">
                {Number(totalPrice || 0).toLocaleString('vi-VN')}đ
              </strong>
              {quantity > 1 && (
                <span className="text-[10px] text-ink-3 ml-1 font-normal inline">
                  ({Number(unitPrice).toLocaleString('vi-VN')}đ × {quantity} ly)
                </span>
              )}
            </div>
            <Link
              href={`/products/${product.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline shrink-0 ml-2"
            >
              <span>Xem chi tiết & đánh giá</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};

