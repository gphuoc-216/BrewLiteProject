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
  const isOutOfStock = Boolean(product.isOutOfStock);

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
            className={`object-cover transition-transform duration-300 ${
              isOutOfStock ? 'opacity-65 grayscale-[30%]' : 'group-hover:scale-[1.02]'
            }`}
          />
          {/* Category or Out-of-Stock Badge overlay */}
          {isOutOfStock ? (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-rose-600 text-white shadow-sm flex items-center gap-1 backdrop-blur-sm">
              <span>⛔</span> Tạm hết hàng
            </span>
          ) : (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-ink/75 text-white backdrop-blur-sm">
              {product.category}
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3.5 space-y-1">
          {(product.reviewCount || 0) > 0 ? (
            <div className="flex items-center gap-1 text-xs text-ink-2">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" strokeWidth={1.5} />
              <span className="font-medium text-ink tabular-nums">{product.rating}</span>
              <span className="text-ink-3">({product.reviewCount})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
              <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded">Mới</span>
              <span>Chưa có đánh giá</span>
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

        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-xs font-semibold cursor-not-allowed opacity-85"
            title="Món này hiện đang tạm hết nguyên liệu pha chế"
            aria-label={`Món ${product.name} tạm hết`}
          >
            Hết
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS as unknown as ProductItem[]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
  const [totalItems, setTotalItems] = useState(24);
  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'danger' | 'info';
    action?: { label: string; href?: string; onClick?: () => void };
  } | null>(null);
  const [modalProduct, setModalProduct] = useState<ProductItem | null>(null);

  const { addItem, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();

  // Reset về trang 1 khi đổi danh mục hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
        params.append('page', String(currentPage));
        params.append('limit', '8');

        const data = await fetchApi<{ items?: ProductItem[]; meta?: { page: number; totalPages: number; totalItems: number } } | ProductItem[]>(`/products?${params.toString()}`);
        if (Array.isArray(data)) {
          setProducts(data);
          setTotalPages(Math.ceil(data.length / 8) || 1);
          setTotalItems(data.length);
        } else if (data && Array.isArray(data.items)) {
          setProducts(data.items);
          if (data.meta) {
            setTotalPages(data.meta.totalPages || 1);
            setTotalItems(data.meta.totalItems || data.items.length);
          }
        }
      } catch {
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
        const startIndex = (currentPage - 1) * 8;
        setTotalPages(Math.ceil(fallback.length / 8) || 1);
        setTotalItems(fallback.length);
        setProducts(fallback.slice(startIndex, startIndex + 8));
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadProducts, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, currentPage]);

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
    addItem(item, quantity);
    setToast({
      message: `Đã thêm ${quantity} ly ${item.productName} (Size ${item.size} - ${item.topping}) vào giỏ hàng.`,
      type: 'success',
    });
  };

  const handleModalBuyNow = (
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
    // Mua ngay: Thêm món vào giỏ hàng ngay lập tức
    addItem(item, quantity);
    setModalProduct(null);

    if (!user) {
      setToast({
        message: 'Bạn cần đăng nhập tài khoản để mua ngay và thanh toán đơn hàng.',
        type: 'info',
        action: {
          label: 'Đăng nhập',
          href: '/login?redirect=/checkout',
        },
      });
      return;
    }

    router.push('/checkout');
  };

  return (
    <div className="space-y-10">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}

      {/* Quick Select Size & Topping Modal */}
      {modalProduct && (
        <ProductQuickSelectModal
          isOpen={!!modalProduct}
          onClose={() => setModalProduct(null)}
          product={modalProduct}
          onAddToCart={handleModalAddToCart}
          onBuyNow={handleModalBuyNow}
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={(p) => setModalProduct(p)}
                />
              ))}
            </div>

            {/* Phân trang (Pagination) */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-ink-3">
                  Hiển thị trang <strong className="text-ink">{currentPage}</strong> / {totalPages} (Tổng cộng {totalItems} món đồ uống)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 320, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 text-xs rounded border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 320, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-accent text-white font-semibold shadow-sm'
                          : 'border border-line bg-surface text-ink hover:bg-surface-2'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 320, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 text-xs rounded border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
