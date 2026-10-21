'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchApi, getErrorMessage } from '../../lib/api';
import {
  Button,
  PageHeader,
  Card,
  Input,
  Badge,
  Modal,
  Toast,
  EmptyState,
  Skeleton,
} from '../../components/ui';
import {
  BarChart3,
  Coffee,
  Package,
  Ticket,
  MessageSquare,
  Users,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import {
  AdminOverview,
  RevenuePoint,
  TopProduct,
  IngredientRecord,
  SupplierRecord,
  ReviewRecord,
  PromotionRecord,
  ProductItem,
  AccountRecord,
} from '@/types';
import {
  MOCK_ADMIN_OVERVIEW,
  MOCK_REVENUE_POINTS,
  MOCK_TOP_PRODUCTS,
  MOCK_INGREDIENTS,
  MOCK_SUPPLIERS,
  MOCK_REVIEWS,
  MOCK_PROMOTIONS,
  MOCK_ACCOUNTS,
} from '@/lib/mock/adminMock';
import { useRequireRole } from '@/hooks/useRequireRole';

type AdminTab = 'overview' | 'products' | 'inventory' | 'promotions' | 'reviews' | 'users';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function AdminDashboardPage() {
  const { ready } = useRequireRole(['ADMIN']);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  // Per-tab error state
  const [tabErrors, setTabErrors] = useState<Record<AdminTab, string | null>>({
    overview: null,
    products: null,
    inventory: null,
    promotions: null,
    reviews: null,
    users: null,
  });

  // Data states
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [accountsList, setAccountsList] = useState<AccountRecord[]>([]);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [importQuantity, setImportQuantity] = useState<string>('');
  const [importUnitPrice, setImportUnitPrice] = useState<string>('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('COFFEE');
  const [newProductPrice, setNewProductPrice] = useState('35000');

  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoValue, setNewPromoValue] = useState('15');
  const [newPromoType, setNewPromoType] = useState<'PERCENT' | 'FIXED'>('PERCENT');

  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        fetchApi('/admin/stats/overview'),
        fetchApi('/admin/stats/revenue'),
        fetchApi('/admin/stats/top-products'),
        fetchApi('/admin/ingredients'),
        fetchApi('/admin/suppliers'),
        fetchApi('/admin/reviews'),
        fetchApi('/admin/promotions'),
        fetchApi('/products'),
        fetchApi('/admin/accounts'),
      ]);

      const [
        resOverview,
        resRevenue,
        resTop,
        resIng,
        resSups,
        resRevs,
        resPromos,
        resProds,
        resAccs,
      ] = results;

      const newErrors: Record<AdminTab, string | null> = {
        overview: null,
        products: null,
        inventory: null,
        promotions: null,
        reviews: null,
        users: null,
      };

      // 1. Overview
      if (resOverview.status === 'fulfilled' && resOverview.value) {
        setOverview(resOverview.value as AdminOverview);
      } else if (USE_MOCK) {
        setOverview(MOCK_ADMIN_OVERVIEW);
      } else {
        setOverview(null);
        newErrors.overview = 'Không thể tải chỉ số tổng quan.';
      }

      // Revenue
      if (resRevenue.status === 'fulfilled' && resRevenue.value) {
        setRevenueStats(resRevenue.value as RevenuePoint[]);
      } else if (USE_MOCK) {
        setRevenueStats(MOCK_REVENUE_POINTS);
      } else {
        setRevenueStats([]);
      }

      // Top Products
      if (resTop.status === 'fulfilled' && resTop.value) {
        setTopProducts(resTop.value as TopProduct[]);
      } else if (USE_MOCK) {
        setTopProducts(MOCK_TOP_PRODUCTS);
      } else {
        setTopProducts([]);
      }

      // 2. Inventory (Ingredients + Suppliers)
      if (resIng.status === 'fulfilled' && resIng.value) {
        const ings = resIng.value as IngredientRecord[];
        setIngredients(ings);
        if (ings.length > 0) setSelectedIngredientId(ings[0].id);
      } else if (USE_MOCK) {
        setIngredients(MOCK_INGREDIENTS);
        if (MOCK_INGREDIENTS.length > 0) setSelectedIngredientId(MOCK_INGREDIENTS[0].id);
      } else {
        setIngredients([]);
        newErrors.inventory = 'Không thể tải danh sách nguyên liệu và tồn kho.';
      }

      if (resSups.status === 'fulfilled' && resSups.value) {
        const sups = resSups.value as SupplierRecord[];
        setSuppliers(sups);
        if (sups.length > 0) setSelectedSupplierId(sups[0].id);
      } else if (USE_MOCK) {
        setSuppliers(MOCK_SUPPLIERS);
        if (MOCK_SUPPLIERS.length > 0) setSelectedSupplierId(MOCK_SUPPLIERS[0].id);
      } else {
        setSuppliers([]);
      }

      // 3. Reviews
      if (resRevs.status === 'fulfilled' && resRevs.value) {
        setReviews(resRevs.value as ReviewRecord[]);
      } else if (USE_MOCK) {
        setReviews(MOCK_REVIEWS);
      } else {
        setReviews([]);
        newErrors.reviews = 'Không thể tải danh sách đánh giá từ khách hàng.';
      }

      // 4. Promotions
      if (resPromos.status === 'fulfilled' && resPromos.value) {
        setPromotions(resPromos.value as PromotionRecord[]);
      } else if (USE_MOCK) {
        setPromotions(MOCK_PROMOTIONS);
      } else {
        setPromotions([]);
        newErrors.promotions = 'Không thể tải danh sách mã khuyến mãi.';
      }

      // 5. Products
      if (resProds.status === 'fulfilled' && resProds.value) {
        const pVal = resProds.value as { items?: ProductItem[] } | ProductItem[];
        const items = pVal && 'items' in pVal && Array.isArray(pVal.items)
          ? pVal.items
          : Array.isArray(pVal)
          ? pVal
          : [];
        setProductsList(items);
      } else {
        setProductsList([]);
        newErrors.products = 'Không thể tải danh mục món uống.';
      }

      // 6. Users / Accounts
      if (resAccs.status === 'fulfilled' && resAccs.value) {
        setAccountsList(resAccs.value as AccountRecord[]);
      } else if (USE_MOCK) {
        setAccountsList(MOCK_ACCOUNTS);
      } else {
        setAccountsList([]);
        newErrors.users = 'Không thể tải danh sách nhân sự và tài khoản.';
      }

      setTabErrors(newErrors);
    } catch (err: unknown) {
      console.error('Lỗi tải dữ liệu Admin:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready]);

  // Xử lý tạo phiếu nhập kho với kiểm tra hợp lệ
  const handleCreateImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    const qty = Number(importQuantity);
    const unitPrice = Number(importUnitPrice);

    if (!selectedSupplierId) {
      setImportError('Vui lòng chọn nhà cung cấp.');
      return;
    }
    if (!selectedIngredientId) {
      setImportError('Vui lòng chọn nguyên liệu nhập.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setImportError('Số lượng nhập phải lớn hơn 0.');
      return;
    }
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setImportError('Đơn vị giá nhập phải lớn hơn 0.');
      return;
    }

    try {
      setImportLoading(true);
      await fetchApi('/admin/inventory/import', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          items: [
            {
              ingredientId: selectedIngredientId,
              quantity: qty,
              unitPrice: unitPrice,
            },
          ],
        }),
      });

      setToastMsg({ message: `Đã lập phiếu nhập ${qty} đơn vị vào kho thành công.`, type: 'success' });
      setImportModalOpen(false);
      setImportQuantity('');
      setImportUnitPrice('');
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setImportLoading(false);
    }
  };

  // Toggle ẩn hiện đánh giá
  const handleToggleReview = async (reviewId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'VISIBLE' ? `/admin/reviews/${reviewId}/hide` : `/admin/reviews/${reviewId}/show`;
      await fetchApi(endpoint, { method: 'PATCH' });
      setToastMsg({ message: 'Đã cập nhật trạng thái hiển thị đánh giá.', type: 'success' });
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleAccountStatus = async (accountId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'ACTIVE' ? `/admin/accounts/${accountId}/lock` : `/admin/accounts/${accountId}/unlock`;
      await fetchApi(endpoint, { method: 'PATCH' });
      setToastMsg({ message: 'Đã thay đổi trạng thái tài khoản.', type: 'success' });
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  if (!ready) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Tổng quan & Doanh thu', icon: BarChart3 },
    { id: 'products', label: 'Quản lý Sản phẩm', icon: Coffee },
    { id: 'inventory', label: 'Kho & Nhập hàng', icon: Package },
    { id: 'promotions', label: 'Mã Khuyến mãi', icon: Ticket },
    { id: 'reviews', label: 'Đánh giá khách hàng', icon: MessageSquare },
    { id: 'users', label: 'Nhân sự & Tài khoản', icon: Users },
  ];

  const estimatedImportTotal = (Number(importQuantity) || 0) * (Number(importUnitPrice) || 0);

  return (
    <div className="space-y-6">
      {toastMsg && (
        <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />
      )}

      <PageHeader
        title="Bảng điều khiển quản trị"
        description="Quản lý thực đơn, kiểm soát tồn kho nguyên liệu, doanh thu và nhân sự quầy."
        action={
          <Button variant="secondary" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Cập nhật</span>
          </Button>
        }
      />

      {/* Main Admin Grid with Left Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Nav (3 cols) */}
        <aside className="lg:col-span-3 border border-line rounded bg-surface p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded transition-colors text-left font-medium ${
                  isActive
                    ? 'bg-espresso text-espresso-text'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Content Area (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & REVENUE */}
              {activeTab === 'overview' && (
                tabErrors.overview ? (
                  <EmptyState
                    title="Không thể tải tổng quan"
                    description={tabErrors.overview}
                    actionLabel="Tải lại dữ liệu"
                    onAction={loadData}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Stat Badges */}
                    {overview && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Card className="p-4 space-y-1">
                          <span className="text-[11px] text-ink-3">Doanh thu hôm nay</span>
                          <span className="font-display text-xl font-semibold text-ink tabular-nums block">
                            {Number(overview.totalRevenue).toLocaleString('vi-VN')}đ
                          </span>
                        </Card>
                        <Card className="p-4 space-y-1">
                          <span className="text-[11px] text-ink-3">Tổng số đơn</span>
                          <span className="font-display text-xl font-semibold text-ink tabular-nums block">
                            {overview.totalOrders}
                          </span>
                        </Card>
                        <Card className="p-4 space-y-1">
                          <span className="text-[11px] text-ink-3">Khách thành viên</span>
                          <span className="font-display text-xl font-semibold text-ink tabular-nums block">
                            {overview.activeCustomers}
                          </span>
                        </Card>
                        <Card className="p-4 space-y-1">
                          <span className="text-[11px] text-ink-3">Nguyên liệu sắp hết</span>
                          <span className="font-display text-xl font-semibold text-danger tabular-nums block">
                            {overview.lowStockIngredients}
                          </span>
                        </Card>
                      </div>
                    )}

                    {/* Revenue Trend Table */}
                    <Card className="space-y-3">
                      <h3 className="font-display text-base font-semibold text-ink">Doanh thu 7 ngày gần nhất</h3>
                      <div className="divide-y divide-line border-y border-line text-xs">
                        {revenueStats.map((st) => (
                          <div key={st.date} className="py-2.5 flex items-center justify-between">
                            <span className="font-medium text-ink">{st.date}</span>
                            <span className="font-semibold text-ink tabular-nums">
                              {Number(st.amount).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Top Products */}
                    <Card className="space-y-3">
                      <h3 className="font-display text-base font-semibold text-ink">Sản phẩm bán chạy</h3>
                      <div className="divide-y divide-line border-y border-line text-xs">
                        {topProducts.map((p, idx) => (
                          <div key={p.name} className="py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-ink-3 font-mono font-medium">{idx + 1}.</span>
                              <span className="font-medium text-ink">{p.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-ink tabular-nums block">
                                {Number(p.revenue).toLocaleString('vi-VN')}đ
                              </span>
                              <span className="text-ink-3 text-[11px] tabular-nums block">
                                {p.totalSold} ly đã bán
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )
              )}

              {/* TAB 2: PRODUCTS */}
              {activeTab === 'products' && (
                tabErrors.products ? (
                  <EmptyState
                    title="Không thể tải sản phẩm"
                    description={tabErrors.products}
                    actionLabel="Tải lại sản phẩm"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">Thực đơn đồ uống</h3>
                        <p className="text-xs text-ink-2 mt-0.5">Danh sách các món uống đang kinh doanh tại quầy.</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setProductModalOpen(true)} className="gap-1">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Thêm món</span>
                      </Button>
                    </div>

                    <div className="divide-y divide-line border-y border-line text-xs">
                      {productsList.map((p: ProductItem) => (
                        <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 bg-surface-2 border border-line rounded overflow-hidden shrink-0">
                              <Image src={p.imageUrl} alt={p.name} fill sizes="40px" className="object-cover" />
                            </div>
                            <div>
                              <span className="font-medium text-ink text-sm block">{p.name}</span>
                              <span className="text-ink-3 text-[11px]">{p.category}</span>
                            </div>
                          </div>
                          <span className="font-semibold text-ink tabular-nums">
                            Từ {Number(p.minPrice).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 3: INVENTORY */}
              {activeTab === 'inventory' && (
                tabErrors.inventory ? (
                  <EmptyState
                    title="Không thể tải kho nguyên liệu"
                    description={tabErrors.inventory}
                    actionLabel="Tải lại kho"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">Kho nguyên liệu & Phiếu nhập</h3>
                        <p className="text-xs text-ink-2 mt-0.5">Kiểm soát định mức và lập phiếu nhập kho theo nhà cung cấp.</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setImportModalOpen(true)} className="gap-1">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Lập phiếu nhập kho</span>
                      </Button>
                    </div>

                    <div className="divide-y divide-line border-y border-line text-xs">
                      {ingredients.map((ing) => {
                        // Bỏ || 15000: Thiếu warningThreshold từ API thì không gắn nhãn sắp hết
                        const isLow =
                          ing.warningThreshold !== undefined && ing.warningThreshold !== null
                            ? Number(ing.stockQuantity) <= Number(ing.warningThreshold)
                            : false;

                        return (
                          <div key={ing.id} className="py-3 flex items-center justify-between">
                            <div>
                              <span className="font-medium text-ink block">{ing.name}</span>
                              <span className="text-ink-3 text-[11px]">
                                Đơn vị: {ing.unit}
                                {ing.warningThreshold !== undefined && ing.warningThreshold !== null && (
                                  <span className="ml-2">· Ngưỡng báo động: {ing.warningThreshold} {ing.unit}</span>
                                )}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`font-semibold tabular-nums block ${isLow ? 'text-danger' : 'text-ink'}`}>
                                {Number(ing.stockQuantity).toLocaleString('vi-VN')} {ing.unit}
                              </span>
                              {isLow && (
                                <span className="text-[11px] text-danger font-medium flex items-center gap-1 justify-end">
                                  <AlertTriangle className="w-3 h-3" /> Sắp hết hàng
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 4: PROMOTIONS */}
              {activeTab === 'promotions' && (
                tabErrors.promotions ? (
                  <EmptyState
                    title="Không thể tải khuyến mãi"
                    description={tabErrors.promotions}
                    actionLabel="Tải lại khuyến mãi"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <h3 className="font-display text-base font-semibold text-ink">Mã khuyến mãi</h3>
                      <Button variant="primary" size="sm" onClick={() => setPromoModalOpen(true)} className="gap-1">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Tạo mã mới</span>
                      </Button>
                    </div>

                    <div className="divide-y divide-line border-y border-line text-xs">
                      {promotions.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-ink block">{p.code}</span>
                            <span className="text-ink-2 text-xs">{p.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-ink block">
                              {p.discountType === 'PERCENT' ? `-${p.discountValue}%` : `-${Number(p.discountValue).toLocaleString('vi-VN')}đ`}
                            </span>
                            <span className="text-ink-3 text-[11px] tabular-nums">
                              Đã dùng: {p.usedCount}/{p.quantity} lượt
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 5: REVIEWS */}
              {activeTab === 'reviews' && (
                tabErrors.reviews ? (
                  <EmptyState
                    title="Không thể tải đánh giá"
                    description={tabErrors.reviews}
                    actionLabel="Tải lại đánh giá"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <h3 className="font-display text-base font-semibold text-ink border-b border-line pb-3">
                      Kiểm duyệt đánh giá
                    </h3>
                    <div className="divide-y divide-line border-y border-line text-xs">
                      {reviews.map((r) => (
                        <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{r.customer?.fullName || 'Khách hàng'}</span>
                              <span className="text-ink-3">đánh giá món {r.product?.name}</span>
                              <Badge variant={r.status === 'VISIBLE' ? 'success' : 'default'}>
                                {r.status === 'VISIBLE' ? 'Đang hiện' : 'Đang ẩn'}
                              </Badge>
                            </div>
                            <p className="text-ink-2">{r.content}</p>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleReview(r.id, r.status)}
                            className="gap-1.5 shrink-0"
                          >
                            {r.status === 'VISIBLE' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                                <span>Ẩn đi</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                                <span>Cho hiện</span>
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 6: USERS */}
              {activeTab === 'users' && (
                tabErrors.users ? (
                  <EmptyState
                    title="Không thể tải danh sách tài khoản"
                    description={tabErrors.users}
                    actionLabel="Tải lại danh sách"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <h3 className="font-display text-base font-semibold text-ink border-b border-line pb-3">
                      Nhân sự quầy & Tài khoản
                    </h3>
                    <div className="divide-y divide-line border-y border-line text-xs">
                      {accountsList.map((acc) => (
                        <div key={acc.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-medium text-ink block">
                              {acc.fullName || acc.username}
                            </span>
                            <span className="text-ink-3 text-[11px]">
                              @{acc.username} · Vai trò: {acc.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'danger'}>
                              {acc.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                            </Badge>

                            {acc.role !== 'ADMIN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAccountStatus(acc.id, acc.status)}
                                className={acc.status === 'ACTIVE' ? 'text-danger' : 'text-success'}
                              >
                                {acc.status === 'ACTIVE' ? (
                                  <>
                                    <Lock className="w-3 h-3 mr-1" />
                                    <span>Khóa</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 mr-1" />
                                    <span>Mở khóa</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Lập Phiếu Nhập Kho */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportError(null);
        }}
        title="Lập phiếu nhập kho nguyên liệu"
        description="Chọn nhà cung cấp, nguyên liệu và số lượng nhập thực tế để cập nhật kho."
      >
        <form onSubmit={handleCreateImport} className="space-y-3.5 text-xs text-left">
          {importError && (
            <div className="p-2.5 bg-danger-soft border border-danger/30 rounded text-danger text-xs">
              {importError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Nhà cung cấp</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Nguyên liệu nhập</label>
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số lượng nhập"
              type="number"
              min="1"
              required
              value={importQuantity}
              onChange={(e) => setImportQuantity(e.target.value)}
              placeholder="VD: 5000"
            />
            <Input
              label="Đơn vị giá (VNĐ)"
              type="number"
              min="1"
              required
              value={importUnitPrice}
              onChange={(e) => setImportUnitPrice(e.target.value)}
              placeholder="10000"
            />
          </div>

          {/* Hiển thị thành tiền dự tính = Số lượng x Đơn vị giá */}
          <div className="p-2.5 bg-surface-2 border border-line rounded flex items-center justify-between text-xs">
            <span className="text-ink-2">Thành tiền dự tính:</span>
            <span className="font-semibold text-ink tabular-nums text-sm">
              {estimatedImportTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setImportModalOpen(false);
                setImportError(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={importLoading}
              disabled={estimatedImportTotal <= 0}
            >
              Xác nhận nhập kho
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm Sản Phẩm Mới */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Thêm món uống mới"
        description="Định cấu hình tên món, phân loại danh mục và giá mở bán."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setToastMsg({ message: `Đã lưu món "${newProductName}" vào thực đơn.`, type: 'success' });
            setProductModalOpen(false);
          }}
          className="space-y-3.5 text-xs text-left"
        >
          <Input
            label="Tên món đồ uống"
            required
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="VD: Cà phê Muối Cố Đô"
          />
          <div className="space-y-1">
            <label className="font-semibold text-ink block">Danh mục</label>
            <select
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              <option value="COFFEE">Cà phê truyền thống</option>
              <option value="TEA">Trà trái cây & Trà sữa</option>
              <option value="FREEZE">Đá xay Freeze</option>
            </select>
          </div>
          <Input
            label="Đơn giá cơ bản (VNĐ)"
            type="number"
            required
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            placeholder="35000"
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setProductModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu món mới
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tạo Mã Khuyến Mãi Mới */}
      <Modal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title="Tạo mã khuyến mãi mới"
        description="Định cấu hình mã giảm giá theo phần trăm hoặc số tiền cố định."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setToastMsg({ message: `Đã phát hành mã "${newPromoCode}".`, type: 'success' });
            setPromoModalOpen(false);
          }}
          className="space-y-3.5 text-xs text-left"
        >
          <Input
            label="Mã code (Viết hoa)"
            required
            value={newPromoCode}
            onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
            placeholder="VD: SUMMERSALE"
          />
          <Input
            label="Mô tả chương trình"
            required
            value={newPromoName}
            onChange={(e) => setNewPromoName(e.target.value)}
            placeholder="VD: Giảm nhiệt mùa hè"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-ink block">Loại giảm giá</label>
              <select
                value={newPromoType}
                onChange={(e) => setNewPromoType(e.target.value as 'PERCENT' | 'FIXED')}
                className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
              >
                <option value="PERCENT">Theo phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <Input
              label={newPromoType === 'PERCENT' ? 'Tỉ lệ giảm (%)' : 'Số tiền giảm (VNĐ)'}
              type="number"
              required
              value={newPromoValue}
              onChange={(e) => setNewPromoValue(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setPromoModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo mã
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
