'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Shield, TrendingUp, Package, Star, Ticket, Users, AlertTriangle, Eye, EyeOff, Plus, RefreshCw } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'reviews' | 'promotions'>('stats');
  const [overview, setOverview] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form nhập kho nhanh
  const [importIngId, setImportIngId] = useState('');
  const [importQty, setImportQty] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, rev, top, ing, revs, promos] = await Promise.all([
        fetchApi('/admin/stats/overview'),
        fetchApi('/admin/stats/revenue'),
        fetchApi('/admin/stats/top-products'),
        fetchApi('/admin/ingredients'),
        fetchApi('/admin/reviews'),
        fetchApi('/admin/promotions'),
      ]);

      setOverview(ov);
      setRevenueStats(rev || []);
      setTopProducts(top || []);
      setIngredients(ing || []);
      setReviews(revs || []);
      setPromotions(promos || []);
      if (ing?.length > 0) setImportIngId(ing[0].id);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login?redirect=/admin');
      return;
    }
    loadData();
  }, [user]);

  const handleToggleReviewStatus = async (reviewId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'VISIBLE' ? `/admin/reviews/${reviewId}/hide` : `/admin/reviews/${reviewId}/show`;
      await fetchApi(endpoint, { method: 'PATCH' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật đánh giá');
    }
  };

  const handleQuickImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importIngId || !importQty) return;

    try {
      setImportLoading(true);
      const suppliers = await fetchApi('/admin/suppliers');
      const supplierId = suppliers[0]?.id;

      await fetchApi('/admin/import-receipts', {
        method: 'POST',
        body: JSON.stringify({
          supplierId,
          items: [
            {
              ingredientId: importIngId,
              quantity: Number(importQty),
              unitPrice: 100,
            },
          ],
        }),
      });

      alert(`Đã nhập thêm ${importQty} đơn vị vào kho thành công!`);
      setImportQty('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi lập phiếu nhập kho');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-coffee-950">Trung Tâm Quản Trị Hệ Thống (Admin)</h1>
            <p className="text-xs text-coffee-600">Kiểm soát doanh thu, chuỗi cung ứng, kho nguyên liệu và đánh giá khách hàng.</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coffee-100 hover:bg-coffee-200 text-coffee-800 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-coffee-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider block">Tổng doanh thu</span>
            <div className="text-xl sm:text-2xl font-black text-coffee-950">
              {Number(overview.totalRevenue).toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-coffee-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider block">Tổng đơn hàng</span>
            <div className="text-xl sm:text-2xl font-black text-coffee-950">{overview.totalOrders}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-coffee-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider block">Khách hàng</span>
            <div className="text-xl sm:text-2xl font-black text-coffee-950">{overview.totalCustomers}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-coffee-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-coffee-500 uppercase tracking-wider block">Món đang bán</span>
            <div className="text-xl sm:text-2xl font-black text-coffee-950">{overview.totalProducts}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-coffee-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'stats' ? 'bg-coffee-900 text-white shadow' : 'bg-white text-coffee-700 hover:bg-coffee-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Doanh thu & Sản phẩm bán chạy</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'inventory' ? 'bg-coffee-900 text-white shadow' : 'bg-white text-coffee-700 hover:bg-coffee-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Kho nguyên liệu ({ingredients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'reviews' ? 'bg-coffee-900 text-white shadow' : 'bg-white text-coffee-700 hover:bg-coffee-100'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Kiểm duyệt Đánh giá ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'promotions' ? 'bg-coffee-900 text-white shadow' : 'bg-white text-coffee-700 hover:bg-coffee-100'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Mã khuyến mãi ({promotions.length})</span>
        </button>
      </div>

      {/* Tab 1: Stats */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue by Date */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
            <h3 className="font-black text-coffee-950 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-coffee-700" />
              <span>Biểu đồ doanh số theo ngày</span>
            </h3>
            <div className="space-y-2">
              {revenueStats.map((st) => (
                <div key={st.date} className="flex justify-between items-center p-3 rounded-xl bg-coffee-50/70 border border-coffee-100 text-sm">
                  <span className="font-semibold text-coffee-700">{st.date}</span>
                  <span className="font-black text-coffee-950">{Number(st.revenue).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
            <h3 className="font-black text-coffee-950 text-base flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>Top 5 đồ uống bán chạy nhất</span>
            </h3>
            <div className="space-y-2">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-coffee-900">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-coffee-950">{p.quantity} ly</span>
                    <span className="text-xs text-coffee-500 block">{Number(p.revenue).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory & Quick Import */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Quick Import Form */}
          <form onSubmit={handleQuickImport} className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
            <h3 className="font-black text-coffee-950 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Lập phiếu nhập kho nhanh (Cộng dồn tồn kho trong Transaction)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={importIngId}
                onChange={(e) => setImportIngId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-coffee-50 border border-coffee-200 text-xs font-semibold"
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Số lượng nhập..."
                value={importQty}
                onChange={(e) => setImportQty(e.target.value)}
                required
                min="1"
                className="px-3 py-2 rounded-xl bg-coffee-50 border border-coffee-200 text-xs font-semibold"
              />

              <button
                type="submit"
                disabled={importLoading}
                className="px-4 py-2 rounded-xl bg-coffee-800 text-white font-bold text-xs hover:bg-coffee-900 disabled:opacity-50"
              >
                {importLoading ? 'Đang nhập...' : 'Tạo phiếu & Tăng kho'}
              </button>
            </div>
          </form>

          {/* Ingredient List */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
            <h3 className="font-black text-coffee-950 text-base">Định mức tồn kho nguyên liệu (Optimistic Locking)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ingredients.map((ing) => {
                const isLow = Number(ing.stockQuantity) < 15000;
                return (
                  <div
                    key={ing.id}
                    className={`p-4 rounded-2xl border ${
                      isLow ? 'bg-red-50/60 border-red-200' : 'bg-coffee-50/50 border-coffee-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-coffee-900">{ing.name}</span>
                      {isLow && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Sắp hết
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex justify-between items-baseline">
                      <span className="text-xl font-black text-coffee-950">
                        {Number(ing.stockQuantity).toLocaleString('vi-VN')} {ing.unit}
                      </span>
                      <span className="text-[10px] text-coffee-500 font-mono">ver: {ing.version}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
          <h3 className="font-black text-coffee-950 text-base">Kiểm duyệt đánh giá từ khách hàng</h3>
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-coffee-50/50 border border-coffee-100 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-coffee-900">{rev.customer?.fullName}</span>
                    <span className="text-xs text-coffee-500">• Món: {rev.product?.name}</span>
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: rev.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-coffee-700">{rev.content}</p>
                  <span className="text-[10px] text-coffee-400 font-mono">{new Date(rev.createdAt).toLocaleString('vi-VN')}</span>
                </div>

                <button
                  onClick={() => handleToggleReviewStatus(rev.id, rev.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${
                    rev.status === 'VISIBLE'
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {rev.status === 'VISIBLE' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn đánh giá
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Mở hiển thị
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Promotions */}
      {activeTab === 'promotions' && (
        <div className="bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm space-y-4">
          <h3 className="font-black text-coffee-950 text-base">Danh sách chương trình khuyến mãi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotions.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-coffee-50/50 border border-coffee-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-coffee-900 text-sm">{p.code}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {p.discountType === 'PERCENT' ? `Giảm ${p.discountValue}%` : `Giảm ${Number(p.discountValue).toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <div className="text-xs text-coffee-700 font-medium">{p.name}</div>
                <div className="flex justify-between text-[11px] text-coffee-500 pt-1 border-t border-coffee-100">
                  <span>Đã dùng: {p.usedCount} / {p.quantity} lượt</span>
                  <span>HSD: {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
