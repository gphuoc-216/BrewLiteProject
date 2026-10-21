'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchApi } from '@/lib/api';
import { MOCK_PRODUCTS } from '@/lib/mockProducts';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, QuantityStepper, Toast, Skeleton, EmptyState } from '@/components/ui';
import { ArrowLeft, Star, Check, Lock, ShoppingBag, Zap } from 'lucide-react';
import { ProductVariant } from '@/types';

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  avgRating?: number;
  reviewCount?: number;
  variants: ProductVariant[];
  reviews?: Array<{
    id: string;
    stars: number;
    content: string;
    createdAt: string;
    customer: { fullName: string };
  }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedToppingName, setSelectedToppingName] = useState<string>('Tiêu chuẩn');
  const [quantity, setQuantity] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await fetchApi<ProductDetail>(`/products/${params.id}`);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedSize(firstVariant.size);
          setSelectedToppingName(firstVariant.topping || 'Tiêu chuẩn');
        }
      } catch {
        const found = MOCK_PRODUCTS.find((p) => p.id === params.id) || MOCK_PRODUCTS[0];
        if (found) {
          const fallbackData: ProductDetail = {
            id: found.id,
            name: found.name,
            category: found.category,
            imageUrl: found.imageUrl,
            description: found.description,
            avgRating: found.rating,
            reviewCount: found.reviewCount,
            variants: found.variants,
            reviews: found.reviews || [
              {
                id: 'rev-default',
                stars: 5,
                content: 'Món này pha chế rất ngon và chuẩn vị.',
                createdAt: '2026-03-25',
                customer: { fullName: 'Khách quen' },
              },
            ],
          };
          setProduct(fallbackData);
          if (fallbackData.variants.length > 0) {
            setSelectedSize(fallbackData.variants[0].size);
            setSelectedToppingName(fallbackData.variants[0].topping || 'Tiêu chuẩn');
          }
        }
      } finally {
        setLoading(false);
      }
    }

    if (params.id) loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-[4/5]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !product.variants || product.variants.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="Không tìm thấy món uống"
          description="Sản phẩm bạn đang tìm không tồn tại hoặc đã ngừng phục vụ."
          actionLabel="Quay lại thực đơn"
          onAction={() => router.push('/')}
        />
      </div>
    );
  }

  // Danh sách các size thực tế có trong variants từ API
  const availableSizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const currentSize = availableSizes.includes(selectedSize) ? selectedSize : availableSizes[0];

  // Các biến thể theo size đã chọn
  const variantsForSize = product.variants.filter((v) => v.size === currentSize);

  // Danh sách topping thực tế cho size này từ API (mỗi tổ hợp size + topping là một variantId)
  const availableToppings = variantsForSize.map((v) => ({
    variantId: v.id,
    name: v.topping || 'Tiêu chuẩn',
    price: Number(v.price),
  }));

  // Biến thể đã chọn tương ứng với size và topping thực tế
  const selectedVariant =
    variantsForSize.find((v) => (v.topping || 'Tiêu chuẩn') === selectedToppingName) ||
    variantsForSize[0];

  const unitPrice = selectedVariant ? Number(selectedVariant.price) : 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = (isBuyNow = false) => {
    if (!user) {
      setToastMsg('⚠️ Bạn cần đăng nhập tài khoản trước khi tiếp tục!');
      setTimeout(() => {
        const redirectTarget = isBuyNow ? '/checkout' : `/products/${product.id}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      }, 400);
      return;
    }

    if (!selectedVariant) return;

    addItem(
      {
        id: `${selectedVariant.id}:${selectedVariant.topping || 'default'}`,
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        size: selectedVariant.size,
        price: unitPrice,
        topping: selectedVariant.topping || 'Tiêu chuẩn',
      },
      quantity
    );

    if (isBuyNow) {
      router.push('/checkout');
    } else {
      setToastMsg(
        `Đã thêm ${quantity} ly ${product.name} (Size ${selectedVariant.size} - ${selectedVariant.topping || 'Tiêu chuẩn'}) vào giỏ hàng.`
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMsg && (
        <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />
      )}

      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Về thực đơn</span>
        </Link>
      </div>

      {/* 2-Column Product Detail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Product Image */}
        <div className="border border-line rounded bg-surface overflow-hidden">
          <div className="relative w-full aspect-[4/5] bg-surface-2">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Right: Options & Pricing */}
        <div className="space-y-6">
          <div className="space-y-2 border-b border-line pb-4">
            {product.avgRating && (
              <div className="flex items-center gap-1 text-xs text-ink-2">
                <Star className="w-3 h-3 text-ink fill-ink" strokeWidth={1.5} />
                <span className="font-semibold text-ink tabular-nums">{product.avgRating}</span>
                <span className="text-ink-3">({product.reviewCount || 0} lượt đánh giá)</span>
              </div>
            )}
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              {product.name}
            </h1>
            <p className="text-xs text-ink-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Size Selection: Segmented Control */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-ink block">Kích cỡ ly</span>
            <div className="grid grid-cols-3 gap-2">
              {availableSizes.map((size) => {
                const sampleVariant = product.variants.find((v) => v.size === size);
                const isSelected = currentSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      const firstForSize = product.variants.find((v) => v.size === size);
                      if (firstForSize) setSelectedToppingName(firstForSize.topping || 'Tiêu chuẩn');
                    }}
                    className={`py-2 px-3 text-center border rounded transition-colors text-xs font-medium ${
                      isSelected
                        ? 'border-ink bg-ink text-white font-semibold'
                        : 'border-line bg-surface text-ink hover:bg-surface-2'
                    }`}
                  >
                    <span className="block font-display text-sm">Size {size}</span>
                    <span className="block text-[11px] opacity-80 tabular-nums">
                      {sampleVariant ? Number(sampleVariant.price).toLocaleString('vi-VN') : 0}đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topping / Biến thể thực tế theo ChiTietSanPham */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-ink block">Topping & Biến thể món</span>
            <div className="space-y-1.5">
              {availableToppings.map((top) => {
                const isSelected = (selectedVariant?.topping || 'Tiêu chuẩn') === top.name;
                return (
                  <label
                    key={top.variantId}
                    onClick={() => setSelectedToppingName(top.name)}
                    className={`flex items-center justify-between p-2.5 border rounded cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'border-line-strong bg-surface-2 text-ink font-medium'
                        : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-accent bg-accent' : 'border-line-strong'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-on-accent" strokeWidth={2.5} />
                        )}
                      </span>
                      <span>{top.name}</span>
                    </span>
                    <span className="text-ink font-semibold tabular-nums">
                      {Number(top.price || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Quantity & CTA */}
          <div className="space-y-3 pt-4 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Số lượng ly</span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={20}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-ink-2">Tạm tính:</span>
              <span className="font-display text-xl font-semibold text-ink tabular-nums">
                {Number(totalPrice || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            {!user && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bạn cần <b>đăng nhập</b> để thêm món hoặc mua ngay.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleAddToCart(false)}
                className="w-full text-sm font-semibold flex items-center justify-center gap-2 border-ink/30 hover:border-ink"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm vào giỏ</span>
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={() => handleAddToCart(true)}
                className="w-full text-sm font-semibold flex items-center justify-center gap-2 shadow-sm bg-accent hover:bg-accent-hover text-on-accent"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mua ngay</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="border-t border-line pt-8 space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Đánh giá từ khách hàng ({product.reviews.length})
          </h2>
          <div className="divide-y divide-line border-y border-line text-xs">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{rev.customer?.fullName || 'Khách hàng'}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= rev.stars ? 'text-ink fill-ink' : 'text-line'}`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-ink-2 leading-relaxed">{rev.content}</p>
                <span className="text-[11px] text-ink-3 block">{rev.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
