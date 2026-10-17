'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import { Coffee, Clock, AlertCircle, Star, XCircle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/orders/me');
      setOrders(data || []);
    } catch (err: any) {
      console.error('Lỗi tải lịch sử đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/orders/history');
      return;
    }
    loadOrders();
  }, [user]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Hệ thống sẽ hoàn tiền và hoàn tồn kho nguyên liệu.')) return;

    try {
      setCancellingId(orderId);
      await fetchApi(`/orders/${orderId}/cancel`, { method: 'POST' });
      setMsg('Đã hủy đơn hàng thành công! Số lượng nguyên liệu và điểm thưởng đã được hoàn trả.');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể hủy đơn hàng này');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;

    try {
      setReviewLoading(true);
      const firstItem = reviewModalOrder.items[0];
      await fetchApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: reviewModalOrder.id,
          productId: firstItem.variant.product.id,
          stars: reviewStars,
          content: reviewContent,
        }),
      });

      alert('Đã gửi đánh giá thành công! Cảm ơn nhận xét của bạn.');
      setReviewModalOrder(null);
      setReviewContent('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Lỗi gửi đánh giá');
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">Chờ thanh toán</span>;
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">Đã thanh toán (Chờ pha)</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold">Đang pha chế</span>;
      case 'READY':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">Sẵn sàng lấy nước</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-bold">Đã hoàn tất</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-coffee-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-coffee-950">Lịch sử đặt hàng</h1>
          <p className="text-xs text-coffee-600 mt-1">Theo dõi tiến độ đồ uống và gửi đánh giá món</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-coffee-200 text-xs font-bold text-coffee-700 hover:bg-coffee-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-emerald-600 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-coffee-100 animate-pulse space-y-3">
              <div className="h-5 bg-coffee-100 rounded w-1/4" />
              <div className="h-4 bg-coffee-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200 space-y-4">
          <Coffee className="w-12 h-12 text-coffee-400 mx-auto" />
          <h3 className="text-lg font-bold text-coffee-950">Bạn chưa có đơn hàng nào</h3>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coffee-800 text-white font-bold text-sm"
          >
            <span>Đặt món ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = order.status === 'PENDING' || order.status === 'PAID';
            const canReview = order.status === 'COMPLETED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border border-coffee-200 shadow-sm space-y-4 hover:border-coffee-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coffee-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-coffee-500">Mã đơn: </span>
                    <span className="font-mono font-black text-coffee-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-coffee-400 ml-2 font-medium">
                      ({new Date(order.createdAt).toLocaleString('vi-VN')})
                    </span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-coffee-100 text-coffee-800 font-bold text-xs flex items-center justify-center">
                          {it.quantity}
                        </span>
                        <span className="font-semibold text-coffee-950">{it.variant.product.name}</span>
                        <span className="text-xs text-coffee-500">(Size {it.variant.size})</span>
                      </div>
                      <span className="font-bold text-coffee-900">{Number(it.lineTotal).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>

                {/* Footer details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-coffee-100 text-sm">
                  <div>
                    <span className="text-xs text-coffee-500">Tổng thanh toán: </span>
                    <span className="font-black text-base text-coffee-900">
                      {Number(order.totalAfterDiscount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View details */}
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-3 py-1.5 rounded-xl bg-coffee-50 hover:bg-coffee-100 text-coffee-800 text-xs font-bold transition-colors"
                    >
                      Tiến độ đơn
                    </Link>

                    {/* Review Button */}
                    {canReview && (
                      <button
                        onClick={() => setReviewModalOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Đánh giá món</span>
                      </button>
                    )}

                    {/* Cancel Order Button */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy đơn</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-coffee-950 flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span>Đánh giá đồ uống</span>
            </h3>
            <p className="text-xs text-coffee-600">
              Đơn hàng #{reviewModalOrder.id.slice(0, 8).toUpperCase()} đã hoàn thành. Hãy để lại nhận xét nhé!
            </p>

            <form onSubmit={handleSendReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-coffee-700 block mb-1">Số sao hài lòng (1 - 5 sao)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewStars(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewStars ? 'fill-amber-400' : 'text-coffee-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-coffee-700 block mb-1">Nội dung nhận xét</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  required
                  rows={3}
                  placeholder="Hương vị thế nào, độ ngọt đá ra sao..."
                  className="w-full p-3 rounded-xl bg-coffee-50 border border-coffee-200 text-sm focus:outline-none focus:border-coffee-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-coffee-600 hover:bg-coffee-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-5 py-2 rounded-xl bg-coffee-800 text-white text-xs font-bold hover:bg-coffee-900 disabled:opacity-50"
                >
                  {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
