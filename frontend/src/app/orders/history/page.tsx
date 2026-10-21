'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getErrorMessage, ApiError } from '../../../lib/api';
import {
  StatusBadge,
  Button,
  PageHeader,
  Modal,
  Toast,
  EmptyState,
  Skeleton,
} from '../../../components/ui';
import { Star, ArrowRight, AlertTriangle } from 'lucide-react';
import { OrderRecord, OrderItemRecord } from '@/types';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { ready } = useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN']);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal hủy đơn
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderRecord | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Modal đánh giá món
  const [reviewModalOrder, setReviewModalOrder] = useState<OrderRecord | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data: OrderRecord[] = await fetchApi('/orders/me');
      setOrders(data || []);
    } catch (err: unknown) {
      console.error('Lỗi tải lịch sử đơn:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    loadOrders();
  }, [ready]);

  const confirmCancelOrder = async () => {
    if (!cancelModalOrder) return;

    try {
      setCancellingLoading(true);
      await fetchApi(`/orders/${cancelModalOrder.id}/cancel`, { method: 'POST' });
      setToastMsg({
        message: 'Đã hủy đơn thành công. Tiền và tồn kho nguyên liệu đã được hoàn trả.',
        type: 'success',
      });
      setCancelModalOrder(null);
      loadOrders();
    } catch (err: unknown) {
      setToastMsg({
        message: getErrorMessage(err),
        type: 'danger',
      });
    } finally {
      setCancellingLoading(false);
    }
  };

  // Lấy tập hợp productId đã đánh giá
  const getReviewedProductIds = (order: OrderRecord): Set<string> => {
    return new Set((order.reviews || []).map((r) => r.productId));
  };

  // Gom các món trong đơn theo productId (chống trùng lặp khi cùng món khác size)
  const getUniqueProductsInOrder = (order: OrderRecord) => {
    const map = new Map<string, { id: string; name: string }>();
    for (const item of order.items || []) {
      const pId = item.variant?.product?.id || '';
      const pName = item.variant?.product?.name || 'Món uống';
      if (pId && !map.has(pId)) {
        map.set(pId, { id: pId, name: pName });
      }
    }
    return Array.from(map.values());
  };

  // Kiểm tra đơn hàng đã hoàn tất đánh giá toàn bộ món chưa
  const isAllProductsReviewed = (order: OrderRecord) => {
    const reviewed = getReviewedProductIds(order);
    const products = getUniqueProductsInOrder(order);
    return products.length > 0 && products.every((p) => reviewed.has(p.id));
  };

  const openReviewModal = (order: OrderRecord) => {
    setReviewModalOrder(order);
    const reviewed = getReviewedProductIds(order);
    const products = getUniqueProductsInOrder(order);
    const unreviewed = products.find((p) => !reviewed.has(p.id));
    setSelectedProductId(unreviewed ? unreviewed.id : products[0]?.id || '');
    setReviewStars(5);
    setReviewContent('');
  };

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder || !selectedProductId) return;

    try {
      setReviewLoading(true);
      await fetchApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: reviewModalOrder.id,
          productId: selectedProductId,
          stars: reviewStars,
          content: reviewContent,
        }),
      });

      setToastMsg({
        message: 'Cảm ơn bạn đã gửi đánh giá cho món uống!',
        type: 'success',
      });
      setReviewModalOrder(null);
      loadOrders();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setToastMsg({
          message: 'Món này đã được bạn đánh giá trước đó trong đơn hàng này.',
          type: 'danger',
        });
      } else {
        setToastMsg({
          message: getErrorMessage(err),
          type: 'danger',
        });
      }
    } finally {
      setReviewLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

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
        title="Lịch sử đơn hàng"
        description="Theo dõi tình trạng chế biến và nhận hóa đơn của các đơn bạn đã đặt."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-line rounded p-4 bg-surface space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Bạn chưa đặt món uống nào tại BrewLite. Hãy chọn ngay một ly cà phê đậm vị nhé."
          actionLabel="Đặt món ngay"
          onAction={() => router.push('/')}
        />
      ) : (
        <div className="border border-line rounded bg-surface divide-y divide-line">
          {orders.map((order) => {
            const canCancel = order.status === 'PENDING' || order.status === 'PAID';
            const allReviewed = isAllProductsReviewed(order);
            const canReview = order.status === 'COMPLETED' && !allReviewed;

            return (
              <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-[11px] text-ink-3 tabular-nums">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Summary of items */}
                  <p className="text-xs text-ink-2 truncate">
                    {order.items?.map((it: OrderItemRecord) => `${it.quantity}x ${it.variant?.product?.name || 'Món'}`).join(', ')}
                  </p>

                  <p className="text-xs font-semibold text-ink tabular-nums">
                    Tổng: {Number(order.totalAfterDiscount).toLocaleString('vi-VN')}đ
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {canReview && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openReviewModal(order)}
                    >
                      Đánh giá món
                    </Button>
                  )}

                  {order.status === 'COMPLETED' && allReviewed && (
                    <span className="text-[11px] text-ink-3 px-2 py-1 bg-surface-2 rounded border border-line">
                      Đã đánh giá đủ món
                    </span>
                  )}

                  {canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelModalOrder(order)}
                      className="text-danger hover:bg-danger-soft"
                    >
                      Hủy đơn
                    </Button>
                  )}

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="secondary" size="sm" className="gap-1">
                      <span>Chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Hủy Đơn */}
      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        title="Xác nhận hủy đơn hàng"
        description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
      >
        <div className="space-y-4 text-xs text-left">
          <div className="p-3 bg-warning-soft border border-warning/30 rounded text-warning flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="space-y-1">
              <span className="font-semibold block">Chính sách hủy đơn & hoàn trả</span>
              <p className="text-ink-2 leading-relaxed">
                Khi hủy đơn, toàn bộ số tiền thanh toán sẽ được hoàn về ví thành viên. Định mức
                nguyên liệu đã trừ tự động được khôi phục về kho của quán.
              </p>
            </div>
          </div>

          {cancelModalOrder && (
            <div className="p-3 bg-surface-2 border border-line rounded space-y-1 text-ink-2">
              <p>Mã đơn: <span className="font-mono font-medium text-ink">#{cancelModalOrder.id.slice(0, 8).toUpperCase()}</span></p>
              <p>Số tiền hoàn trả: <span className="font-semibold text-ink">{Number(cancelModalOrder.totalAfterDiscount).toLocaleString('vi-VN')}đ</span></p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              disabled={cancellingLoading}
              onClick={() => setCancelModalOrder(null)}
            >
              Giữ lại đơn
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancellingLoading}
              onClick={confirmCancelOrder}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Đánh Giá Món Uống */}
      <Modal
        isOpen={!!reviewModalOrder}
        onClose={() => setReviewModalOrder(null)}
        title="Đánh giá chất lượng món uống"
        description="Chia sẻ cảm nhận thực tế của bạn để giúp quán hoàn thiện hương vị tốt hơn."
      >
        <form onSubmit={handleSendReview} className="space-y-4">
          {/* Select Product in Order (Gom theo productId, đánh dấu món đã đánh giá) */}
          <div className="space-y-1.5 text-xs text-left">
            <label className="font-semibold text-ink block">Chọn món trong đơn</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-9 px-2.5 text-xs bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              {reviewModalOrder &&
                getUniqueProductsInOrder(reviewModalOrder).map((prod) => {
                  const isReviewed = getReviewedProductIds(reviewModalOrder).has(prod.id);
                  return (
                    <option key={prod.id} value={prod.id} disabled={isReviewed}>
                      {prod.name} {isReviewed ? '(Đã đánh giá)' : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Star Rating */}
          <div className="space-y-1.5 text-xs text-left">
            <label className="font-semibold text-ink block">Mức độ hài lòng</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewStars(s)}
                  className="p-1 hover:opacity-80 transition-opacity focus-visible:outline-none"
                  aria-label={`${s} sao`}
                >
                  <Star
                    className={`w-5 h-5 ${s <= reviewStars ? 'text-ink fill-ink' : 'text-line'}`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div className="space-y-1.5 text-xs text-left">
            <label className="font-semibold text-ink block">Nhận xét chi tiết</label>
            <textarea
              required
              rows={3}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Hương vị món uống, độ ngọt, chất lượng bọt sữa..."
              className="w-full p-2.5 text-xs bg-bg border border-line rounded text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={reviewLoading}
              onClick={() => setReviewModalOrder(null)}
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={reviewLoading}
            >
              Gửi đánh giá
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
