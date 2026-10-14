'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { ChefHat, Coffee, Clock, CheckCircle2, ArrowRight, Play, Check, RefreshCw, AlertCircle } from 'lucide-react';

export default function StaffKanbanPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const data = await fetchApi('/staff/orders');
      setOrders(data || []);
    } catch (err: any) {
      console.error('Lỗi tải đơn Barista:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
      router.push('/login?redirect=/staff');
      return;
    }

    loadOrders();
    // Tự động làm mới mỗi 5 giây (Kanban Realtime Polling)
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/accept`, { method: 'POST' });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Lỗi nhận đơn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/ready`, { method: 'POST' });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/complete`, { method: 'POST' });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Lỗi hoàn tất');
    } finally {
      setActionLoading(null);
    }
  };

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-coffee-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-coffee-950">Bảng Kanban Quầy Pha Chế (Barista)</h1>
            <p className="text-xs text-coffee-600">Tự động cập nhật mỗi 5 giây. Nhận đơn, pha chế và bàn giao nước.</p>
          </div>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coffee-100 hover:bg-coffee-200 text-coffee-800 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới tức thì</span>
        </button>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Chờ pha (PAID) */}
        <div className="bg-white/80 rounded-3xl p-5 border border-blue-200 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-black text-coffee-950 text-sm">Chờ pha chế (PAID)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
              {paidOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
            {paidOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-coffee-400 italic">Không có đơn chờ pha</div>
            ) : (
              paidOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-coffee-200 shadow-sm space-y-3 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-black text-sm text-coffee-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <div className="text-[11px] text-coffee-500 font-medium">{order.customer?.fullName}</div>
                    </div>
                    <span className="text-[10px] text-coffee-400 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-1 text-xs">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="text-coffee-800">
                        <span className="font-bold text-coffee-950">{it.quantity}x</span> {it.variant.product.name} (Size {it.variant.size})
                        {it.variant.topping && <span className="text-[11px] text-coffee-500 block pl-4">• {it.variant.topping}</span>}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    disabled={actionLoading === order.id}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Nhận đơn pha chế</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Đang pha (PREPARING) */}
        <div className="bg-white/80 rounded-3xl p-5 border border-purple-200 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="font-black text-coffee-950 text-sm">Đang pha chế (PREPARING)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-coffee-400 italic">Chưa có ly nào đang pha</div>
            ) : (
              preparingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-purple-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-black text-sm text-coffee-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <div className="text-[11px] text-coffee-500 font-medium">{order.customer?.fullName}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">Đang pha</span>
                  </div>

                  <div className="space-y-1.5 py-1 text-xs">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="text-coffee-800">
                        <span className="font-bold text-coffee-950">{it.quantity}x</span> {it.variant.product.name} (Size {it.variant.size})
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMarkReady(order.id)}
                    disabled={actionLoading === order.id}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Pha xong (Sẵn sàng)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Sẵn sàng giao (READY) */}
        <div className="bg-white/80 rounded-3xl p-5 border border-emerald-200 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-black text-coffee-950 text-sm">Sẵn sàng giao (READY)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
            {readyOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-coffee-400 italic">Không có đơn chờ khách lấy</div>
            ) : (
              readyOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-black text-sm text-coffee-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <div className="text-[11px] text-coffee-500 font-medium">{order.customer?.fullName}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Chờ khách</span>
                  </div>

                  <div className="space-y-1.5 py-1 text-xs">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="text-coffee-800">
                        <span className="font-bold text-coffee-950">{it.quantity}x</span> {it.variant.product.name} (Size {it.variant.size})
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    disabled={actionLoading === order.id}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Bàn giao cho khách (COMPLETED)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
