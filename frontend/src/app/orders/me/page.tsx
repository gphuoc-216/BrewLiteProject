'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { Star, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { OrderRecord, OrderItemRecord, OrderStatus } from '@/types';
import { ORDER_STATUS } from '@/lib/orderStatus';
import { useRequireRole } from '@/hooks/useRequireRole';

type OrderTab = 'ALL' | 'ACTIVE' | 'DONE' | 'ISSUE';

const ORDER_TABS: Array<{ key: OrderTab; label: string; statuses?: OrderStatus[] }> = [
  { key: 'ALL', label: 'Tất cả đơn' },
  { key: 'ACTIVE', label: 'Đang xử lý', statuses: ['PAID', 'PREPARING', 'READY'] },
  { key: 'DONE', label: 'Hoàn tất', statuses: ['COMPLETED'] },
  { key: 'ISSUE', label: 'Đã hủy / Lỗi', statuses: ['CANCELLED', 'PAYMENT_FAILED'] },
];

const PROGRESS_STEPS: OrderStatus[] = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

export default function OrdersMePage() {
  const router = useRouter();
  const { ready } = useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN']);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderRecord | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);
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
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    loadOrders();
  }, [ready]);

  const filteredOrders = useMemo(() => {
    const tab = ORDER_TABS.find((item) => item.key === activeTab);
    if (!tab?.statuses) return orders;
    return orders.filter((order) => tab.statuses?.includes(order.status));
  }, [activeTab, orders]);

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
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setCancellingLoading(false);
    }
  };

  const getReviewedProductIds = (order: OrderRecord): Set<string> => {
    return new Set((order.reviews || []).map((review) => review.productId));
  };

  const getUniqueProductsInOrder = (order: OrderRecord) => {
    const map = new Map<string, { id: string; name: string }>();
    for (const item of order.items || []) {
      const productId = item.variant?.product?.id || '';
      const productName = item.variant?.product?.name || 'Món uống';
      if (productId && !map.has(productId)) {
        map.set(productId, { id: productId, name: productName });
      }
    }
    return Array.from(map.values());
  };

  const isAllProductsReviewed = (order: OrderRecord) => {
    const reviewed = getReviewedProductIds(order);
    const products = getUniqueProductsInOrder(order);
    return products.length > 0 && products.every((product) => reviewed.has(product.id));
  };

  const openReviewModal = (order: OrderRecord) => {
    setReviewModalOrder(order);
    const reviewed = getReviewedProductIds(order);
    const products = getUniqueProductsInOrder(order);
    const unreviewed = products.find((product) => !reviewed.has(product.id));
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

      setToastMsg({ message: 'Cảm ơn bạn đã gửi đánh giá cho món uống!', type: 'success' });
      setReviewModalOrder(null);
      loadOrders();
    } catch (err: unknown) {
      setToastMsg({
        message:
          err instanceof ApiError && err.status === 409
            ? 'Món này đã được bạn đánh giá trước đó trong đơn hàng này.'
            : getErrorMessage(err),
        type: 'danger',
      });
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

      <div className="flex flex-wrap gap-2 border-b border-line pb-2">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-accent text-on-accent'
                : 'bg-surface border border-line text-ink-2 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border border-line rounded p-4 bg-surface space-y-2">
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
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="Không có đơn trong nhóm này"
          description="Hãy chọn tab khác để xem các đơn hàng còn lại."
          actionLabel="Xem tất cả đơn"
          onAction={() => setActiveTab('ALL')}
        />
      ) : (
        <div className="border border-line rounded bg-surface divide-y divide-line">
          {filteredOrders.map((order) => {
            const canCancel = order.status === 'PENDING' || order.status === 'PAID';
            const allReviewed = isAllProductsReviewed(order);
            const canReview = order.status === 'COMPLETED' && !allReviewed;
            const currentStep = ORDER_STATUS[order.status]?.step ?? -1;

            return (
              <div key={order.id} className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-ink">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="text-[11px] text-ink-3 tabular-nums">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-xs text-ink-2 truncate">
                      {order.items?.map((item: OrderItemRecord) => `${item.quantity}x ${item.variant?.product?.name || 'Món'}`).join(', ')}
                    </p>

                    <p className="text-xs font-semibold text-ink tabular-nums">
                      Tổng: {Number(order.totalAfterDiscount).toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                    {canReview && (
                      <Button variant="secondary" size="sm" onClick={() => openReviewModal(order)}>
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

                <div className="grid grid-cols-4 gap-2">
                  {PROGRESS_STEPS.map((status, index) => {
                    const isPassed = currentStep > index;
                    const isCurrent = currentStep === index;
                    const config = ORDER_STATUS[status];

                    return (
                      <div key={status} className="text-center space-y-1">
                        <div
                          className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            isPassed
                              ? 'bg-ink text-white'
                              : isCurrent
                              ? 'bg-accent text-on-accent'
                              : 'border border-line text-ink-3 bg-surface'
                          }`}
                        >
                          {isPassed ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <p className="text-[10px] text-ink-3 truncate">{config.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        title="Xác nhận hủy đơn hàng"
        description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
      >
        <div className="space-y-4 text-xs text-left">
          <div className="p-3 bg-warning-soft border border-warning/30 rounded text-warning flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-ink-2 leading-relaxed">
              Khi hủy đơn, hệ thống sẽ cập nhật trạng thái đơn và hoàn trả các dữ liệu liên quan theo nghiệp vụ.
            </p>
          </div>

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

      <Modal
        isOpen={!!reviewModalOrder}
        onClose={() => setReviewModalOrder(null)}
        title="Đánh giá chất lượng món uống"
        description="Chia sẻ cảm nhận thực tế của bạn để giúp quán hoàn thiện hương vị tốt hơn."
      >
        <form onSubmit={handleSendReview} className="space-y-4">
          <div className="space-y-1.5 text-xs text-left">
            <label className="font-semibold text-ink block">Chọn món trong đơn</label>
            <select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="w-full h-9 px-2.5 text-xs bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              {reviewModalOrder &&
                getUniqueProductsInOrder(reviewModalOrder).map((product) => {
                  const isReviewed = getReviewedProductIds(reviewModalOrder).has(product.id);
                  return (
                    <option key={product.id} value={product.id} disabled={isReviewed}>
                      {product.name} {isReviewed ? '(Đã đánh giá)' : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          <div className="space-y-1.5 text-xs text-left">
            <label className="font-semibold text-ink block">Mức độ hài lòng</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewStars(star)}
                  className="p-1 hover:opacity-80 transition-opacity focus-visible:outline-none"
                  aria-label={`${star} sao`}
                >
                  <Star
                    className={`w-5 h-5 ${star <= reviewStars ? 'text-ink fill-ink' : 'text-line'}`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-left">
            <label className="font-semibold text-ink block">Nhận xét chi tiết</label>
            <textarea
              required
              rows={3}
              value={reviewContent}
              onChange={(event) => setReviewContent(event.target.value)}
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
            <Button variant="primary" size="sm" type="submit" loading={reviewLoading}>
              Gửi đánh giá
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
