'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { Button, PageHeader, Toast, Skeleton, Modal } from '../../components/ui';
import { RefreshCw, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import { OrderRecord, OrderItemRecord } from '@/types';
import { ORDER_STATUS } from '@/lib/orderStatus';
import { useRequireRole } from '@/hooks/useRequireRole';

interface KanbanColumnConfig {
  key: 'PAID' | 'PREPARING' | 'READY';
  title: string;
  accentClass: string;
  emptyText: string;
  orders: OrderRecord[];
  actionLabel: string;
  actionVariant: 'primary' | 'secondary';
  actionClassName: string;
  onAction: (orderId: string) => void;
  showTimeInHeader?: boolean;
  headerBadge?: string;
}

export default function StaffKanbanPage() {
  const { ready } = useRequireRole(['STAFF']);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // UC-26: Xem công thức pha chế (Recipes)
  const [recipeModalOrder, setRecipeModalOrder] = useState<OrderRecord | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

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
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, [ready]);

  const handleOpenRecipes = async (order: OrderRecord) => {
    setRecipeError(null);
    setRecipeModalOrder(order);
    setRecipeLoading(true);
    try {
      const detailed: OrderRecord = await fetchApi(`/staff/orders/${order.id}/recipes`);
      if (detailed) {
        setRecipeModalOrder(detailed);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setRecipeError(msg);
      setToastMsg({ message: msg, type: 'danger' });
    } finally {
      setRecipeLoading(false);
    }
  };

  const runOrderAction = async (
    orderId: string,
    endpointSuffix: 'accept' | 'ready' | 'complete',
    successMessage: string
  ) => {
    try {
      setActionLoading(orderId);
      await fetchApi(`/staff/orders/${orderId}/${endpointSuffix}`, { method: 'POST' });
      setToastMsg({ message: successMessage, type: 'success' });
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

  const columns: KanbanColumnConfig[] = [
    {
      key: 'PAID',
      title: ORDER_STATUS.PAID.baristaTitle || 'Chờ pha chế',
      accentClass: 'border-t-ink',
      emptyText: 'Không có đơn chờ pha.',
      orders: paidOrders,
      actionLabel: 'Nhận pha đơn này',
      actionVariant: 'primary',
      actionClassName: 'w-full text-xs font-semibold',
      showTimeInHeader: true,
      onAction: (id) =>
        runOrderAction(id, 'accept', `Đã tiếp nhận đơn #${id.slice(0, 8).toUpperCase()}`),
    },
    {
      key: 'PREPARING',
      title: ORDER_STATUS.PREPARING.baristaTitle || 'Đang pha chế',
      accentClass: 'border-t-accent',
      emptyText: 'Chưa có đơn đang pha.',
      orders: preparingOrders,
      actionLabel: 'Đã pha xong',
      actionVariant: 'secondary',
      actionClassName: 'w-full text-xs font-semibold border-line-strong hover:bg-surface-2',
      showTimeInHeader: true,
      onAction: (id) =>
        runOrderAction(id, 'ready', `Đơn #${id.slice(0, 8).toUpperCase()} đã pha xong. Chờ giao khách.`),
    },
    {
      key: 'READY',
      title: ORDER_STATUS.READY.baristaTitle || 'Sẵn sàng lấy tại quầy',
      accentClass: 'border-t-success',
      emptyText: 'Không có đơn đang chờ lấy.',
      orders: readyOrders,
      actionLabel: 'Xác nhận khách đã nhận',
      actionVariant: 'secondary',
      actionClassName: 'w-full text-xs font-semibold text-success hover:bg-success-soft',
      headerBadge: 'Chờ khách lấy',
      onAction: (id) =>
        runOrderAction(id, 'complete', `Đã bàn giao đơn #${id.slice(0, 8).toUpperCase()} cho khách.`),
    },
  ];

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
        description="Bảng điều phối pha chế và hoàn thành đơn hàng theo thứ tự đặt món (đơn đặt trước làm trước)."
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
        {columns.map((col) => (
          <div
            key={col.key}
            className={`border border-line rounded bg-surface-2 overflow-hidden border-t-2 ${col.accentClass}`}
          >
            <div className="p-3 border-b border-line flex items-center justify-between bg-surface">
              <h2 className="text-xs font-semibold text-ink">{col.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-2 font-semibold text-ink tabular-nums">
                {col.orders.length}
              </span>
            </div>

            <div className="p-3 space-y-3 min-h-[300px]">
              {col.orders.map((order) => (
                <div key={order.id} className="p-3.5 bg-surface border border-line rounded space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-ink">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {col.headerBadge ? (
                      <span className="text-xs font-semibold text-success">{col.headerBadge}</span>
                    ) : col.showTimeInHeader ? (
                      <span className="text-ink-3 tabular-nums">
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : null}
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

                  {col.key === 'PREPARING' && order.staff?.fullName && (
                    <p className="text-[11px] text-ink-3">
                      Barista: <span className="font-medium text-ink">{order.staff.fullName}</span>
                    </p>
                  )}

                  <div className="space-y-2 pt-0.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenRecipes(order)}
                      className="w-full text-xs font-medium gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Xem công thức</span>
                    </Button>

                    <Button
                      variant={col.actionVariant}
                      size="sm"
                      loading={actionLoading === order.id}
                      onClick={() => col.onAction(order.id)}
                      className={col.actionClassName}
                    >
                      {col.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}

              {col.orders.length === 0 && (
                <p className="text-xs text-ink-3 text-center py-8">{col.emptyText}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal UC-26: Xem công thức pha chế chi tiết theo từng đơn */}
      <Modal
        isOpen={!!recipeModalOrder}
        onClose={() => {
          setRecipeModalOrder(null);
          setRecipeError(null);
        }}
        title={
          recipeModalOrder
            ? `Công thức pha chế · #${recipeModalOrder.id.slice(0, 8).toUpperCase()}`
            : 'Công thức pha chế'
        }
        description="Định lượng nguyên liệu chuẩn cho từng món trong đơn hàng."
        maxWidth="lg"
        footer={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setRecipeModalOrder(null);
              setRecipeError(null);
            }}
          >
            Đóng
          </Button>
        }
      >
        {recipeLoading && !recipeModalOrder?.items?.some((i) => i.variant?.recipes) ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : recipeError && !recipeModalOrder?.items?.length ? (
          <div className="p-3 rounded border border-danger/30 bg-danger-soft text-xs text-danger flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{recipeError}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {recipeError && (
              <div className="p-2.5 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Không đồng bộ được công thức mới nhất: {recipeError}</span>
              </div>
            )}

            {recipeModalOrder?.items?.map((item) => {
              const recipes = item.variant?.recipes || [];
              return (
                <div key={item.id} className="border border-line rounded p-3 bg-surface-2 space-y-2.5">
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.quantity}x {item.variant?.product?.name || 'Món uống'}
                      </p>
                      <p className="text-xs text-ink-2">
                        Size {item.variant?.size || 'M'}
                        {item.variant?.topping ? ` · Topping: ${item.variant.topping}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-2">
                      SL: {item.quantity} ly
                    </span>
                  </div>

                  {recipes.length > 0 ? (
                    <div className="divide-y divide-line text-xs bg-surface rounded border border-line">
                      {recipes.map((r) => {
                        const perCup = Number(r.quantityRequired);
                        const totalForOrder = Number((perCup * item.quantity).toFixed(2));
                        const unit = r.ingredient?.unit || '';
                        return (
                          <div key={r.id} className="px-3 py-2 flex items-center justify-between gap-3">
                            <span className="font-medium text-ink">
                              {r.ingredient?.name || 'Nguyên liệu'}
                            </span>
                            <div className="text-right tabular-nums">
                              <span className="font-semibold text-ink">
                                {totalForOrder} {unit}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-[11px] text-ink-3 ml-1.5">
                                  ({perCup} {unit}/ly)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Món này chưa được thiết lập công thức định lượng trong hệ thống. Vui lòng báo quản lý bổ sung.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
