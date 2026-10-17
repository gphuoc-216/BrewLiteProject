'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, Star, ShoppingBag, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface Variant {
  id: string;
  size: string;
  price: number;
  topping?: string;
}

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  avgRating: number;
  reviewCount: number;
  variants: Variant[];
  reviews: Array<{
    id: string;
    stars: number;
    content: string;
    createdAt: string;
    customer: { fullName: string };
  }>;
}

const TOPPING_OPTIONS = [
  { id: 'standard', name: 'Tiêu chuẩn (không thêm topping)', extraPrice: 0 },
  { id: 'boba', name: 'Trân châu đường đen', extraPrice: 5000 },
  { id: 'cheese', name: 'Kem Cheese Macchiato béo ngậy', extraPrice: 8000 },
  { id: 'peach', name: 'Đào miếng giòn sần sật', extraPrice: 7000 },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedTopping, setSelectedTopping] = useState(TOPPING_OPTIONS[0]);
  const [quantity, setQuantity] = useState(1);
  const [toastMsg, setToastMsg] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await fetchApi(`/products/${params.id}`);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-pulse space-y-4">
        <div className="w-12 h-12 bg-coffee-200 rounded-full mx-auto" />
        <div className="h-6 bg-coffee-200 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-coffee-900">Không tìm thấy sản phẩm này</h2>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-xl bg-coffee-800 text-white text-sm font-semibold"
        >
          Quay lại thực đơn
        </button>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const unitPrice = Number(selectedVariant?.price || 0) + selectedTopping.extraPrice;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        size: selectedVariant.size,
        price: unitPrice,
        topping: selectedTopping.name,
      },
      quantity,
    );

    setToastMsg(true);
    setTimeout(() => setToastMsg(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-coffee-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-coffee-700">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold">Đã thêm vào giỏ hàng thành công!</span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-semibold text-coffee-700 hover:text-coffee-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại thực đơn</span>
      </button>

      {/* Main Details Grid */}
      <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
        {/* Product Image */}
        <div className="relative rounded-2xl overflow-hidden bg-coffee-100 aspect-square max-h-[420px]">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-coffee-900/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
            {product.category}
          </div>
        </div>

        {/* Customization Options */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-bold mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.avgRating}</span>
                <span className="text-coffee-400 font-normal">({product.reviewCount} đánh giá)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-coffee-950 leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-coffee-600 mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selector */}
            <div className="space-y-2 pt-2 border-t border-coffee-100">
              <label className="text-xs font-bold uppercase tracking-wider text-coffee-700">
                1. Chọn kích cỡ (Size)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-coffee-800 bg-coffee-50 ring-2 ring-coffee-800/20'
                          : 'border-coffee-200 hover:border-coffee-400 bg-white'
                      }`}
                    >
                      <div className="text-sm font-extrabold text-coffee-950">Size {v.size}</div>
                      <div className="text-xs font-semibold text-coffee-600 mt-0.5">
                        {Number(v.price).toLocaleString('vi-VN')}đ
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topping Selector */}
            <div className="space-y-2 pt-2 border-t border-coffee-100">
              <label className="text-xs font-bold uppercase tracking-wider text-coffee-700">
                2. Tùy chọn Topping
              </label>
              <div className="space-y-2">
                {TOPPING_OPTIONS.map((top) => {
                  const isSelected = selectedTopping.id === top.id;
                  return (
                    <div
                      key={top.id}
                      onClick={() => setSelectedTopping(top)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-coffee-800 bg-coffee-50'
                          : 'border-coffee-200 hover:border-coffee-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-coffee-800 bg-coffee-800 text-white' : 'border-coffee-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm font-medium text-coffee-900">{top.name}</span>
                      </div>
                      <span className="text-xs font-bold text-coffee-700">
                        {top.extraPrice > 0 ? `+${top.extraPrice.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-coffee-100">
              <label className="text-xs font-bold uppercase tracking-wider text-coffee-700">
                3. Số lượng ly
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-coffee-100 text-coffee-800 font-bold hover:bg-coffee-200 transition-colors"
                >
                  -
                </button>
                <span className="text-base font-black text-coffee-900 w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-coffee-100 text-coffee-800 font-bold hover:bg-coffee-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Button: Add to Cart */}
          <div className="pt-4 border-t border-coffee-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-coffee-500 block">Tổng cộng</span>
              <span className="text-2xl font-black text-coffee-900">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-3xl border border-coffee-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-coffee-900 flex items-center gap-2">
            <span>Đánh giá từ khách hàng đã mua</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Xác thực KiemTraDaMua
            </span>
          </h3>
          <span className="text-xs text-coffee-500">{product.reviews.length} nhận xét</span>
        </div>

        {product.reviews.length === 0 ? (
          <p className="text-sm text-coffee-500 italic">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl bg-coffee-50/60 border border-coffee-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-coffee-900">{rev.customer.fullName}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rev.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-coffee-700 leading-relaxed">{rev.content}</p>
                <span className="text-[10px] text-coffee-400 block">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
