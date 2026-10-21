'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { Button, PageHeader, Toast, Skeleton } from '../../components/ui';
import { RefreshCw, Clock } from 'lucide-react';
import { OrderRecord, OrderItemRecord } from '@/types';
import { ORDER_STATUS } from '@/lib/orderStatus';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function StaffKanbanPage() {
  const { ready } = useRequireRole(['STAFF', 'ADMIN']);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const loadOrders = async () => {
    try {
      const data: OrderRecord[] = await fetchApi('/staff/orders');
      setOrders(data || []);
      const now = new Date();
      setLastUpdated(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    } catch (err: unknown) {
      console.error('Lỗi tải đơn Barista:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;

    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [ready]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/accept`, { method: 'POST' });
      setToastMsg({ message: `Đã tiếp nhận đơn #${orderId.slice(0, 8).toUpperCase()}`, type: 'success' });
      loadOrders();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/ready`, { method: 'POST' });
      setToastMsg({ message: `Đơn #${orderId.slice(0, 8).toUpperCase()} đã pha xong. Chờ giao khách.`, type: 'success' });
      loadOrders();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/complete`, { method: 'POST' });
      setToastMsg({ message: `Đã bàn giao đơn #${orderId.slice(0, 8).toUpperCase()} cho khách.`, type: 'success' });
      loadOrders();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="space-y-6">
      {toastMsg && (
        <Toast
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      <PageHeader
        title="Quầy pha chế"
        description="Bảng Kanban theo dõi và thực hiện đơn hàng theo thời gian thực (FIFO)."
        action={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-ink-3 flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                Cập nhật: {lastUpdated}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              loading={loading}
              onClick={loadOrders}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Làm mới</span>
            </Button>
          </div>
        }
      />

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Column 1: Chờ pha */}
        <div className="border border-line rounded bg-surface-2 overflow-hidden border-t-2 border-t-ink">
          <div className="p-3 border-b border-line flex items-center justify-between bg-surface">
            <h2 className="text-xs font-semibold text-ink">{ORDER_STATUS.PAID.baristaTitle || 'Chờ pha chế'}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-2 font-semibold text-ink tabular-nums">
              {paidOrders.length}
            </span>
          </div>

          <div className="p-3 space-y-3 min-h-[300px]">
            {paidOrders.map((order) => (
              <div key={order.id} className="p-3.5 bg-surface border border-line rounded space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-ink">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-ink-3 tabular-nums">
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {order.items?.map((it: OrderItemRecord) => (
                    <div key={it.id} className="leading-snug">
                      <span className="font-bold text-ink text-sm">
                        {it.quantity}x {it.variant?.product?.name || 'Món uống'}
                      </span>
                      <span className="block text-xs text-ink-2 font-medium">
                        Size {it.variant?.size} {it.variant?.topping && `· Topping: ${it.variant.topping}`}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  loading={actionLoading === order.id}
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full text-xs font-semibold"
                >
                  Nhận pha đơn này
                </Button>
              </div>
            ))}

            {paidOrders.length === 0 && (
              <p className="text-xs text-ink-3 text-center py-8">Không có đơn chờ pha.</p>
            )}
          </div>
        </div>

        {/* Column 2: Đang pha */}
        <div className="border border-line rounded bg-surface-2 overflow-hidden border-t-2 border-t-accent">
          <div className="p-3 border-b border-line flex items-center justify-between bg-surface">
            <h2 className="text-xs font-semibold text-ink">{ORDER_STATUS.PREPARING.baristaTitle || 'Đang pha chế'}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-2 font-semibold text-ink tabular-nums">
              {preparingOrders.length}
            </span>
          </div>

          <div className="p-3 space-y-3 min-h-[300px]">
            {preparingOrders.map((order) => (
              <div key={order.id} className="p-3.5 bg-surface border border-line rounded space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-ink">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-ink-3 tabular-nums">
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {order.items?.map((it: OrderItemRecord) => (
                    <div key={it.id} className="leading-snug">
                      <span className="font-bold text-ink text-sm">
                        {it.quantity}x {it.variant?.product?.name || 'Món uống'}
                      </span>
                      <span className="block text-xs text-ink-2 font-medium">
                        Size {it.variant?.size} {it.variant?.topping && `· Topping: ${it.variant.topping}`}
                      </span>
                    </div>
                  ))}
                </div>

                {order.staff?.fullName && (
                  <p className="text-[11px] text-ink-3">
                    Barista: <span className="font-medium text-ink">{order.staff.fullName}</span>
                  </p>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  loading={actionLoading === order.id}
                  onClick={() => handleMarkReady(order.id)}
                  className="w-full text-xs font-semibold border-line-strong hover:bg-surface-2"
                >
                  Đã pha xong
                </Button>
              </div>
            ))}

            {preparingOrders.length === 0 && (
              <p className="text-xs text-ink-3 text-center py-8">Chưa có đơn đang pha.</p>
            )}
          </div>
        </div>

        {/* Column 3: Sẵn sàng lấy */}
        <div className="border border-line rounded bg-surface-2 overflow-hidden border-t-2 border-t-success">
          <div className="p-3 border-b border-line flex items-center justify-between bg-surface">
            <h2 className="text-xs font-semibold text-ink">{ORDER_STATUS.READY.baristaTitle || 'Sẵn sàng lấy tại quầy'}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-2 font-semibold text-ink tabular-nums">
              {readyOrders.length}
            </span>
          </div>

          <div className="p-3 space-y-3 min-h-[300px]">
            {readyOrders.map((order) => (
              <div key={order.id} className="p-3.5 bg-surface border border-line rounded space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-ink">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-success">Chờ khách lấy</span>
                </div>

                <div className="space-y-1 text-xs">
                  {order.items?.map((it: OrderItemRecord) => (
                    <div key={it.id} className="leading-snug">
                      <span className="font-bold text-ink text-sm">
                        {it.quantity}x {it.variant?.product?.name || 'Món uống'}
                      </span>
                      <span className="block text-xs text-ink-2">
                        Size {it.variant?.size} {it.variant?.topping && `· Topping: ${it.variant.topping}`}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  loading={actionLoading === order.id}
                  onClick={() => handleCompleteOrder(order.id)}
                  className="w-full text-xs font-semibold text-success hover:bg-success-soft"
                >
                  Xác nhận khách đã nhận
                </Button>
              </div>
            ))}

            {readyOrders.length === 0 && (
              <p className="text-xs text-ink-3 text-center py-8">Không có đơn đang chờ lấy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
