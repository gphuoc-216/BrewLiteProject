'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { CheckCircle2, Coffee, Clock, ChefHat, Check, ArrowRight, Home, RefreshCw } from 'lucide-react';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const data = await fetchApi(`/orders/${params.id}`);
      setOrder(data);
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchOrder();
      // Polling tự động mỗi 4 giây để cập nhật trạng thái pha chế từ Barista
      const interval = setInterval(fetchOrder, 4000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-coffee-700 mx-auto" />
        <p className="text-sm text-coffee-600">Đang kiểm tra trạng thái đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-coffee-950">Không tìm thấy đơn hàng #{params.id}</h2>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-coffee-800 text-white text-sm font-semibold">
          Về trang chủ
        </Link>
      </div>
    );
  }

  // Stepper statuses
  const steps = [
    { key: 'PAID', label: 'Đã thanh toán', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Đang pha chế', icon: ChefHat },
    { key: 'READY', label: 'Sẵn sàng lấy', icon: Coffee },
    { key: 'COMPLETED', label: 'Đã nhận đồ', icon: Check },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'PAID': return 0;
      case 'PREPARING': return 1;
      case 'READY': return 2;
      case 'COMPLETED': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Wireframe Screen 5: Xác nhận đơn */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-coffee-200 shadow-sm text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-coffee-950">Đặt hàng thành công!</h1>
          <p className="text-sm font-bold text-coffee-600">
            Mã đơn hàng: <span className="text-coffee-950 font-mono text-base">#{order.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
            Trạng thái: {order.status}
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="py-6 border-y border-coffee-100">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((st, index) => {
              const Icon = st.icon;
              const isPastOrCurrent = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={st.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-coffee-800 text-white ring-4 ring-coffee-200 shadow-md scale-110'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-coffee-100 text-coffee-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-bold ${isPastOrCurrent ? 'text-coffee-950' : 'text-coffee-400'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call-to-action Instruction */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold">
          {order.status === 'READY'
            ? '🎉 Đồ uống của bạn đã sẵn sàng! Mời tới quầy nhận nước ngay.'
            : order.status === 'PREPARING'
            ? '☕ Barista đang pha chế đồ uống cho bạn. Vui lòng chờ vài phút nhé.'
            : 'Mời tới quầy lấy nước khi màn hình thông báo Sẵn sàng.'}
        </div>

        {/* Order Details Accordion / List */}
        <div className="text-left space-y-2.5 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-coffee-700">Danh sách ly trong đơn:</h4>
          {order.items?.map((it: any) => (
            <div key={it.id} className="flex justify-between items-center text-sm py-1 border-b border-coffee-50">
              <span className="font-semibold text-coffee-900">
                {it.quantity}x {it.variant.product.name} (Size {it.variant.size})
              </span>
              <span className="font-black text-coffee-800">{Number(it.lineTotal).toLocaleString('vi-VN')}đ</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-2 text-base font-black text-coffee-950">
            <span>Tổng đã thanh toán:</span>
            <span>{Number(order.totalAfterDiscount).toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>

          <Link
            href="/orders/history"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-coffee-100 hover:bg-coffee-200 text-coffee-800 font-bold text-sm flex items-center justify-center gap-2"
          >
            <span>Lịch sử đơn của tôi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
