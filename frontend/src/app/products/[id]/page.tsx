'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchApi } from '@/lib/api';
import { MOCK_PRODUCTS } from '@/lib/mockProducts';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, QuantityStepper, Toast, Skeleton, EmptyState, Modal } from '@/components/ui';
import { ArrowLeft, Star, Check, Lock, ShoppingBag, Zap, Ticket, AlertCircle, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { ProductVariant } from '@/types';
import {
  SHOP_VOUCHERS,
  QuickVoucher,
  calcDiscountForVoucherList,
  toggleSmartVoucherSelection,
} from '@/lib/vouchers';
import { ALL_TOPPINGS, getToppingsForProduct } from '@/lib/toppings';

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  avgRating?: number;
  rating?: number;
  reviewCount?: number;
  isOutOfStock?: boolean;
  variants: ProductVariant[];
  reviews?: Array<{
    id: string;
    customerId?: string;
    stars: number;
    content: string;
    createdAt: string;
    customer: { fullName: string };
  }>;
}

const SUGAR_LEVELS = ['100% Đường', '70% Đường', '50% Đường', '0% Không đường'];
const ICE_LEVELS = ['100% Đá', '50% Ít đá', '0% Không đá / Nóng'];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [sugarLevel, setSugarLevel] = useState('100% Đường');
  const [iceLevel, setIceLevel] = useState('100% Đá');
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'danger' | 'info';
    action?: { label: string; href?: string; onClick?: () => void };
  } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<{ id: string; content: string } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [selectedVoucherCodes, setSelectedVoucherCodes] = useState<string[]>([]);
  const [usePoints, setUsePoints] = useState(false);
  const [manualVoucherCode, setManualVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const checkIsReviewOwner = (rev: { id: string; customerId?: string; customer?: { fullName: string } }) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (rev.customerId) {
      if (
        rev.customerId === user.profileId ||
        rev.customerId === user.id ||
        rev.customerId === user.accountId ||
        rev.customerId === (user as any).customerId
      ) {
        return true;
      }
    }
    if (rev.customer?.fullName && user.fullName) {
      if (rev.customer.fullName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const handleStartEditReview = (rev: { id: string; stars: number; content: string }) => {
    setEditingReviewId(rev.id);
    setReviewStars(rev.stars);
    setReviewContent(rev.content);
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setEditingReviewId(null);
    setReviewContent('');
    setReviewError(null);
  };

  const handleOpenReviewModal = async () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
      return;
    }

    // Nếu người dùng đã từng đánh giá món này, tự động mở modal ở chế độ chỉnh sửa
    const existing = product?.reviews?.find(checkIsReviewOwner);
    if (existing) {
      handleStartEditReview(existing);
      return;
    }

    try {
      setEditingReviewId(null);
      setReviewStars(5);
      setReviewContent('');
      setReviewError(null);
      let orderIdToUse: string | null = null;
      try {
        const myOrders = await fetchApi<any[]>('/orders/me');
        if (Array.isArray(myOrders) && myOrders.length > 0) {
          const matchingOrder = myOrders.find((o) =>
            ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(o.status) &&
            o.items?.some((item: any) => item.variant?.productId === product?.id || item.variant?.product?.id === product?.id)
          );
          if (matchingOrder) {
            orderIdToUse = matchingOrder.id;
          } else {
            const anyPaid = myOrders.find((o) => ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(o.status));
            if (anyPaid) orderIdToUse = anyPaid.id;
          }
        }
      } catch {}

      setEligibleOrderId(orderIdToUse);
      setReviewModalOpen(true);
    } catch {
      setReviewModalOpen(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewContent.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá của bạn.');
      return;
    }
    try {
      setReviewSubmitting(true);
      setReviewError(null);

      if (editingReviewId) {
        // CẬP NHẬT ĐÁNH GIÁ (PATCH /api/reviews/:id)
        await fetchApi<any>(`/reviews/${editingReviewId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            stars: reviewStars,
            content: reviewContent.trim(),
          }),
        });

        setProduct((prev) => {
          if (!prev) return null;
          const updatedReviews = (prev.reviews || []).map((r) =>
            r.id === editingReviewId
              ? { ...r, stars: reviewStars, content: reviewContent.trim() }
              : r
          );
          const totalStars = updatedReviews.reduce((sum, r) => sum + r.stars, 0);
          return {
            ...prev,
            reviews: updatedReviews,
            avgRating: updatedReviews.length > 0 ? Number((totalStars / updatedReviews.length).toFixed(1)) : undefined,
          };
        });

        setToast({ message: '✨ Cập nhật đánh giá món uống thành công!', type: 'success' });
        handleCloseReviewModal();
      } else {
        // TẠO MỚI ĐÁNH GIÁ (POST /api/reviews)
        const res = await fetchApi<any>('/reviews', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.id,
            orderId: eligibleOrderId || undefined,
            stars: reviewStars,
            content: reviewContent.trim(),
          }),
        });

        const newRev = {
          id: res?.id || 'rev-' + Date.now(),
          customerId: res?.customerId || user?.profileId || user?.id,
          stars: reviewStars,
          content: reviewContent.trim(),
          createdAt: new Date().toISOString(),
          customer: { fullName: res?.customer?.fullName || user?.fullName || user?.username || 'Khách hàng' },
        };

        setProduct((prev) => {
          if (!prev) return null;
          const updatedReviews = [newRev, ...(prev.reviews || [])];
          const totalStars = updatedReviews.reduce((sum, r) => sum + r.stars, 0);
          return {
            ...prev,
            reviews: updatedReviews,
            reviewCount: updatedReviews.length,
            avgRating: Number((totalStars / updatedReviews.length).toFixed(1)),
          };
        });

        setToast({ message: '🎉 Đánh giá của bạn đã được ghi nhận vào hệ thống thành công!', type: 'success' });
        handleCloseReviewModal();
      }

      // Lấy dữ liệu mới nhất đồng bộ từ database
      try {
        const fresh = await fetchApi<ProductDetail>(`/products/${product.id}`);
        if (fresh && Array.isArray(fresh.reviews)) {
          setProduct(fresh);
        }
      } catch {}
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : 'Không thể lưu đánh giá.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete || !product) return;
    try {
      setDeleteSubmitting(true);
      await fetchApi(`/reviews/${reviewToDelete.id}`, {
        method: 'DELETE',
      });

      setProduct((prev) => {
        if (!prev) return null;
        const updatedReviews = (prev.reviews || []).filter((r) => r.id !== reviewToDelete.id);
        const totalStars = updatedReviews.reduce((sum, r) => sum + r.stars, 0);
        return {
          ...prev,
          reviews: updatedReviews,
          reviewCount: updatedReviews.length,
          avgRating: updatedReviews.length > 0 ? Number((totalStars / updatedReviews.length).toFixed(1)) : undefined,
        };
      });

      setToast({ message: '🗑️ Đã xóa đánh giá của bạn thành công.', type: 'info' });
      setReviewToDelete(null);

      // Đồng bộ từ database
      try {
        const fresh = await fetchApi<ProductDetail>(`/products/${product.id}`);
        if (fresh && Array.isArray(fresh.reviews)) {
          setProduct(fresh);
        }
      } catch {}
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Lỗi khi xóa đánh giá.', type: 'danger' });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const toggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadProduct() {
      if (!params.id) return;
      const targetId = Array.isArray(params.id) ? params.id[0] : params.id;

      try {
        setLoading(true);
        setProduct(null); // Reset dữ liệu món cũ trước khi nạp món mới
        const data = await fetchApi<ProductDetail>(`/products/${targetId}`);
        if (isCancelled) return;
        if (!data || !data.id) {
          throw new Error('Product not found');
        }
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const availableVariant = data.variants.find((v) => !v.isOutOfStock) || data.variants[0];
          setSelectedSize(availableVariant.size);
        }
      } catch {
        if (isCancelled) return;
        // Chỉ fallback khi khớp đúng ID của mock data, TUYỆT ĐỐI không ép về MOCK_PRODUCTS[0] (Cà phê sữa)
        const found = MOCK_PRODUCTS.find((p) => p.id === targetId);
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
            const availableVariant = fallbackData.variants.find((v) => !v.isOutOfStock) || fallbackData.variants[0];
            setSelectedSize(availableVariant.size);
          }
        } else {
          setProduct(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isCancelled = true;
    };
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
  const baseVariant =
    variantsForSize.find((v) => v.topping === 'Tiêu chuẩn') || variantsForSize[0];

  // Tìm variant khớp với các checkbox topping đã tick
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

  // Phân phối Topping chính xác theo từng món thực tế (Trà đào/vải -> thạch đào/nha đam; Trà sữa -> trân châu/khúc bạch; Cà phê -> espresso/cheese)
  const toppingsForCategory = getToppingsForProduct(product);

  // Tính giá theo mô típ Grab/Shopee: Giá Size gốc + tổng tiền các topping tick chọn
  const baseSizePrice = Number(baseVariant?.price || 0);
  const extraToppingsPrice = selectedToppings.reduce((sum, name) => {
    const opt = ALL_TOPPINGS.find((o) => o.name === name);
    return sum + (opt ? opt.price : 0);
  }, 0);
  // Đơn giá 1 ly = Giá size gốc + tiền các topping (TĂNG GIẢM NGAY LẬP TỨC khi tick chọn)
  const unitPrice = baseSizePrice + extraToppingsPrice;
  const totalPrice = unitPrice * quantity;

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

  const handleAddToCart = (isBuyNow = false) => {
    if (!selectedVariant || isSelectedVariantOutOfStock) return;

    const lineItem = {
      id: `${selectedVariant.id}:${toppingLabel}`,
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: selectedVariant.size,
      price: unitPrice,
      topping: toppingLabel,
      quantity,
    };

    if (isBuyNow) {
      const buyNowItem = {
        ...lineItem,
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
      if (!user) {
        setToast({
          message: 'Bạn cần đăng nhập tài khoản để mua ngay và thanh toán đơn hàng.',
          type: 'info',
          action: {
            label: 'Đăng nhập',
            href: '/login?redirect=/checkout?buyNow=1',
          },
        });
        return;
      }
      router.push('/checkout?buyNow=1');
    } else {
      addItem(lineItem, quantity);
      setToast({
        message: `Đã thêm ${quantity} ly ${product.name} (Size ${selectedVariant.size} · Topping: ${toppingLabel}) vào giỏ hàng.`,
        type: 'success',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 md:pb-0">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
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
              className={`object-cover ${product.isOutOfStock ? 'opacity-70 grayscale-[25%]' : ''}`}
              priority
            />
            {product.isOutOfStock && (
              <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold tracking-wider uppercase rounded bg-rose-600 text-white shadow-md flex items-center gap-1.5 backdrop-blur-sm">
                <span>⛔</span> Tạm hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Right: Options & Pricing */}
        <div className="space-y-6">
          <div className="space-y-2 border-b border-line pb-4">
            {(product.reviews?.length || product.reviewCount || 0) > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-ink-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" strokeWidth={1.5} />
                <span className="font-semibold text-ink tabular-nums">{product.avgRating || product.rating}</span>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-ink-3 hover:text-accent hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                  title="Bấm để cuộn xuống xem các đánh giá"
                >
                  <span>({product.reviews?.length || product.reviewCount} lượt đánh giá)</span>
                  <span className="text-[10px] text-accent font-medium">↓ Xem đánh giá</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-ink-3">
                <span className="text-[10.5px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded">Món mới</span>
                <span>Chưa có lượt đánh giá nào</span>
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
                const isSelected = currentSize === size;
                const sizeVariant = product.variants.find((v) => v.size === size);
                const isOutOfStock = Boolean(sizeVariant?.isOutOfStock);
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      setSelectedSize(size);
                    }}
                    className={`py-2 px-3 text-center border rounded transition-colors text-xs font-medium ${
                      isOutOfStock
                        ? 'border-line/40 bg-surface-2 opacity-45 cursor-not-allowed'
                        : isSelected
                        ? 'border-ink bg-ink text-white font-semibold'
                        : 'border-line bg-surface text-ink hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="block font-display text-sm">Size {size}</span>
                      {isOutOfStock && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-1 rounded">
                          Hết
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px] opacity-80 tabular-nums">
                      {sizeVariant ? Number(sizeVariant.price).toLocaleString('vi-VN') : 0}đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mức đường & Mức đá (Chuẩn Highlands / Phê La / ShopeeFood) */}
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
                        ? 'border-ink bg-ink text-white font-medium shadow-xs'
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

          {/* Topping đi kèm (Mô típ GrabFood & ShopeeFood: Chọn nhiều checkbox, CÓ ẢNH MINH HỌA) */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink block">Topping đi kèm (chọn nhiều)</span>
              <span className="text-[11px] text-ink-3 font-medium">
                {selectedToppings.length > 0
                  ? `Đã chọn ${selectedToppings.length} topping (+${extraToppingsPrice.toLocaleString('vi-VN')}đ)`
                  : 'Tùy chọn'}
              </span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {toppingsForCategory.map((top) => {
                const isChecked = selectedToppings.includes(top.name);
                return (
                  <div
                    key={top.id}
                    onClick={() => toggleTopping(top.name)}
                    className={`flex items-center justify-between p-2.5 border rounded cursor-pointer transition-all text-xs select-none ${
                      isChecked
                        ? 'border-line-strong bg-surface-2 text-ink font-medium ring-1 ring-line-strong'
                        : 'border-line bg-surface hover:bg-surface-2 text-ink-2'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all ${
                          isChecked ? 'border-ink bg-ink text-white shadow-xs' : 'border-ink/40 bg-surface'
                        }`}
                      >
                        {isChecked && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                        )}
                      </span>

                      {/* Hình ảnh minh họa Topping */}
                      <div className="relative w-10 h-10 rounded-sm overflow-hidden shrink-0 border border-line bg-surface-2">
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
                        <div className="text-[10px] text-ink-3 mt-0.5">{top.desc}</div>
                      </div>
                    </div>
                    <span className="text-ink font-semibold tabular-nums shrink-0 ml-2">
                      +{top.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mã Giảm Giá / Voucher */}
          <div className="space-y-2 pt-3 border-t border-line text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-accent" />
                <span>Mã ưu đãi / Voucher</span>
              </span>
              {selectedVoucherCodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedVoucherCodes([])}
                  className="text-[11px] text-danger hover:underline"
                >
                  Gỡ voucher ({selectedVoucherCodes.length})
                </button>
              )}
            </div>

            <form onSubmit={handleApplyManualVoucher} className="flex gap-2">
              <input
                type="text"
                value={manualVoucherCode}
                onChange={(e) => setManualVoucherCode(e.target.value)}
                placeholder="Nhập mã (VD: BREW10)"
                className="flex-1 h-8 px-2.5 text-xs bg-bg border border-line rounded text-ink uppercase placeholder:normal-case placeholder:text-ink-3 focus:border-accent focus:outline-none"
              />
              <Button variant="secondary" size="sm" type="submit">
                Áp dụng
              </Button>
            </form>

            {voucherError && (
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded text-[11px] text-danger flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{voucherError}</span>
              </div>
            )}

            {/* Quick-Select Voucher Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {SHOP_VOUCHERS.map((v) => {
                const isSelected = selectedVoucherCodes.includes(v.code);
                const isEligible = totalPrice >= v.minOrder;
                const isMaxDiscount = totalPrice - voucherDiscount <= 0 && !isSelected;
                const disabled = !isEligible || isMaxDiscount;

                return (
                  <button
                    key={v.code}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleToggleVoucher(v)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold'
                        : isEligible && !isMaxDiscount
                        ? 'bg-surface hover:bg-surface-2 text-ink border-line hover:border-accent'
                        : 'bg-surface-2/40 text-ink-3 border-line/50 opacity-50 cursor-not-allowed'
                    }`}
                    title={v.description}
                  >
                    <span>{v.code} ({v.label})</span>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Khung Điểm Thưởng Tích Lũy Thành Viên (1 điểm = 100đ) */}
          <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-ink">
              <span className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400">
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
                <label className={`flex items-start gap-2 p-2 rounded border transition-all cursor-pointer ${
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
                      <span>Dùng {maxPointsCanUse} điểm tích lũy để giảm giá</span>
                      <span className="text-amber-800 dark:text-amber-300 font-bold font-mono">
                        -{Number(maxPointsCanUse * 100).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-3 mt-0.5">
                      {usePoints
                        ? `Đã áp dụng giảm ${Number(pointsDiscount).toLocaleString('vi-VN')}đ (1 điểm = 100đ)`
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
                  href="/login?redirect=/checkout"
                  className="text-accent hover:underline font-semibold text-[11px] shrink-0 ml-2"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
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

            {/* Tạm tính & Giá */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-2 block">Tạm tính:</span>
                  {extraToppingsPrice > 0 && (
                    <span className="text-[10px] text-ink-3 font-normal">
                      (Gốc {Number(baseSizePrice).toLocaleString('vi-VN')}đ + {Number(extraToppingsPrice).toLocaleString('vi-VN')}đ topping)
                    </span>
                  )}
                </div>
                <span className={voucherDiscount > 0 || pointsDiscount > 0 ? "line-through text-xs text-ink-3 tabular-nums" : "font-semibold text-sm text-ink tabular-nums"}>
                  {Number(totalPrice || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Voucher giảm giá:</span>
                  <span className="font-semibold tabular-nums">-{Number(voucherDiscount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <span>Điểm tích lũy ({pointsUsed} điểm):</span>
                  <span className="font-semibold tabular-nums">-{Number(pointsDiscount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-line/60">
                <span className="text-xs font-bold text-ink">Tổng thanh toán:</span>
                <span className="font-display text-2xl font-semibold text-ink tabular-nums">
                  {Number(finalPrice).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {isSelectedVariantOutOfStock && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <span className="font-semibold block">Tạm hết nguyên liệu pha chế</span>
                  <span>Món đồ uống này (hoặc kích cỡ đang chọn) hiện đã tạm hết nguyên liệu tại quán. Quý khách vui lòng chọn kích cỡ khác hoặc quay lại sau nhé!</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                disabled={isSelectedVariantOutOfStock}
                onClick={() => handleAddToCart(false)}
                className={`w-full text-sm font-semibold flex items-center justify-center gap-2 ${
                  isSelectedVariantOutOfStock
                    ? 'opacity-50 cursor-not-allowed border-line'
                    : 'border-line-strong hover:border-ink bg-surface text-ink'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isSelectedVariantOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}</span>
              </Button>

              <Button
                variant="primary"
                size="lg"
                disabled={isSelectedVariantOutOfStock}
                onClick={() => handleAddToCart(true)}
                className={`w-full text-sm font-semibold flex items-center justify-center gap-2 ${
                  isSelectedVariantOutOfStock
                    ? 'opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-700 text-slate-500'
                    : 'shadow-sm bg-accent hover:bg-accent-hover text-on-accent'
                }`}
              >
                <span>{isSelectedVariantOutOfStock ? 'Tạm hết hàng' : 'Mua ngay'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="reviews-section" className="border-t border-line pt-8 space-y-5">
        {(() => {
          const myExistingReview = product.reviews?.find(checkIsReviewOwner);
          return (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
                  <span>Đánh giá từ khách hàng</span>
                  <span className="text-xs font-normal text-ink-3 bg-surface-2 px-2 py-0.5 rounded-full">
                    {product.reviews?.length || product.reviewCount || 0}
                  </span>
                </h2>
                <p className="text-xs text-ink-3 mt-0.5">Nhận xét thực tế từ khách hàng đã thưởng thức món này.</p>
              </div>

              {myExistingReview ? (
                <button
                  type="button"
                  onClick={handleOpenReviewModal}
                  className="px-3.5 py-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold rounded shadow-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sửa đánh giá của bạn</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenReviewModal}
                  className="px-3.5 py-1.5 border border-line-strong/60 bg-surface text-ink hover:bg-surface-2 text-xs font-medium rounded shadow-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Viết đánh giá món này</span>
                </button>
              )}
            </div>
          );
        })()}

        {product.reviews && product.reviews.length > 0 ? (
          <div className="divide-y divide-line border-y border-line text-xs">
            {product.reviews.map((rev) => {
              const isOwner = checkIsReviewOwner(rev);
              return (
                <div key={rev.id} className="py-4 space-y-2 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink">{rev.customer?.fullName || 'Khách hàng'}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        ✓ Đã mua hàng
                      </span>
                      {isOwner && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                          Đánh giá của bạn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={s <= rev.stars ? "w-3.5 h-3.5 text-amber-500 fill-amber-500" : "w-3.5 h-3.5 text-line"}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>

                      {isOwner && (
                        <div className="flex items-center gap-1.5 ml-1 border-l border-line pl-2.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditReview(rev)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-2 hover:text-accent px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                            title="Chỉnh sửa đánh giá"
                          >
                            <Pencil className="w-3 h-3 text-amber-600" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewToDelete({ id: rev.id, content: rev.content })}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Xóa đánh giá này"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-ink-2 leading-relaxed text-xs">{rev.content}</p>
                  <span className="text-[11px] text-ink-3 block">
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-2/40 border border-dashed border-line rounded-2xl space-y-3 text-xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Star className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-ink">Chưa có đánh giá nào cho món đồ uống này</p>
              <p className="text-ink-3 text-[11px]">
                Hãy đặt mua và thưởng thức để trở thành người đầu tiên chia sẻ cảm nhận nhé!
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenReviewModal}
              className="text-xs text-accent font-semibold hover:underline"
            >
              Gửi đánh giá đầu tiên →
            </button>
          </div>
        )}
      </div>

      {/* Modal Viết / Sửa Đánh Giá Sản Phẩm */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={handleCloseReviewModal}
        title={editingReviewId ? ("Chỉnh sửa đánh giá món " + product.name) : ("Đánh giá món " + product.name)}
        description={editingReviewId ? "Thay đổi mức độ hài lòng hoặc nhận xét chi tiết của bạn về món đồ uống này." : "Chia sẻ trải nghiệm của bạn về hương vị, độ ngọt, độ béo để người khác cùng tham khảo."}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs text-left">
          <div className="space-y-1.5 text-center p-3 bg-surface-2/40 rounded-xl border border-line">
            <span className="font-semibold text-ink block">Mức độ hài lòng của bạn</span>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setReviewStars(s)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={s <= reviewStars ? "w-6 h-6 text-amber-500 fill-amber-500" : "w-6 h-6 text-ink-3"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] text-accent font-medium block">
              {reviewStars === 5 ? 'Tuyệt vời (5/5)' : reviewStars === 4 ? 'Ngon, vừa miệng (4/5)' : reviewStars === 3 ? 'Bình thường (3/5)' : 'Chưa hài lòng'}
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Nhận xét chi tiết</label>
            <textarea
              required
              rows={3}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="VD: Vị thanh mát, lớp bọt tuyết mịn, thơm hương bạc hà rất sảng khoái..."
              className="w-full p-2.5 bg-bg border border-line rounded-lg text-ink focus:border-accent focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {reviewError && (
            <p className="text-danger text-[11px] font-medium leading-tight">{reviewError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={handleCloseReviewModal}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={reviewSubmitting}>
              {editingReviewId ? 'Lưu thay đổi' : 'Gửi đánh giá'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác Nhận Xóa Đánh Giá */}
      <Modal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        title="Xác nhận xóa đánh giá"
        description="Bạn có chắc chắn muốn xóa bài đánh giá này không? Sau khi xóa, bạn có thể viết lại bài đánh giá mới bất cứ lúc nào."
      >
        <div className="space-y-4 text-xs text-left">
          {reviewToDelete && (
            <div className="p-3 bg-surface-2 rounded-lg border border-line space-y-1">
              <span className="text-[11px] text-ink-3 block">Nội dung đánh giá sẽ xóa:</span>
              <p className="text-ink font-medium italic">"{reviewToDelete.content}"</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              disabled={deleteSubmitting}
              onClick={() => setReviewToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteSubmitting}
              onClick={handleDeleteReview}
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Thông báo Toast toàn trang */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type || 'info'}
          onClose={() => setToast(null)}
          action={toast.action}
        />
      )}
    </div>
  );
}
