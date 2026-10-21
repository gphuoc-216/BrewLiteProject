'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchApi } from '../lib/api';
import { MOCK_PRODUCTS } from '../lib/mockProducts';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'next/navigation';
import { ProductItem } from '../types';
import { Toast, EmptyState, Skeleton } from '../components/ui';
import { ProductQuickSelectModal } from '../components/ProductQuickSelectModal';
import { Search, Star, Plus } from 'lucide-react';

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23F4EBE1'/%3E%3Cpath d='M150 210h100v70c0 25-20 45-45 45h-10c-25 0-45-20-45-45v-70z' fill='%234A3728'/%3E%3Cpath d='M250 225h16c8 0 14 6 14 14s-6 14-14 14h-16v-28z' fill='none' stroke='%234A3728' stroke-width='6'/%3E%3Cellipse cx='200' cy='350' rx='70' ry='12' fill='%23D9C7B6'/%3E%3Ctext x='200' y='390' font-family='sans-serif' font-size='15' font-weight='600' text-anchor='middle' fill='%237D5A44'%3EBrewLite Roastery%3C/text%3E%3C/svg%3E";

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'COFFEE', label: 'Cà phê truyền thống' },
  { id: 'TEA', label: 'Trà trái cây & Trà sữa' },
  { id: 'FREEZE', label: 'Đá xay Freeze' },
];

function ProductCard({
  product,
  onOpenModal,
}: {
  product: ProductItem;
  onOpenModal: (product: ProductItem) => void;
}) {
  const [imgSrc, setImgSrc] = useState(product.imageUrl || FALLBACK_IMAGE);
  const defaultVariant = product.variants?.[0];
  const minPrice = defaultVariant ? defaultVariant.price : product.minPrice || 0;

  return (
    <div
      onClick={() => onOpenModal(product)}
      className="group bg-surface border border-line hover:border-line-strong rounded overflow-hidden flex flex-col justify-between transition-all cursor-pointer hover:shadow-subtle"
    >
      <div>
        {/* Fixed 4:5 image container */}
        <div className="relative w-full aspect-[4/5] bg-surface-2 overflow-hidden">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          {/* Category Badge overlay */}
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-ink/75 text-white backdrop-blur-sm">
            {product.category}
          </span>
        </div>

        {/* Product Info */}
        <div className="p-3.5 space-y-1">
          {product.rating && (
            <div className="flex items-center gap-1 text-xs text-ink-2">
              <Star className="w-3 h-3 text-ink fill-ink" strokeWidth={1.5} />
              <span className="font-medium text-ink tabular-nums">{product.rating}</span>
              <span className="text-ink-3">({product.reviewCount || 0})</span>
            </div>
          )}

          <h3 className="font-medium text-sm text-ink group-hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-ink-3 line-clamp-1 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Price & Add (+) Button */}
      <div className="p-3.5 pt-0 flex items-center justify-between mt-1">
        <div>
          <span className="text-[11px] text-ink-3 block">Giá từ</span>
          <span className="text-sm font-semibold text-ink tabular-nums">
            {Number(minPrice).toLocaleString('vi-VN')}đ
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(product);
          }}
          className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center hover:bg-accent hover:scale-105 active:scale-95 transition-all shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          title="Chọn món"
          aria-label={`Chọn món ${product.name}`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS as unknown as ProductItem[]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<ProductItem | null>(null);

  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

        const data = await fetchApi<{ items?: ProductItem[] }>(`/products?${params.toString()}`);
        if (data && data.items) {
          setProducts(data.items);
        }
      } catch (err) {
        let fallback = [...MOCK_PRODUCTS] as unknown as ProductItem[];
        if (selectedCategory !== 'ALL') {
          fallback = fallback.filter((p) => p.category === selectedCategory);
        }
        if (search) {
          const q = search.toLowerCase();
          fallback = fallback.filter(
            (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
          );
        }
        setProducts(fallback);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadProducts, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const handleModalAddToCart = (
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
  ) => {
    if (!user) {
      setToastMsg('⚠️ Vui lòng đăng nhập tài khoản trước khi thêm món vào giỏ hàng!');
      router.push('/login?redirect=/');
      return;
    }

    addItem(item, quantity);
    setToastMsg(`Đã thêm ${quantity} ly ${item.productName} (Size ${item.size} - ${item.topping}) vào giỏ hàng.`);
  };

  return (
    <div className="space-y-10">
      {/* Toast Notification */}
      {toastMsg && (
        <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />
      )}

      {/* Quick Select Size & Topping Modal */}
      {modalProduct && (
        <ProductQuickSelectModal
          isOpen={!!modalProduct}
          onClose={() => setModalProduct(null)}
          product={modalProduct}
          onAddToCart={handleModalAddToCart}
        />
      )}

      {/* Hero Banner: Flat Espresso, Editorial Fraunces */}
      <section className="bg-espresso text-espresso-text rounded p-8 sm:p-12 border border-espresso-line">
        <div className="max-w-xl space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-semibold leading-tight tracking-tight text-espresso-text">
            Gọi trước, nhận ở quầy.
          </h1>
          <p className="text-sm sm:text-base text-espresso-muted leading-relaxed">
            Chọn món từ quầy cà phê thủ công, chọn kích cỡ & topping theo ý thích và thanh toán không tiền mặt tiện lợi.
          </p>
        </div>
      </section>

      {/* Filter Tabs & Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-line">
          {/* Categories: Underlined Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-sm py-2 whitespace-nowrap transition-colors relative ${
                  selectedCategory === cat.id
                    ? 'text-ink font-semibold border-b-2 border-accent'
                    : 'text-ink-2 hover:text-ink font-normal'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món uống..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface text-ink placeholder:text-ink-3 border border-line rounded transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="border border-line rounded p-3 bg-surface space-y-3">
                <Skeleton className="w-full aspect-[4/5]" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Không tìm thấy món uống phù hợp"
            description="Hãy thử nhập từ khóa khác hoặc chuyển sang danh mục món khác."
            actionLabel="Xem tất cả món"
            onAction={() => {
              setSelectedCategory('ALL');
              setSearch('');
            }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenModal={(p) => setModalProduct(p)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
