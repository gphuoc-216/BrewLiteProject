'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getErrorMessage } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { StatusBadge, Button, Card, EmptyState, Skeleton } from '../../../components/ui';
import { Check, ArrowLeft, Award } from 'lucide-react';
import { OrderRecord, OrderItemRecord, OrderStatus } from '@/types';
import { ORDER_STATUS } from '@/lib/orderStatus';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { ready } = useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN']);
  const { fetchProfile } = useAuthStore();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const prevStatusRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrder = useCallback(async () => {
    // Dừng fetch khi tab ẩn để tiết kiệm tài nguyên
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    if (!params.id) return;

    try {
      const data: OrderRecord = await fetchApi(`/orders/${params.id}`);
      setOrder(data);

      // Server là nguồn sự thật: chỉ gọi fetchProfile đồng bộ navbar 1 lần khi chuyển sang COMPLETED
      if (data && data.status === 'COMPLETED' && prevStatusRef.current !== 'COMPLETED') {
        fetchProfile();
      }
      prevStatusRef.current = data?.status || null;

      // Dừng polling khi đơn ở trạng thái cuối cùng
      if (data && ['COMPLETED', 'CANCELLED', 'PAYMENT_FAILED'].includes(data.status)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err: unknown) {
      console.error('Lỗi tải đơn hàng:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [params.id, fetchProfile]);

  useEffect(() => {
    if (!ready || !params.id) return;

    fetchOrder();
    intervalRef.current = setInterval(fetchOrder, 4000);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        prevStatusRef.current &&
        !['COMPLETED', 'CANCELLED', 'PAYMENT_FAILED'].includes(prevStatusRef.current)
      ) {
        fetchOrder();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ready, params.id, fetchOrder]);

  if (!ready || loading) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12">
        <EmptyState
          title={`Không tìm thấy đơn hàng #${params.id}`}
          description="Đơn hàng không tồn tại hoặc bạn không có quyền xem thông tin này."
          actionLabel="Về trang chủ"
          onAction={() => router.push('/')}
        />
      </div>
    );
  }

  const timelineSteps: OrderStatus[] = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
  const currentIndex = ORDER_STATUS[order.status]?.step ?? -1;
  const isSpecialStatus = ['PENDING', 'PAYMENT_FAILED', 'CANCELLED'].includes(order.status);
  const earnedPoints = Math.floor((Number(order.totalAfterDiscount) || 0) / 1000);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/orders/history"
        className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Xem lịch sử đơn</span>
      </Link>

      {/* Main Order Card */}
      <Card className="space-y-6">
        <div className="text-center space-y-2 border-b border-line pb-5">
          <p className="text-xs text-ink-3">
            Mã đơn hàng: <span className="font-mono font-medium text-ink">#{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {order.status === 'COMPLETED'
              ? 'Đã hoàn tất món uống'
              : order.status === 'READY'
              ? 'Đồ uống đã sẵn sàng tại quầy'
              : order.status === 'PREPARING'
              ? 'Barista đang pha chế'
              : order.status === 'PAID'
              ? 'Đã tiếp nhận đơn hàng'
              : ORDER_STATUS[order.status]?.label || 'Trạng thái đơn hàng'}
          </h1>
          <div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Special Status Handler */}
        {isSpecialStatus ? (
          <div className="p-4 border border-line rounded bg-surface-2 text-center space-y-2">
            <p className="text-xs text-ink-2">
              {order.status === 'PAYMENT_FAILED'
                ? 'Giao dịch thanh toán của bạn không thành công. Hãy thử lại tại trang thanh toán.'
                : order.status === 'CANCELLED'
                ? 'Đơn hàng này đã được hủy bỏ thành công.'
                : 'Đơn hàng đang chờ thanh toán.'}
            </p>
            {order.status === 'PAYMENT_FAILED' && (
              <Button variant="primary" size="sm" onClick={() => router.push('/checkout')}>
                Quay lại thanh toán
              </Button>
            )}
          </div>
        ) : (
          /* 4-Step Timeline */
          <div className="py-2">
            <div className="grid grid-cols-4 gap-2">
              {timelineSteps.map((st, idx) => {
                const config = ORDER_STATUS[st];
                const isPassed = currentIndex > idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div key={st} className="text-center space-y-1.5">
                    {/* Circle marker */}
                    <div className="flex items-center justify-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          isPassed
                            ? 'bg-ink text-white'
                            : isCurrent
                            ? 'bg-accent text-on-accent ring-2 ring-accent/30'
                            : 'border border-line-strong text-ink-3 bg-surface'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>
                    </div>

                    <div>
                      <p
                        className={`text-xs ${
                          isCurrent ? 'font-semibold text-ink' : isPassed ? 'text-ink' : 'text-ink-3'
                        }`}
                      >
                        {config.label}
                      </p>
                      <p className="text-[10px] text-ink-3 hidden sm:block">{config.timelineSub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Points Reward Banner for Completed Orders */}
        {order.status === 'COMPLETED' && earnedPoints > 0 && (
          <div className="p-3 bg-surface-2 border border-line rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" strokeWidth={1.75} />
              <span className="text-ink font-medium">Điểm tích lũy cho đơn này:</span>
            </div>
            <span className="font-semibold text-accent tabular-nums">+{earnedPoints} điểm</span>
          </div>
        )}

        {/* Order Items Table */}
        <div className="border-t border-line pt-4 space-y-3">
          <h2 className="text-xs font-semibold text-ink">Chi tiết món đã đặt</h2>
          <div className="divide-y divide-line border-y border-line text-xs">
            {order.items?.map((it: OrderItemRecord) => (
              <div key={it.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-ink">
                    {it.quantity}x {it.variant?.product?.name || 'Món uống'}
                  </span>
                  <span className="text-ink-3 block">
                    Size: {it.variant?.size} {it.variant?.topping && `· ${it.variant.topping}`}
                  </span>
                </div>
                <span className="font-semibold text-ink tabular-nums">
                  {Number(it.lineTotal).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="space-y-1 text-xs pt-1">
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Giảm giá</span>
                <span className="tabular-nums">-{Number(order.discountAmount).toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between text-ink font-semibold pt-1 border-t border-line text-sm">
              <span>Tổng thanh toán</span>
              <span className="tabular-nums">{Number(order.totalAfterDiscount).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
