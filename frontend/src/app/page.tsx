'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchApi } from '../lib/api';
import { useCartStore } from '../store/useCartStore';
import { Search, Star, Plus, Coffee, Sparkles, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  minPrice: number;
  rating: number;
  reviewCount: number;
  variants: Array<{
    id: string;
    size: string;
    price: number;
    topping?: string;
  }>;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả món' },
  { id: 'COFFEE', label: 'Cà phê truyền thống' },
  { id: 'TEA', label: 'Trà trái cây & Trà sữa' },
  { id: 'FREEZE', label: 'Đá xay Freeze' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { addItem } = useCartStore();

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

        const data = await fetchApi(`/products?${params.toString()}`);
        setProducts(data.items || []);
      } catch (err) {
        console.warn('API error, loading fallback catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadProducts, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.variants || product.variants.length === 0) return;

    // Lấy size S mặc định
    const defaultVariant = product.variants[0];
    addItem({
      variantId: defaultVariant.id,
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: defaultVariant.size,
      price: Number(defaultVariant.price),
      topping: defaultVariant.topping || 'Tiêu chuẩn',
    });

    setToastMsg(`Đã thêm 1 "${product.name} (${defaultVariant.size})" vào giỏ hàng!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-coffee-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-coffee-700 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coffee-800 via-coffee-900 to-coffee-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coffee-700/60 border border-coffee-600/50 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Trải nghiệm gọi món không tiền mặt 100%
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Thưởng thức Cà phê <br />
            <span className="text-amber-300">Chỉ trong vài chạm</span>
          </h1>
          <p className="text-coffee-200 text-sm sm:text-base leading-relaxed">
            Chọn món yêu thích, thanh toán nhanh qua Ví/Thẻ, theo dõi trạng thái pha chế và nhận đồ uống ngay tại quầy không cần xếp hàng.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-coffee-600/20 blur-3xl" />
      </section>

      {/* Filter Tabs & Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-coffee-800 text-white shadow-md'
                    : 'bg-white text-coffee-800 border border-coffee-200 hover:bg-coffee-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm đồ uống..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-coffee-200 focus:border-coffee-500 focus:outline-none text-sm text-coffee-900 placeholder:text-coffee-400 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-coffee-100 shadow-sm animate-pulse space-y-3">
                <div className="w-full h-40 bg-coffee-100 rounded-xl" />
                <div className="h-4 bg-coffee-100 rounded w-3/4" />
                <div className="h-3 bg-coffee-100 rounded w-1/2" />
                <div className="h-6 bg-coffee-100 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200 space-y-3">
            <div className="w-16 h-16 rounded-full bg-coffee-100 text-coffee-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-coffee-900">Không tìm thấy đồ uống nào</h3>
            <p className="text-sm text-coffee-600 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc chọn danh mục đồ uống phù hợp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-coffee-200 hover:border-coffee-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-coffee-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-coffee-900/80 backdrop-blur-sm text-white text-[11px] font-semibold uppercase tracking-wider">
                      {product.category}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-coffee-400 font-normal">({product.reviewCount})</span>
                    </div>

                    <h3 className="font-bold text-coffee-900 text-sm sm:text-base line-clamp-1 group-hover:text-coffee-700 transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-xs text-coffee-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Price & Quick Add Button */}
                <div className="p-4 pt-0 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[11px] text-coffee-500 block">Giá từ</span>
                    <span className="text-base sm:text-lg font-black text-coffee-900">
                      {Number(product.minPrice).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="w-9 h-9 rounded-xl bg-coffee-100 hover:bg-coffee-800 text-coffee-800 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-105"
                    title="Chọn nhanh size S"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
