'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getErrorMessage } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { StatusBadge, Button, Card, EmptyState, Skeleton, Modal, Toast } from '../../../components/ui';
import { Check, ArrowLeft, Award, AlertTriangle, Home, CreditCard, RefreshCw, Star } from 'lucide-react';
import { OrderRecord, OrderItemRecord, OrderStatus, ReviewRecord } from '@/types';
import { ORDER_STATUS } from '@/lib/orderStatus';
import { useRequireRole } from '@/hooks/useRequireRole';

const getItemProductId = (item?: OrderItemRecord): string =>
  item?.variant?.product?.id ||
  (item?.variant as { productId?: string } | undefined)?.productId ||
  '';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { ready } = useRequireRole(['CUSTOMER']);
  const { fetchProfile } = useAuthStore();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  // Quản lý Đánh giá món uống (Review)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, ReviewRecord>>({});

  const getReviewForProduct = (productId: string): ReviewRecord | undefined => {
    if (!productId) return undefined;
    if (submittedReviews[productId]) return submittedReviews[productId];
    return order?.reviews?.find(
      (r) => r.productId === productId && (!order.customerId || r.customerId === order.customerId),
    );
  };

  const syncReviewFormForProduct = (productId: string) => {
    setSelectedProductId(productId);
    const existing = getReviewForProduct(productId);
    setEditingReviewId(existing?.id || null);
    setReviewStars(existing?.stars || 5);
    setReviewContent(existing?.content || '');
  };

  const openReviewModal = (productId?: string) => {
    const itemProductIds = Array.from(
      new Set((order?.items || []).map(getItemProductId).filter(Boolean)),
    );
    const unreviewedProductId = itemProductIds.find((pid) => !getReviewForProduct(pid));
    const targetProductId = productId || unreviewedProductId || itemProductIds[0] || '';
    syncReviewFormForProduct(targetProductId);
    setReviewModalOpen(true);
  };

  const handleSendReview = async () => {
    if (!order) return;
    const finalProductId = selectedProductId || getItemProductId(order.items?.[0]);

    if (!finalProductId) {
      setToastMsg({ message: 'Vui lòng chọn món uống cần đánh giá.', type: 'danger' });
      return;
    }

    const contentToSave = reviewContent.trim() || 'Đồ uống rất ngon và vừa miệng!';
    const existingReviewId = editingReviewId || getReviewForProduct(finalProductId)?.id || null;

    try {
      setReviewLoading(true);
      let savedReview: ReviewRecord;
      if (existingReviewId) {
        savedReview = await fetchApi<ReviewRecord>(`/reviews/${existingReviewId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            stars: reviewStars,
            content: contentToSave,
          }),
        });
        setToastMsg({ message: 'Cập nhật đánh giá món uống thành công!', type: 'success' });
      } else {
        savedReview = await fetchApi<ReviewRecord>('/reviews', {
          method: 'POST',
          body: JSON.stringify({
            orderId: order.id,
            productId: finalProductId,
            stars: reviewStars,
            content: contentToSave,
          }),
        });
        setToastMsg({ message: 'Cảm ơn bạn! Đánh giá món uống đã được gửi thành công.', type: 'success' });
      }

      if (savedReview?.id) {
        setSubmittedReviews((prev) => ({
          ...prev,
          [finalProductId]: savedReview,
        }));
      }
      setReviewModalOpen(false);
      await fetchOrder();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setReviewLoading(false);
    }
  };

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
    intervalRef.current = setInterval(fetchOrder, 2000);

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

  const confirmCancelOrder = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      await fetchApi(`/orders/${order.id}/cancel`, { method: 'POST' });
      setToastMsg({ message: 'Đã hủy đơn hàng thành công.', type: 'success' });
      setCancelModalOpen(false);
      await fetchOrder();
      fetchProfile();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setCancelling(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-accent">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-semibold text-base text-ink">Đang tải chi tiết đơn hàng...</h3>
          <p className="text-xs text-ink-3">Vui lòng chờ trong giây lát.</p>
        </div>
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
  const earnedPoints = Math.floor((Number(order.totalAfterDiscount) || 0) / 10000);
  const canCancel = order.status === 'PENDING' || order.status === 'PAID' || order.status === 'PAYMENT_FAILED';
  const uniqueOrderProductIds = Array.from(
    new Set((order.items || []).map(getItemProductId).filter(Boolean)),
  );
  const hasAnyReviewed = uniqueOrderProductIds.some((pid) => Boolean(getReviewForProduct(pid)));
  const allReviewed =
    uniqueOrderProductIds.length > 0 &&
    uniqueOrderProductIds.every((pid) => Boolean(getReviewForProduct(pid)));

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {toastMsg && (
        <Toast
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      <Link
        href="/orders/me"
        className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Xem lịch sử đơn</span>
      </Link>

      {/* Main Order Card */}
      <Card className="space-y-6">
        <div className="text-center space-y-2 border-b border-line pb-5">
          {order.status === 'PAID' && (
            <div className="mx-auto w-12 h-12 rounded-full bg-success-soft border border-success/30 flex items-center justify-center text-success">
              <Check className="w-6 h-6" strokeWidth={2.2} />
            </div>
          )}
          <p className="text-xs text-ink-3">
            Mã đơn: <span className="font-mono font-medium text-ink">#{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {order.status === 'COMPLETED'
              ? 'Đã hoàn tất món uống'
              : order.status === 'READY'
              ? 'Đồ uống đã sẵn sàng tại quầy'
              : order.status === 'PREPARING'
              ? 'Barista đang pha chế'
              : order.status === 'PAID'
              ? 'Đặt hàng thành công'
              : ORDER_STATUS[order.status]?.label || 'Trạng thái đơn hàng'}
          </h1>
          <div>
            <StatusBadge status={order.status} />
          </div>
          {order.status === 'PAID' && (
            <p className="text-xs font-medium text-success">
              Trạng thái: PAID · Mời tới quầy lấy nước
            </p>
          )}
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
              <Button variant="primary" size="sm" onClick={() => router.push(`/checkout?orderId=${order.id}`)}>
                Thanh toán lại ngay
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

        {/* Review Action Banner for Completed Orders */}
        {order.status === 'COMPLETED' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  {allReviewed
                    ? 'Cảm ơn bạn đã gửi đánh giá!'
                    : hasAnyReviewed
                    ? 'Bạn vẫn còn món chưa đánh giá!'
                    : 'Bạn thấy hương vị đồ uống thế nào?'}
                </p>
                <p className="text-[11px] text-ink-3">
                  {allReviewed
                    ? 'Bạn có thể chỉnh sửa lại số sao hoặc bổ sung thêm nhận xét.'
                    : 'Đánh giá số sao và chia sẻ trải nghiệm để BrewLite phục vụ tốt hơn.'}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openReviewModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-start sm:self-auto shadow-sm"
            >
              <Star className="w-3.5 h-3.5 mr-1 fill-white" />
              <span>{allReviewed ? 'Chỉnh sửa đánh giá' : '⭐ Đánh giá món uống'}</span>
            </Button>
          </div>
        )}

        {/* Order Items Table */}
        <div className="border-t border-line pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink">Chi tiết hóa đơn món đã đặt</h2>
            <span className="text-[11px] font-medium text-ink-3">
              Tổng cộng: {(order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0)} ly
            </span>
          </div>
          <div className="divide-y divide-line border-y border-line text-xs">
            {order.items?.map((it: OrderItemRecord) => {
              const itemProdId = getItemProductId(it);
              const existingItemReview = itemProdId ? getReviewForProduct(itemProdId) : undefined;
              return (
                <div key={it.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-ink">
                      {it.quantity}x {it.variant?.product?.name || 'Món uống'}
                    </span>
                    <span className="text-ink-3 block">
                      Size: {it.variant?.size} {it.variant?.topping && `· ${it.variant.topping}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ink tabular-nums">
                      {Number(it.lineTotal).toLocaleString('vi-VN')}đ
                    </span>
                    {order.status === 'COMPLETED' && itemProdId && (
                      <button
                        type="button"
                        onClick={() => openReviewModal(itemProdId)}
                        className="text-[11px] font-medium text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-0.5"
                      >
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{existingItemReview ? 'Sửa đánh giá' : 'Đánh giá'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-line">
          {(order.status === 'PENDING' || order.status === 'PAYMENT_FAILED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/checkout?orderId=${order.id}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1" />
              <span>Thanh toán ngay ({Number(order.totalAfterDiscount).toLocaleString('vi-VN')}đ)</span>
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => router.push('/')}>
            <Home className="w-3.5 h-3.5" />
            <span>Về trang chủ</span>
          </Button>
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
            >
              Hủy đơn hàng
            </Button>
          )}
        </div>
      </Card>

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác nhận hủy đơn hàng"
        description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
      >
        <div className="space-y-4 text-xs text-left">
          <div className="p-3 bg-warning-soft border border-warning/30 rounded text-warning flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-ink-2 leading-relaxed">
              Đơn ở trạng thái PENDING, PAYMENT_FAILED hoặc PAID có thể hủy theo sơ đồ trạng thái. Nếu đã thanh toán,
              hệ thống sẽ hoàn tồn kho và điểm thưởng tương ứng.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              disabled={cancelling}
              onClick={() => setCancelModalOpen(false)}
            >
              Giữ lại đơn
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              onClick={confirmCancelOrder}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Đánh giá món uống */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={editingReviewId ? 'Chỉnh sửa đánh giá món uống' : 'Đánh giá món uống'}
        description="Chia sẻ cảm nhận của bạn về hương vị đồ uống tại BrewLite"
      >
        <div className="space-y-4 text-xs text-left">
          {/* Chọn món uống nếu đơn có nhiều món */}
          {uniqueOrderProductIds.length > 1 && (
            <div className="space-y-1.5">
              <label className="font-medium text-ink">Chọn món cần đánh giá:</label>
              <select
                value={selectedProductId}
                onChange={(e) => syncReviewFormForProduct(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded bg-surface text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {uniqueOrderProductIds.map((pId) => {
                  const matchedItem = order.items?.find((it) => getItemProductId(it) === pId);
                  const reviewedMark = getReviewForProduct(pId) ? ' (Đã đánh giá)' : '';
                  return (
                    <option key={pId} value={pId}>
                      {matchedItem?.variant?.product?.name || 'Món uống'}
                      {reviewedMark}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Hiển thị tên món đang chọn */}
          <div className="p-2.5 bg-surface-2 border border-line rounded flex items-center justify-between">
            <span className="text-ink-3">Món đang đánh giá:</span>
            <span className="font-semibold text-ink">
              {order.items?.find((i) => getItemProductId(i) === selectedProductId)?.variant?.product?.name ||
                order.items?.[0]?.variant?.product?.name ||
                'Món uống'}
            </span>
          </div>

          {/* Chọn số sao */}
          <div className="space-y-1.5">
            <label className="font-medium text-ink block">Mức độ hài lòng của bạn:</label>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isActive = starVal <= reviewStars;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setReviewStars(starVal)}
                    className="p-1 rounded hover:scale-110 transition-transform focus:outline-none"
                    title={`${starVal} sao`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        isActive ? 'fill-amber-400 text-amber-500' : 'text-line-strong fill-transparent'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 font-semibold text-amber-600 text-sm">
                {reviewStars === 5
                  ? 'Tuyệt vời (5/5)'
                  : reviewStars === 4
                  ? 'Rất ngon (4/5)'
                  : reviewStars === 3
                  ? 'Bình thường (3/5)'
                  : reviewStars === 2
                  ? 'Chưa hài lòng (2/5)'
                  : 'Không ngon (1/5)'}
              </span>
            </div>
          </div>

          {/* Ô nhập nội dung */}
          <div className="space-y-1.5">
            <label className="font-medium text-ink block">Nhận xét chi tiết (tùy chọn):</label>
            <textarea
              rows={3}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Ví dụ: Đồ uống đậm vị, lớp kem béo ngậy, giao hàng nhanh chóng..."
              className="w-full px-3 py-2 border border-line rounded bg-surface text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent resize-none placeholder:text-ink-3"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              disabled={reviewLoading}
              onClick={() => setReviewModalOpen(false)}
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={reviewLoading}
              onClick={handleSendReview}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {editingReviewId ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
