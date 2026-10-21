'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../../store/useCartStore';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { Button, PageHeader } from '../../components/ui';
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  Clock,
  CheckCircle2,
  QrCode,
  Smartphone,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function CheckoutPage() {
  const router = useRouter();
  const { ready, user } = useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN']);
  const { items, promotion, getFinalTotal, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'WALLET'>('CARD');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Trạng thái thanh toán: 'WAITING' (đang chờ) hoặc 'SUCCESS' (thành công)
  // Nếu chuyển sai nội dung -> Hệ thống giữ nguyên trạng thái WAITING, đứng im như người dùng yêu cầu
  const [paymentStatus, setPaymentStatus] = useState<'WAITING' | 'SUCCESS'>('WAITING');
  const [successNotice, setSuccessNotice] = useState<{
    amount: number;
    senderStk: string;
    senderName: string;
    code: string;
  } | null>(null);

  // Đồng hồ đếm ngược 5 phút (TTL 300 giây)
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [isQrExpired, setIsQrExpired] = useState(false);

  // Lưu trữ orderId và idempotencyKey để tránh tạo trùng đơn khi bấm nhiều lần
  const existingOrderRef = useRef<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const finalTotal = getFinalTotal();
  const [orderCodeDisplay, setOrderCodeDisplay] = useState('BL8899');

  // Khởi tạo mã đơn hàng ngẫu nhiên
  useEffect(() => {
    const randomCode = 'BL' + Math.floor(1000 + Math.random() * 9000);
    setOrderCodeDisplay(randomCode);
    localStorage.setItem('brewlite_pending_order', randomCode);
  }, []);

  // Âm thanh Ting Ting Web Audio API khi thanh toán thành công
  const playTingTing = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.setValueAtTime(2093, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch {
      // AudioContext có thể bị chặn nếu chưa tương tác
    }
  }, []);

  // Đếm ngược thời gian hiệu lực 5 phút của mã QR
  useEffect(() => {
    if (ttlSeconds <= 0) {
      setIsQrExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTtlSeconds((prev) => {
        if (prev <= 1) {
          setIsQrExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ttlSeconds]);

  // Làm mới mã QR (gia hạn thêm 5 phút)
  const refreshCurrentQr = () => {
    const newCode = 'BL' + Math.floor(1000 + Math.random() * 9000);
    setOrderCodeDisplay(newCode);
    localStorage.setItem('brewlite_pending_order', newCode);
    setTtlSeconds(300);
    setIsQrExpired(false);
    setPaymentStatus('WAITING');
    setErrorMsg(null);
  };

  // Xử lý xác nhận thanh toán & chuyển trang
  const handlePay = useCallback(
    async (paymentDetails?: { senderStk: string; senderName: string }) => {
      if (!user) {
        setErrorMsg('Vui lòng đăng nhập tài khoản trước khi thực hiện thanh toán!');
        router.push('/login?redirect=/checkout');
        return false;
      }

      if (items.length === 0) {
        router.push('/');
        return false;
      }

      if (isQrExpired) {
        setErrorMsg('Mã QR đã hết hạn. Vui lòng bấm "Tạo Lại Mã Mới (+5 Phút)" trước khi xác nhận.');
        return false;
      }

      try {
        setLoading(true);
        setErrorMsg(null);

        let orderId = existingOrderRef.current;

        // 1. Tạo đơn hàng mới nếu chưa có orderId
        if (!orderId) {
          const orderPayload = {
            items: items.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            promotionCode: promotion ? promotion.code : undefined,
          };

          const orderRes = await fetchApi<any>('/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload),
          });

          // Trích xuất id an toàn từ response (hỗ trợ cả unboxed và boxed object)
          orderId = orderRes?.id || orderRes?.data?.id;
          if (!orderId) {
            throw new Error('Không thể khởi tạo đơn hàng từ máy chủ. Vui lòng thử lại.');
          }
          existingOrderRef.current = orderId;
        }

        // 2. Sinh UUIDv4 duy nhất cho idempotencyKey nếu chưa có
        if (!idempotencyKeyRef.current) {
          idempotencyKeyRef.current =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }

        // 3. Thực hiện thanh toán không tiền mặt lên máy chủ
        await fetchApi('/payments', {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKeyRef.current,
          },
          body: JSON.stringify({
            orderId,
            method: paymentMethod,
          }),
        });

        // 4. Phát chuông Ting Ting và đổi trạng thái hoàn tất
        playTingTing();
        setPaymentStatus('SUCCESS');
        setSuccessNotice({
          code: orderCodeDisplay,
          amount: finalTotal,
          senderStk: paymentDetails?.senderStk || '0589822346',
          senderName:
            paymentDetails?.senderName || user?.fullName || user?.username || 'Khách Hàng BrewLite',
        });

        // Dọn dẹp giỏ hàng
        existingOrderRef.current = null;
        idempotencyKeyRef.current = null;
        localStorage.removeItem('brewlite_pending_order');
        clearCart();

        // Chuyển hướng mượt mà đến trang theo dõi đơn hàng
        setTimeout(() => {
          router.push(`/orders/${orderId}`);
        }, 1800);
        return true;
      } catch (err: unknown) {
        setErrorMsg(getErrorMessage(err));
        setPaymentStatus('WAITING');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, items, isQrExpired, promotion, paymentMethod, playTingTing, orderCodeDisplay, finalTotal, clearCart, router]
  );

  // Lắng nghe sự kiện chuyển khoản hợp lệ từ nền (nếu có ứng dụng đồng bộ)
  useEffect(() => {
    let lastHandledTime = 0;

    const checkMbPayment = () => {
      const raw =
        localStorage.getItem('brewlite_mb_payment') || localStorage.getItem('last_mb_payment');
      if (!raw) return;

      try {
        const data = JSON.parse(raw);
        if (
          data &&
          data.time &&
          data.time > lastHandledTime &&
          Date.now() - data.time < 120000
        ) {
          lastHandledTime = data.time;
          const content = String(data.content || '').toUpperCase();
          const targetCode = orderCodeDisplay.toUpperCase();

          if (content.includes(targetCode)) {
            // ĐÚNG NỘI DUNG: Kích hoạt thanh toán thành công
            handlePay({
              senderStk: data.sender || '0589822346',
              senderName: data.sender_name || user?.fullName || user?.username || 'Khách Hàng BrewLite',
            });
          } else {
            // SAI NỘI DUNG: Theo yêu cầu của bạn, hệ thống ĐỨNG IM, KHÔNG BÁO GÌ CẢ.
            // Mã QR giữ nguyên, trạng thái vẫn là WAITING để bạn tự biết.
          }
        }
      } catch {
        // Bỏ qua lỗi parse
      }
    };

    window.addEventListener('storage', checkMbPayment);
    const interval = setInterval(checkMbPayment, 1200);

    return () => {
      window.removeEventListener('storage', checkMbPayment);
      clearInterval(interval);
    };
  }, [orderCodeDisplay, handlePay, user]);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!ready || !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink">
            Yêu Cầu Đăng Nhập Tài Khoản
          </h2>
          <p className="text-xs text-ink-2 leading-relaxed">
            BrewLite áp dụng cơ chế thanh toán định danh để sinh mã VietQR cá nhân hóa và tích lũy điểm thưởng thành viên. Vui lòng đăng nhập tài khoản khách hàng để tiếp tục thanh toán.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login?redirect=/checkout"
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-lg shadow-sm transition-colors text-center"
          >
            Đăng Nhập Ngay
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-surface border border-line hover:border-line-strong text-ink text-xs font-medium rounded-lg transition-colors text-center"
          >
            Đăng Ký Tài Khoản Mới
          </Link>
        </div>
      </div>
    );
  }

  const qrImageUrl = `https://img.vietqr.io/image/MB-0589822346-compact2.png?amount=${finalTotal}&addInfo=BREWLITE%20${orderCodeDisplay}&accountName=BREWLITE%20COFFEE`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Quay lại giỏ hàng</span>
      </Link>

      <PageHeader
        title="Cổng Thanh Toán & Quét Mã VietQR MBBank"
        description="Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ trên điện thoại để hoàn tất thanh toán nhanh chóng."
      />

      {/* Tabs Chuyển Phương Thức Thanh Toán */}
      <div className="flex border-b border-line gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod('CARD')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            paymentMethod === 'CARD'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>🏦 Quét Mã VietQR MBBank</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod('WALLET')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            paymentMethod === 'WALLET'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>👛 Ví Thành Viên BrewLite</span>
        </button>
      </div>

      {paymentMethod === 'CARD' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: MÃ VIETQR VỚI THỜI GIAN 5 PHÚT */}
          <div className="lg:col-span-5 bg-surface border border-line-strong rounded-2xl p-5 shadow-sm text-center space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="text-left">
                <h3 className="font-display font-semibold text-sm text-ink flex items-center gap-1.5">
                  <span>🏦 Mã VietQR Chuẩn MBBank</span>
                </h3>
                <span className="text-[11px] text-ink-3">Ngân hàng TMCP Quân Đội</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success-soft px-2.5 py-1 rounded-full border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span>Napas 247 Live</span>
              </span>
            </div>

            {/* Đồng hồ đếm ngược 5 phút (TTL 300s) */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-ink-3">⏱️ Hiệu lực mã QR:</span>
              <span
                className={`font-mono font-bold text-sm px-3 py-0.5 rounded-full border transition-all ${
                  ttlSeconds < 60
                    ? 'text-danger bg-danger-soft border-danger/30 animate-pulse'
                    : 'text-warning bg-warning-soft border-warning/30'
                }`}
              >
                {formatTimer(ttlSeconds)}
              </span>
            </div>

            {/* Khung QR Code kèm Overlay khi hết hạn 5 phút */}
            <div className="relative inline-block mx-auto">
              <div className="bg-white p-3.5 rounded-2xl border-2 border-blue-600 shadow-md inline-block">
                <Image
                  src={qrImageUrl}
                  alt="Mã VietQR BrewLite MBBank"
                  width={210}
                  height={210}
                  unoptimized
                  className="object-contain block mx-auto rounded"
                />
                <div className="mt-2.5 text-[11px] text-slate-800 font-bold leading-relaxed border-t border-slate-100 pt-2">
                  <div>Ngân hàng: <b>MBBank (MB)</b></div>
                  <div>Số TK: <b className="text-blue-700 text-xs font-mono">0589822346</b></div>
                  <div>Chủ TK: <b>BREWLITE COFFEE</b></div>
                </div>
              </div>

              {/* Overlay hiển thị khi mã QR hết hạn 5 phút */}
              {isQrExpired && (
                <div className="absolute inset-0 bg-slate-950/95 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center border-2 border-danger z-20 animate-fade-in">
                  <div className="text-3xl mb-1">⛔</div>
                  <div className="text-xs font-bold text-danger mb-1">
                    MÃ QR ĐÃ HẾT HẠN (5 PHÚT)
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight mb-3">
                    Mã VietQR đã hết 300 giây. Vui lòng bấm tạo lại mã mới để cập nhật thông tin chính xác.
                  </p>
                  <button
                    type="button"
                    onClick={refreshCurrentQr}
                    className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tạo Lại Mã Mới (+5 Phút)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nút Làm Mới Mã QR */}
            <div>
              <button
                type="button"
                onClick={refreshCurrentQr}
                className="text-xs text-ink-3 hover:text-ink inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:border-line-strong transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm Mới Mã QR (+5 Phút)</span>
              </button>
            </div>

            {/* Trạng thái thanh toán */}
            <div className="pt-1">
              {paymentStatus === 'SUCCESS' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success-soft border border-success/30 px-3.5 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✅ ĐÃ THANH TOÁN THÀNH CÔNG</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning bg-warning-soft border border-warning/30 px-3.5 py-2 rounded-xl">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>⏳ Đang chờ bạn quét QR & chuyển khoản...</span>
                </span>
              )}
            </div>

            {/* Hướng dẫn ngắn về nội dung chuyển tiền */}
            <div className="text-left bg-surface-2/60 border border-line rounded-xl p-3 space-y-1.5 text-[11px] text-ink-2">
              <div className="flex items-center gap-1 text-ink font-semibold">
                <Info className="w-3.5 h-3.5 text-accent" />
                <span>Lưu ý quan trọng:</span>
              </div>
              <p className="leading-relaxed">
                Khi quét mã bằng điện thoại, ứng dụng ngân hàng sẽ tự động điền nội dung{' '}
                <code className="bg-surface font-mono font-bold text-accent px-1 rounded">
                  BREWLITE {orderCodeDisplay}
                </code>
                . Quý khách vui lòng <b>giữ nguyên nội dung này</b> để hệ thống nhận diện đơn hàng ngay tức thì.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT HÓA ĐƠN & HƯỚNG DẪN QUÉT ĐIỆN THOẠI */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Chi Tiết Hóa Đơn */}
            <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-sm space-y-3.5">
              <h3 className="font-display font-semibold text-sm text-ink flex items-center justify-between">
                <span>📋 Chi Tiết Hóa Đơn BrewLite</span>
                <span className="text-xs font-mono font-bold text-accent bg-accent-soft px-2 py-0.5 rounded">
                  {orderCodeDisplay}
                </span>
              </h3>

              <div className="bg-surface-2/60 border border-line rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-ink-2">
                  <span>Khách Hàng Thụ Hưởng:</span>
                  <span className="font-semibold text-ink">
                    {user.fullName || user.username} ({user.email || `${user.username}@brewlite.vn`})
                  </span>
                </div>

                <div className="flex items-center justify-between text-ink-2">
                  <span>Món Đã Chọn:</span>
                  <span className="font-semibold text-ink text-right">
                    {items.length} món ({items.map((i) => `${i.productName} (${i.size})`).join(', ')})
                  </span>
                </div>

                <div className="flex items-center justify-between text-ink-2 pt-2 border-t border-line">
                  <span className="font-semibold">Tổng Tiền Cần Thanh Toán:</span>
                  <span className="font-bold text-base text-accent">
                    {finalTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dashed border-line">
                  <span className="text-ink-2">Nội Dung Chuyển Khoản Chuẩn:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono font-bold text-danger bg-danger-soft px-2 py-0.5 rounded text-xs">
                      BREWLITE {orderCodeDisplay}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`BREWLITE ${orderCodeDisplay}`, 'memo')}
                      className="p-1 hover:bg-surface rounded text-ink-3 hover:text-ink transition-colors"
                      title="Sao chép nội dung"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {copiedText && (
                  <div className="text-[11px] text-success font-medium text-right animate-fade-in">
                    ✓ Đã sao chép nội dung vào bộ nhớ tạm!
                  </div>
                )}
              </div>
            </div>

            {/* 2. HƯỚNG DẪN QUÉT BẰNG ĐIỆN THOẠI & XÁC NHẬN */}
            <div className="bg-surface border border-line-strong rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                <Smartphone className="w-4 h-4 text-accent" />
                <span>📱 Hướng Dẫn Thanh Toán Bằng Điện Thoại</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-surface-2/60 border border-line rounded-xl space-y-1">
                  <div className="font-bold text-accent">Bước 1</div>
                  <p className="text-ink-2 text-[11.5px] leading-relaxed">
                    Mở ứng dụng <b>Ngân hàng</b> (MBBank, VCB, TCB,...) hoặc <b>Ví điện tử</b> trên điện thoại.
                  </p>
                </div>

                <div className="p-3 bg-surface-2/60 border border-line rounded-xl space-y-1">
                  <div className="font-bold text-accent">Bước 2</div>
                  <p className="text-ink-2 text-[11.5px] leading-relaxed">
                    Chọn tính năng <b>Quét mã QR</b> và hướng camera vào mã VietQR bên cạnh.
                  </p>
                </div>

                <div className="p-3 bg-surface-2/60 border border-line rounded-xl space-y-1">
                  <div className="font-bold text-accent">Bước 3</div>
                  <p className="text-ink-2 text-[11.5px] leading-relaxed">
                    Kiểm tra đúng số tiền và nội dung, rồi xác nhận chuyển khoản trên điện thoại.
                  </p>
                </div>
              </div>

              {/* Nút bấm xác nhận khi khách đã chuyển khoản trên điện thoại */}
              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  onClick={() => handlePay()}
                  disabled={loading || isQrExpired}
                  className="w-full py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Kiểm Tra & Xác Nhận Giao Dịch...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Tôi Đã Chuyển Khoản Xong - Kiểm Tra Giao Dịch</span>
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-ink-3 text-center">
                  Hệ thống sẽ đối soát giao dịch và tự động chuyển bạn đến trang theo dõi tiến độ đơn hàng.
                </p>
              </div>
            </div>

            {/* THÔNG BÁO THÀNH CÔNG (TING TING) */}
            {paymentStatus === 'SUCCESS' && successNotice && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl text-emerald-900 dark:text-emerald-200 space-y-2 animate-fade-in shadow-md">
                <div className="flex items-center gap-2 font-display text-base font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>🎉 TING TING! Nhận Chuyển Khoản Thành Công</span>
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    Đã nhận <b>{successNotice.amount.toLocaleString('vi-VN')} đ</b> từ MBBank (STK: <b>{successNotice.senderStk}</b> - {successNotice.senderName}).
                  </div>
                  <div>
                    Khớp chính xác mã đơn hàng: <b className="font-mono">{successNotice.code}</b>. Đơn hàng đã được ghi nhận và tự động gửi tới quầy pha chế!
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Đang chuyển hướng bạn đến màn hình theo dõi đơn hàng...</span>
                </div>
              </div>
            )}

            {/* THÔNG BÁO LỖI (NẾU CÓ) */}
            {errorMsg && (
              <div className="p-3 bg-danger-soft border border-danger/30 rounded-xl text-xs text-danger flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PHƯƠNG THỨC 2: VÍ THÀNH VIÊN BREWLITE */
        <div className="max-w-xl mx-auto bg-surface border border-line-strong rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <div className="p-3 bg-accent-soft text-accent rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Ví Điện Tử Thành Viên BrewLite
              </h3>
              <p className="text-xs text-ink-3">
                Thanh toán trực tiếp từ số dư tài khoản đã liên kết
              </p>
            </div>
          </div>

          <div className="bg-surface-2 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-ink-2">
              <span>Chủ tài khoản:</span>
              <span className="font-semibold text-ink">{user.fullName || user.username}</span>
            </div>
            <div className="flex justify-between text-ink-2">
              <span>Tổng tiền thanh toán:</span>
              <span className="font-bold text-accent text-sm">
                {finalTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => handlePay()}
            disabled={loading}
            className="w-full py-3 text-xs font-semibold"
          >
            {loading ? 'Đang Xử Lý Giao Dịch...' : `Xác Nhận Thanh Toán (${finalTotal.toLocaleString('vi-VN')} đ)`}
          </Button>
        </div>
      )}
    </div>
  );
}
