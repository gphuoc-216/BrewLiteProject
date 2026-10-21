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
  const [selectedToppingName, setSelectedToppingName] = useState<string>('Tiêu chuẩn');
  const [quantity, setQuantity] = useState(1);
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_IMAGE);

  useEffect(() => {
    if (product) {
      setImgSrc(product.imageUrl || FALLBACK_IMAGE);
      if (product.variants && product.variants.length > 0) {
        const firstVar = product.variants[0];
        setSelectedSize(firstVar.size as 'S' | 'M' | 'L');
        setSelectedToppingName(firstVar.topping || 'Tiêu chuẩn');
      }
      setQuantity(1);
    }
  }, [product]);

  if (!product || !isOpen) return null;

  const variants = product.variants || [];
  const availableSizes = Array.from(new Set(variants.map((v) => v.size as 'S' | 'M' | 'L')));
  const currentSize = availableSizes.includes(selectedSize) ? selectedSize : availableSizes[0] || 'S';

  const variantsForSize = variants.filter((v) => v.size === currentSize);
  const availableToppings = variantsForSize.map((v) => ({
    variantId: v.id,
    name: v.topping || 'Tiêu chuẩn',
    price: Number(v.price),
  }));

  const selectedVariant =
    variantsForSize.find((v) => (v.topping || 'Tiêu chuẩn') === selectedToppingName) ||
    variantsForSize[0];

  const unitPrice = selectedVariant ? Number(selectedVariant.price) || 0 : Number(product.minPrice) || 0;
  const totalPrice = unitPrice * (quantity || 1);

  const handleConfirm = (isBuyNow = false) => {
    if (!user) {
      onClose();
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const redirectTarget = isBuyNow ? '/checkout' : currentPath;
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    if (!selectedVariant) return;

    const cartPayload = {
      id: `${selectedVariant.id}:${selectedVariant.topping || 'default'}`,
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: selectedVariant.size as 'S' | 'M' | 'L',
      price: unitPrice,
      topping: selectedVariant.topping || 'Tiêu chuẩn',
    };

    if (isBuyNow) {
      if (onBuyNow) {
        onBuyNow(cartPayload, quantity);
      } else {
        addItem(cartPayload, quantity);
      }
      onClose();
      router.push('/checkout');
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
            <p className="text-xs font-semibold text-accent mt-1">
              Đơn giá hiện tại: {Number(unitPrice || 0).toLocaleString('vi-VN')}đ
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

        {/* Topping Selection (nếu có) */}
        {availableToppings.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink flex items-center justify-between">
              <span>Topping kèm theo</span>
              <span className="text-[11px] text-ink-3">Tùy chọn</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableToppings.map((top) => {
                const isSelected = (selectedVariant?.topping || 'Tiêu chuẩn') === top.name;
                return (
                  <button
                    key={top.variantId}
                    type="button"
                    onClick={() => setSelectedToppingName(top.name)}
                    className={`p-2 rounded border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-ink bg-surface-2 text-ink font-medium shadow-sm'
                        : 'border-line bg-surface hover:border-line-strong text-ink-2'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{top.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-ink shrink-0" strokeWidth={2.5} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {/* Login Notice for Unauthenticated Users */}
        {!user && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bạn cần <b>đăng nhập</b> để thêm món hoặc mua ngay.</span>
          </div>
        )}

        {/* Actions: Thêm vào giỏ & Mua ngay (Shopee/TikTok Style) */}
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
            <span>
              Tổng cộng: <strong className="text-ink font-semibold">{Number(totalPrice || 0).toLocaleString('vi-VN')}đ</strong>
            </span>
            <Link
              href={`/products/${product.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-ink-3 hover:text-ink transition-colors"
            >
              <span>Trang đánh giá</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};

