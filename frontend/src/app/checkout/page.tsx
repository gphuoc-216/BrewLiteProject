'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi, getErrorMessage } from '../../lib/api';
import { Button, PageHeader } from '../../components/ui';
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Clock,
  CheckCircle2,
  QrCode,
  Smartphone,
  ShieldAlert,
  Sparkles,
  Info,
  Zap,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  Ticket,
  Coins,
  ShoppingBag,
} from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { OrderRecord } from '@/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryOrderId = searchParams.get('orderId');
  const isBuyNow = searchParams.get('buyNow') === '1';
  const { ready, user } = useRequireRole(['CUSTOMER', 'STAFF', 'ADMIN']);
  const { items, promotion, promotions, loyaltyPointsUsed, getSubtotal, getFinalTotal, clearCart } = useCartStore();
  const { fetchProfile, updateLoyaltyPoints } = useAuthStore();

  const [buyNowItems, setBuyNowItems] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('brewlite_buy_now_item');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (ready) {
      fetchProfile();
    }
  }, [ready, fetchProfile]);

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'WALLET'>('CARD');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [retryOrder, setRetryOrder] = useState<OrderRecord | null>(null);

  // Trạng thái thanh toán: 'WAITING' (đang chờ) hoặc 'SUCCESS' (thành công)
  // Nếu chuyển sai nội dung -> Hệ thống giữ nguyên trạng thái WAITING, đứng im như người dùng yêu cầu
  // --- QUẢN LÝ VÍ ĐIỆN TỬ LIÊN KẾT (MOMO / ZALOPAY / SHOPEEPAY) ---
  interface LinkedWallet {
    id: 'momo' | 'zalopay' | 'shopeepay';
    name: string;
    phone: string;
    balance: number;
    color: string;
  }

  const WALLET_PROVIDERS: { id: 'momo' | 'zalopay' | 'shopeepay'; name: string; defaultBalance: number; color: string }[] = [
    { id: 'momo', name: 'Ví MoMo', defaultBalance: 10000000, color: '#d82d8b' },
    { id: 'zalopay', name: 'Ví ZaloPay', defaultBalance: 10000000, color: '#0068ff' },
    { id: 'shopeepay', name: 'Ví ShopeePay', defaultBalance: 10000000, color: '#ee4d2d' },
  ];

  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<'momo' | 'zalopay' | 'shopeepay' | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<{ id: 'momo' | 'zalopay' | 'shopeepay'; name: string; defaultBalance: number; color: string } | null>(null);
  const [linkPhone, setLinkPhone] = useState('');
  const [linkOtp, setLinkOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  const userKey = (user as any)?.id || (user as any)?.accountId || (user as any)?.profileId || user?.username || 'customer';

  const [editingWallet, setEditingWallet] = useState<{ id: 'momo' | 'zalopay' | 'shopeepay'; name: string; balance: number } | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');

  const openEditBalanceModal = (walletId: 'momo' | 'zalopay' | 'shopeepay') => {
    const w = linkedWallets.find((item) => item.id === walletId);
    if (!w) return;
    setEditingWallet(w);
    setNewBalanceInput(w.balance.toString());
  };

  const handleSaveBalance = (customAmount?: number) => {
    if (!editingWallet) return;
    const rawVal = customAmount !== undefined
      ? customAmount
      : parseInt(String(newBalanceInput).replace(/\D/g, ''), 10);
    const amountToSet = isNaN(rawVal) ? 0 : Math.max(0, rawVal);
    const updated = linkedWallets.map((w) => (w.id === editingWallet.id ? { ...w, balance: amountToSet } : w));
    setLinkedWallets(updated);
    setSelectedWalletId(editingWallet.id);
    try {
      localStorage.setItem(`brewlite_wallets_${userKey}`, JSON.stringify(updated));
    } catch {}
    setEditingWallet(null);
    setErrorMsg(null);
  };

  // Mặc định tài khoản mới đăng ký là CHƯA liên kết ví nào
  useEffect(() => {
    if (!userKey) return;
    try {
      const saved = localStorage.getItem(`brewlite_wallets_${userKey}`);
      if (saved) {
        const parsed: LinkedWallet[] = JSON.parse(saved);
        setLinkedWallets(parsed);
        if (parsed.length > 0) {
          setSelectedWalletId(parsed[0].id);
        } else {
          setSelectedWalletId(null);
        }
      } else {
        setLinkedWallets([]);
        setSelectedWalletId(null);
      }
    } catch {
      setLinkedWallets([]);
      setSelectedWalletId(null);
    }
  }, [userKey]);

  const openLinkModal = (providerId: 'momo' | 'zalopay' | 'shopeepay') => {
    const prov = WALLET_PROVIDERS.find((p) => p.id === providerId);
    if (!prov) return;
    setLinkingProvider(prov);
    setLinkPhone(((user as any)?.phone as string) || '0988888888');
    setLinkOtp('888999'); // Tự động điền sẵn mã OTP demo để người dùng bấm là được ngay
    setOtpSent(true);
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    setLinkOtp('888999');
  };

  const handleConfirmLink = () => {
    if (!linkingProvider) return;
    setLinkingLoading(true);
    setTimeout(() => {
      let currentWallets = linkedWallets;
      try {
        const saved = localStorage.getItem(`brewlite_wallets_${userKey}`);
        if (saved) currentWallets = JSON.parse(saved);
      } catch {}

      const existing = currentWallets.find((w) => w.id === linkingProvider.id);
      const initialBalance = existing && typeof existing.balance === 'number' ? existing.balance : linkingProvider.defaultBalance;

      const newWallet: LinkedWallet = {
        id: linkingProvider.id,
        name: linkingProvider.name,
        phone: linkPhone || ((user as any)?.phone as string) || '0988888888',
        balance: initialBalance,
        color: linkingProvider.color,
      };
      const updated = [...currentWallets.filter((w) => w.id !== linkingProvider.id), newWallet];
      setLinkedWallets(updated);
      setSelectedWalletId(newWallet.id);
      localStorage.setItem(`brewlite_wallets_${userKey}`, JSON.stringify(updated));
      setLinkingLoading(false);
      setLinkingProvider(null);
      setOtpSent(false);
      setLinkOtp('');
      setWalletNotice(`🎉 Đã liên kết ${newWallet.name} thành công! Số dư khả dụng: ${newWallet.balance.toLocaleString('vi-VN')} đ`);
      setTimeout(() => setWalletNotice(null), 4000);
    }, 300);
  };

  const handleUnlinkWallet = (walletId: 'momo' | 'zalopay' | 'shopeepay') => {
    const updated = linkedWallets.filter((w) => w.id !== walletId);
    setLinkedWallets(updated);
    if (selectedWalletId === walletId) {
      setSelectedWalletId(updated.length > 0 ? updated[0].id : null);
    }
    localStorage.setItem(`brewlite_wallets_${userKey}`, JSON.stringify(updated));
  };

  const selectedWallet = linkedWallets.find((w) => w.id === selectedWalletId);

  const [paymentStatus, setPaymentStatus] = useState<'WAITING' | 'SUCCESS'>('WAITING');
  const [successNotice, setSuccessNotice] = useState<{
    amount: number;
    senderStk: string;
    senderName: string;
    code: string;
  } | null>(null);
  const isPayingRef = useRef(false);

  // Đồng hồ đếm ngược 5 phút (TTL 300 giây)
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [isQrExpired, setIsQrExpired] = useState(false);

  // Lưu trữ orderId và idempotencyKey để tránh tạo trùng đơn khi bấm nhiều lần
  const existingOrderRef = useRef<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeItems = isBuyNow && buyNowItems.length > 0 ? buyNowItems : items;
  const cartSubtotal = isBuyNow && buyNowItems.length > 0
    ? buyNowItems.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1), 0)
    : getSubtotal();
  const retryDiscount = Number(retryOrder?.discountAmount || 0);
  const subtotal = retryOrder
    ? Number(retryOrder.totalAfterDiscount || 0) + retryDiscount
    : cartSubtotal;

  const buyNowItem = isBuyNow && buyNowItems.length > 0 ? buyNowItems[0] : null;
  const voucherDiscount = retryOrder
    ? retryDiscount
    : (isBuyNow
        ? Number(buyNowItem?.voucherDiscount || 0)
        : (promotions && promotions.length > 0
            ? promotions.reduce((sum, p) => sum + (p.discountAmount || 0), 0)
            : (promotion ? promotion.discountAmount : 0)));
  const pointsDiscount = retryOrder
    ? 0
    : (isBuyNow
        ? Number(buyNowItem?.pointsDiscount || 0)
        : (loyaltyPointsUsed || 0) * 100);
  const buyNowLoyaltyPoints = isBuyNow ? Number(buyNowItem?.loyaltyPointsUsed || 0) : 0;
  const discountAmount = retryOrder ? retryDiscount : (voucherDiscount + pointsDiscount);
  const finalTotal = retryOrder
    ? Number(retryOrder.totalAfterDiscount || 0)
    : Math.max(0, subtotal - discountAmount);
  const hasPayableOrder = activeItems.length > 0 || !!retryOrder || paymentStatus === 'SUCCESS';
  const [orderCodeDisplay, setOrderCodeDisplay] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved =
        sessionStorage.getItem('brewlite_active_order_code') ||
        localStorage.getItem('brewlite_pending_order');
      if (saved && saved.startsWith('BL')) return saved;
      const initialCode = 'BL' + Math.floor(100000 + Math.random() * 900000);
      sessionStorage.setItem('brewlite_active_order_code', initialCode);
      localStorage.setItem('brewlite_pending_order', initialCode);
      return initialCode;
    }
    return 'BL810243';
  });

  // Giữ nguyên mã đơn hàng ổn định, tuyệt đối không tự ý sinh mã mới sau khi render
  useEffect(() => {
    if (orderCodeDisplay) {
      sessionStorage.setItem('brewlite_active_order_code', orderCodeDisplay);
      localStorage.setItem('brewlite_pending_order', orderCodeDisplay);
    }
  }, [orderCodeDisplay]);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Sinh chuỗi VietQR chuẩn quốc tế EMVCo (tương thích 100% app ngân hàng thật & MBBank Simulator)
  function generateVietQrEmvString({
    bankBin = '970436', // Vietcombank (VCB)
    accountNumber = '99998888',
    amount,
    orderCode,
    beneficiaryName = 'BREWLITE COFFEE',
  }: {
    bankBin?: string;
    accountNumber?: string;
    amount: number;
    orderCode: string;
    beneficiaryName?: string;
  }): string {
    function formatTlv(tag: string, value: string): string {
      const len = String(value.length).padStart(2, '0');
      return `${tag}${len}${value}`;
    }

    function crc16(str: string): string {
      let crc = 0xffff;
      for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = ((crc << 1) ^ 0x1021) & 0xffff;
          } else {
            crc = (crc << 1) & 0xffff;
          }
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    const sub38_00 = formatTlv('00', 'A000000727');
    const sub01_00 = formatTlv('00', bankBin);
    const sub01_01 = formatTlv('01', accountNumber);
    const sub38_01 = formatTlv('01', `${sub01_00}${sub01_01}`);
    const sub38_02 = formatTlv('02', 'QRIBFTTA');
    const tag38 = formatTlv('38', `${sub38_00}${sub38_01}${sub38_02}`);

    const memo = `BREWLITE ${orderCode}`;
    const sub62_08 = formatTlv('08', memo);
    const tag62 = formatTlv('62', sub62_08);

    const cleanAmount = Math.max(0, Math.round(amount));

    const rawWithoutCrc = [
      formatTlv('00', '01'),
      formatTlv('01', cleanAmount > 0 ? '12' : '11'),
      tag38,
      formatTlv('53', '704'),
      cleanAmount > 0 ? formatTlv('54', String(cleanAmount)) : '',
      formatTlv('58', 'VN'),
      formatTlv('59', beneficiaryName),
      formatTlv('60', 'HO CHI MINH'),
      tag62,
      '6304',
    ].join('');

    const checksum = crc16(rawWithoutCrc);
    return `${rawWithoutCrc}${checksum}`;
  }

  // Sinh mã QR thanh toán chuẩn ngân hàng VietQR EMVCo (chứa chính xác số tiền, STK, người thụ hưởng, nội dung)
  useEffect(() => {
    if (finalTotal <= 0) return;

    let isMounted = true;
    const emvPayload = generateVietQrEmvString({
      bankBin: '970436', // VCB
      accountNumber: '99998888',
      amount: finalTotal,
      orderCode: orderCodeDisplay,
      beneficiaryName: 'BREWLITE COFFEE',
    });

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, emvPayload, {
        width: 210,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).catch((err) => {
        console.error('Lỗi vẽ QR Canvas:', err);
      });
    }

    QRCode.toDataURL(emvPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Lỗi tạo mã QR:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [ready, orderCodeDisplay, finalTotal]);

  useEffect(() => {
    if (!ready || !retryOrderId) return;

    let cancelled = false;
    const loadRetryOrder = async () => {
      try {
        const data = await fetchApi<OrderRecord>(`/orders/${retryOrderId}`);
        if (cancelled) return;

        if (data.status !== 'PAYMENT_FAILED' && data.status !== 'PENDING') {
          setErrorMsg('Chỉ có thể thanh toán lại đơn đang chờ hoặc đã thanh toán lỗi.');
          return;
        }

        setRetryOrder(data);
        existingOrderRef.current = data.id;
      } catch (err: unknown) {
        if (!cancelled) setErrorMsg(getErrorMessage(err));
      }
    };

    loadRetryOrder();
    return () => {
      cancelled = true;
    };
  }, [ready, retryOrderId]);

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

  // Làm mới mã QR (gia hạn thêm 5 phút với mã mới)
  const refreshCurrentQr = () => {
    const newCode = 'BL' + Math.floor(100000 + Math.random() * 900000);
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
      if (isPayingRef.current) return false;
      if (!user) {
        setErrorMsg('Vui lòng đăng nhập tài khoản trước khi thực hiện thanh toán!');
        router.push('/login?redirect=/checkout');
        return false;
      }

      if (!hasPayableOrder) {
        router.push('/');
        return false;
      }

      if (isQrExpired) {
        setErrorMsg('Mã QR đã hết hạn. Vui lòng bấm "Tạo Lại Mã Mới (+5 Phút)" trước khi xác nhận.');
        return false;
      }

      // Kiểm tra nghiêm ngặt số dư ví nếu chọn phương thức WALLET
      if (paymentMethod === 'WALLET') {
        const currentWallet = linkedWallets.find((w) => w.id === selectedWalletId);
        if (!currentWallet) {
          setErrorMsg('Vui lòng chọn hoặc liên kết ví điện tử để thanh toán.');
          return false;
        }
        const currentBalance = Number(currentWallet.balance || 0);
        if (currentBalance < finalTotal) {
          setErrorMsg(
            `Thanh toán thất bại: Số dư ${currentWallet.name} hiện tại (${currentBalance.toLocaleString('vi-VN')} đ) không đủ để thanh toán đơn hàng (${finalTotal.toLocaleString('vi-VN')} đ). Vui lòng nạp thêm tiền hoặc sửa số dư!`
          );
          return false;
        }
      }

      try {
        isPayingRef.current = true;
        setLoading(true);
        setErrorMsg(null);

        let orderId = existingOrderRef.current;

        // 1. Tạo đơn hàng mới nếu chưa có orderId
        if (!orderId) {
          if (activeItems.length === 0) {
            return false;
          }
          const orderPayload = {
            items: activeItems.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              toppings: i.topping && i.topping !== 'Tiêu chuẩn' ? i.topping.split(',').map((t: string) => t.trim()) : undefined,
            })),
            promotionCode: isBuyNow
              ? (buyNowItem?.appliedVouchers?.length > 0 ? buyNowItem.appliedVouchers.join(',') : undefined)
              : (promotions && promotions.length > 0)
              ? promotions.map((p) => p.code).join(',')
              : (promotion ? promotion.code : undefined),
            loyaltyPointsToUse: isBuyNow
              ? (buyNowLoyaltyPoints > 0 ? buyNowLoyaltyPoints : undefined)
              : (loyaltyPointsUsed > 0 ? loyaltyPointsUsed : undefined),
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
        const paymentPayload: any = {
          orderId,
          method: paymentMethod,
        };

        await fetchApi('/payments', {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKeyRef.current,
          },
          body: JSON.stringify(paymentPayload),
        });

        // Nếu thanh toán qua Ví điện tử, trừ số dư trên ví của tài khoản này
        if (paymentMethod === 'WALLET' && selectedWalletId) {
          try {
            const saved = localStorage.getItem(`brewlite_wallets_${userKey}`);
            const currentWallets = saved ? JSON.parse(saved) : linkedWallets;
            const updatedWallets = currentWallets.map((w: LinkedWallet) => {
              if (w.id === selectedWalletId) {
                const newBal = Math.max(0, Number(w.balance || 0) - finalTotal);
                return { ...w, balance: newBal };
              }
              return w;
            });
            setLinkedWallets(updatedWallets);
            localStorage.setItem(`brewlite_wallets_${userKey}`, JSON.stringify(updatedWallets));
          } catch (e) {
            console.error('Lỗi trừ tiền ví:', e);
          }
        }

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

        // Dọn dẹp giỏ hàng & Hủy bỏ mã QR hoàn toàn
        existingOrderRef.current = null;
        idempotencyKeyRef.current = null;
        localStorage.removeItem('brewlite_pending_order');
        sessionStorage.removeItem('brewlite_active_order_code');
        sessionStorage.setItem('brewlite_completed_order_' + orderCodeDisplay, 'true');

        // Báo cho backend hủy mã này trong bộ nhớ để không thể quét lại
        try {
          fetchApi(`/payments/mbbank-invalidate/${orderCodeDisplay}`, { method: 'POST' }).catch(() => {});
        } catch {
          // Bỏ qua lỗi kết nối
        }

        if (isBuyNow) {
          sessionStorage.removeItem('brewlite_buy_now_item');
        } else if (!retryOrder) {
          clearCart();
        }

        // Tích lũy điểm thưởng cho đơn hàng (5%)
        const earnedPoints = Math.floor((finalTotal * 0.05) / 1000);
        if (earnedPoints > 0) {
          updateLoyaltyPoints(earnedPoints);
        }
        fetchProfile();

        // Phát chuông Ting Ting xong, để người dùng nhìn rõ giao diện thành công rồi từ từ mới chuyển sang trang đơn hàng (2.6 giây)
        setTimeout(() => {
          router.replace(`/orders/${orderId}`);
        }, 2600);
        return true;
      } catch (err: unknown) {
        const errMsg = getErrorMessage(err);
        setErrorMsg(errMsg);
        setPaymentStatus('WAITING');
        return false;
      } finally {
        setLoading(false);
        isPayingRef.current = false;
      }
    },
    [
      user,
      activeItems,
      isBuyNow,
      hasPayableOrder,
      isQrExpired,
      promotion,
      promotions,
      loyaltyPointsUsed,
      paymentMethod,
      playTingTing,
      orderCodeDisplay,
      finalTotal,
      retryOrder,
      clearCart,
      router,
      updateLoyaltyPoints,
      fetchProfile,
      linkedWallets,
      selectedWalletId,
      userKey,
    ]
  );

  // Lắng nghe sự kiện chuyển khoản: kết hợp localStorage (cùng tab) & Backend API Polling (qua điện thoại thật trong LAN)
  useEffect(() => {
    let lastHandledTime = 0;

    const processIncomingPayment = (data: any) => {
      if (!data) return;
      if (isPayingRef.current || paymentStatus === 'SUCCESS') return;

      const paidAmt = Number(data?.amount || 0);
      const content = String(data?.content || '').toUpperCase().trim().replace(/\s+/g, ' ');
      const targetCode = orderCodeDisplay.toUpperCase().trim();
      const expectedMemo = `BREWLITE ${targetCode}`;

      // 1. Kiểm tra nếu mã QR đã hết hạn (quá 5 phút)
      if (isQrExpired || ttlSeconds <= 0) {
        return;
      }

      // 2. Kiểm tra nội dung chuyển khoản: Phải CHÍNH XÁC là "BREWLITE <mã_đơn>"
      // Bất kỳ sai khác nào (như BREWLITxxE, thiếu BREWLITE, sai chính tả...) đều là SAI NỘI DUNG
      const isContentMatched = Boolean(targetCode && content === expectedMemo);

      // 3. Kiểm tra số tiền: Phải ĐÚNG CHÍNH XÁC số tiền đơn hàng (không được thiếu, không được thừa)
      const isAmountMatched = Math.round(paidAmt) === Math.round(finalTotal);

      // Nếu SAI NỘI DUNG hoặc SAI SỐ TIỀN: Tuyệt đối im lặng, không xử lý gì hết (chuẩn thực tế VietQR/Napas)
      if (!isContentMatched || !isAmountMatched) {
        return;
      }

      // 4. Đúng cả nội dung và đúng chính xác số tiền -> Thanh toán thành công!
      handlePay({
        senderStk: data.sender || '0589822346',
        senderName:
          data.senderName ||
          data.sender_name ||
          user?.fullName ||
          user?.username ||
          'NGUYEN HOANG ANH',
      });
      return;
    };

    const checkMbPayment = async () => {
      if (paymentStatus === 'SUCCESS') return;

      // 1. Kiểm tra localStorage (trường hợp mở MBBank cùng trình duyệt máy tính)
      const raw =
        localStorage.getItem('brewlite_mb_payment') || localStorage.getItem('last_mb_payment');
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (
            data &&
            data.time &&
            data.time > lastHandledTime &&
            Date.now() - data.time < 120000
          ) {
            lastHandledTime = data.time;
            processIncomingPayment(data);
          }
        } catch {
          // Bỏ qua lỗi parse
        }
      }

      // 2. Poll Backend API (nhận biến động từ ứng dụng MBBank trên điện thoại quét qua camera)
      if (orderCodeDisplay && !isPollingRef.current) {
        isPollingRef.current = true;
        try {
          const res = await fetchApi<{ paid: boolean; payment?: any; data?: any }>(
            `/payments/mbbank-check/${orderCodeDisplay}`
          );
          const payData = res?.payment || (res as any)?.data;
          if (res && res.paid && payData) {
            processIncomingPayment(payData);
          }
        } catch {
          // Bỏ qua lỗi polling khi đang chờ
        } finally {
          isPollingRef.current = false;
        }
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('brewlite_payment_channel');
        bc.onmessage = (event) => {
          if (event && event.data) {
            processIncomingPayment(event.data);
          }
        };
      }
    } catch {}

    window.addEventListener('storage', checkMbPayment);
    const interval = setInterval(checkMbPayment, 600);

    return () => {
      window.removeEventListener('storage', checkMbPayment);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [orderCodeDisplay, handlePay, user, paymentStatus, finalTotal, isQrExpired, ttlSeconds]);

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

  if (!ready) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-accent">
          <Clock className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-semibold text-base text-ink">Đang tải thông tin thanh toán...</h3>
          <p className="text-xs text-ink-3">BrewLite đang đồng bộ phiên đăng nhập an toàn.</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
            BrewLite áp dụng cơ chế thanh toán định danh để sinh mã QR cá nhân hóa và tích lũy điểm thưởng thành viên. Vui lòng đăng nhập tài khoản khách hàng để tiếp tục thanh toán.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={isBuyNow ? "/login?redirect=/checkout?buyNow=1" : "/login?redirect=/checkout"}
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

  if (retryOrderId && !retryOrder && !errorMsg) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-accent">
          <Clock className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-semibold text-base text-ink">Đang tải đơn thanh toán lại...</h3>
          <p className="text-xs text-ink-3">BrewLite đang lấy thông tin đơn hàng cần thử lại.</p>
        </div>
      </div>
    );
  }

  if (!hasPayableOrder) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-accent">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display font-semibold text-lg text-ink">Giỏ hàng của bạn đang trống</h3>
          <p className="text-xs text-ink-3">Hãy chọn một vài món thức uống ngon miệng từ thực đơn trước khi thanh toán nhé.</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/')} className="mx-auto">
          Xem thực đơn BrewLite
        </Button>
      </div>
    );
  }

  const selectedItemsText = retryOrder
    ? `${retryOrder.items?.length || 0} món (${retryOrder.items?.map((i) => `${i.quantity}x ${i.variant?.product?.name || 'Món'}`).join(', ') || 'Đơn cũ'})`
    : `${activeItems.length} món (${activeItems.map((i) => `${i.productName} (${i.size})`).join(', ')})`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href={isBuyNow ? "/" : "/cart"}
        className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>{isBuyNow ? "Quay lại thực đơn" : "Quay lại giỏ hàng"}</span>
      </Link>

      <PageHeader
        title="Thanh toán không dùng tiền mặt"
        description="Chọn Ví điện tử hoặc Thẻ ngân hàng, sau đó xác nhận trả để hoàn tất đơn hàng."
      />

      {/* THÔNG BÁO TING TING & GIAO DIỆN CHÚC MỪNG THÀNH CÔNG */}
      {paymentStatus === 'SUCCESS' && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-3xl p-6 sm:p-10 text-center space-y-4 animate-fade-in shadow-xl max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-700 dark:text-emerald-300">
              🎉 TING TING! THANH TOÁN THÀNH CÔNG
            </h2>
            <p className="text-lg font-bold text-ink font-mono">
              Đã nhận {finalTotal.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-xs text-ink-2 max-w-md mx-auto">
              Đơn hàng <b className="font-mono">#{orderCodeDisplay}</b> đã được gạch nợ thành công và tự động chuyển xuống quầy pha chế!
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang chuyển hướng sang trang theo dõi đơn hàng sau giây lát...</span>
          </div>
        </div>
      )}

      {/* KHI ĐƠN HÀNG CÓ TỔNG TIỀN BẰNG 0Đ (THANH TOÁN 100% BẰNG VOUCHER / ĐIỂM THƯỞNG) */}
      {finalTotal === 0 ? (
        <div className="bg-surface border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-5 animate-fade-in max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
            🎁
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="font-display font-bold text-lg sm:text-xl text-ink">
              Đơn hàng được thanh toán 100% (0 đ)
            </h3>
            <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
              Tổng giá trị đơn hàng <span className="line-through">{subtotal.toLocaleString('vi-VN')} đ</span> đã được khấu trừ hoàn toàn bằng {loyaltyPointsUsed > 0 ? `Điểm tích lũy (${loyaltyPointsUsed} điểm)` : 'Mã ưu đãi'}.
              <br />
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Không cần quét mã QR hay chuyển khoản ngân hàng. Bấm xác nhận để quán bắt đầu pha chế ngay!
              </strong>
            </p>
          </div>

          {/* Chi tiết khấu trừ hóa đơn 0đ */}
          <div className="max-w-md mx-auto p-4 bg-surface-2 rounded-xl border border-line text-xs space-y-2 text-left">
            <div className="flex justify-between text-ink-2">
              <span>Món đã chọn:</span>
              <span className="font-medium text-ink truncate max-w-[200px]">{selectedItemsText}</span>
            </div>
            <div className="flex justify-between text-ink-2">
              <span>Tạm tính gốc:</span>
              <span className="font-mono">{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Voucher giảm giá:</span>
                <span className="font-mono">-{voucherDiscount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                <span>Điểm tích lũy đã dùng ({isBuyNow ? buyNowLoyaltyPoints : loyaltyPointsUsed} điểm):</span>
                <span className="font-mono">-{pointsDiscount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-ink text-sm pt-2 border-t border-line">
              <span>Tổng tiền cần thanh toán:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-extrabold">0 đ</span>
            </div>
          </div>

          {errorMsg && (
            <div className="max-w-md mx-auto p-3 bg-danger-soft border border-danger/30 rounded-lg text-xs text-danger flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nút Xác Nhận Đặt Đơn Ngay 0đ */}
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={loading}
              onClick={() => handlePay()}
              className="w-full max-w-sm mx-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Xác Nhận Đặt Đơn Ngay (0 đ)</span>
                </>
              )}
            </Button>
            <p className="text-[11px] text-ink-3 mt-2">
              Bấm xác nhận để hệ thống ghi nhận đơn và gửi xuống quầy pha chế ngay lập tức!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs Chuyển Phương Thức Thanh Toán */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink">Không dùng tiền mặt</p>
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
                <span>Thẻ ngân hàng</span>
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
                <span>Ví điện tử</span>
              </button>
            </div>
          </div>

      {paymentMethod === 'CARD' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: MÃ QR THANH TOÁN VỚI THỜI GIAN 5 PHÚT */}
          <div className="lg:col-span-5 bg-surface border border-line-strong rounded-2xl p-5 shadow-sm text-center space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="text-left">
                <h3 className="font-display font-semibold text-sm text-ink flex items-center gap-1.5">
                  <span>🏦 Mã QR Thanh Toán</span>
                </h3>
                <span className="text-[11px] text-ink-3">Chấp nhận chuyển từ mọi ngân hàng</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success-soft px-2.5 py-1 rounded-full border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span>Đang hoạt động</span>
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
                <div className="flex items-center justify-center min-w-[210px] min-h-[210px] bg-white rounded overflow-hidden relative">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Mã QR Thanh Toán BrewLite"
                      width={210}
                      height={210}
                      className="block mx-auto rounded"
                    />
                  ) : null}
                  <canvas
                    ref={canvasRef}
                    width={210}
                    height={210}
                    className={qrDataUrl ? 'hidden' : 'block mx-auto rounded'}
                  />
                </div>
                <div className="mt-2.5 text-[11px] text-slate-800 font-bold leading-relaxed border-t border-slate-100 pt-2 text-left space-y-0.5">
                  <div className="flex justify-between"><span>Đơn vị nhận:</span> <b>BrewLite Coffee</b></div>
                  <div className="flex justify-between"><span>Ngân hàng:</span> <b>Vietcombank (STK: 99998888)</b></div>
                  <div className="flex justify-between"><span>Mã đơn hàng:</span> <b className="text-blue-700 font-mono">{orderCodeDisplay}</b></div>
                  <div className="flex justify-between"><span>Số tiền:</span> <b className="text-emerald-700 font-mono">{finalTotal.toLocaleString('vi-VN')} đ</b></div>
                  <div className="flex justify-between"><span>Chủ TK nhận:</span> <b>BREWLITE COFFEE</b></div>
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
                    Mã QR đã hết hạn. Vui lòng bấm tạo lại mã mới để tiếp tục thanh toán.
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
                    {selectedItemsText}
                  </span>
                </div>

                <div className="flex items-center justify-between text-ink-2 pt-2 border-t border-line">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-ink">
                    {subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {voucherDiscount > 0 && (
                  <div className="flex items-center justify-between text-success">
                    <span>
                      Voucher giảm giá
                      {isBuyNow
                        ? (buyNowItem?.appliedVouchers?.length > 0 ? ` (${buyNowItem.appliedVouchers.join(', ')})` : '')
                        : (promotions && promotions.length > 0
                            ? ` (${promotions.map((p) => p.code).join(', ')})`
                            : promotion?.code
                            ? ` (${promotion.code})`
                            : '')}
                      :
                    </span>
                    <span className="font-semibold">
                      -{voucherDiscount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Điểm tích lũy đã dùng ({isBuyNow ? buyNowLoyaltyPoints : loyaltyPointsUsed} điểm):</span>
                    </span>
                    <span className="font-semibold font-mono">
                      -{pointsDiscount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}


                <div className="flex items-center justify-between text-ink pt-2 border-t border-line">
                  <span className="font-bold">Tổng Tiền Cần Thanh Toán:</span>
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
                    Mở ứng dụng <b>Ngân hàng bất kỳ</b> (VCB, MB, Techcombank, BIDV, ACB,...) hoặc <b>Ví điện tử</b> (MoMo, ZaloPay).
                  </p>
                </div>

                <div className="p-3 bg-surface-2/60 border border-line rounded-xl space-y-1">
                  <div className="font-bold text-accent">Bước 2</div>
                  <p className="text-ink-2 text-[11.5px] leading-relaxed">
                    Chọn tính năng <b>Quét mã QR</b> và hướng camera vào mã QR bên cạnh.
                  </p>
                </div>

                <div className="p-3 bg-surface-2/60 border border-line rounded-xl space-y-1">
                  <div className="font-bold text-accent">Bước 3</div>
                  <p className="text-ink-2 text-[11.5px] leading-relaxed">
                    Kiểm tra đúng số tiền và nội dung, rồi xác nhận chuyển khoản trên điện thoại.
                  </p>
                </div>
              </div>

              {/* Trạng thái Tự Động Đối Soát Giao Dịch Thời Gian Thực */}
              <div className="pt-2 space-y-3">
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] dark:bg-emerald-950/30 text-ink flex items-start gap-3.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 fill-emerald-500/20" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-display font-semibold text-ink flex items-center gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300">Tự động hoàn tất ngay khi chuyển tiền thành công</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Xác nhận tức thì
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-2 leading-relaxed">
                      Hỗ trợ chuyển khoản từ <b>hơn 40 ngân hàng và ví điện tử</b>. Hệ thống tự động kiểm tra số tiền và gạch nợ đơn hàng ngay lập tức mà không cần chụp lại biên lai!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`/mbbank/index.html?amount=${finalTotal}&orderCode=${orderCodeDisplay}&memo=BREWLITE%20${orderCodeDisplay}&name=BREWLITE%20COFFEE&account=99998888&bank=MBB`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📱 Mở App MBBank Simulator</span>
                  </a>
                  <a
                    href="/mbbank/admin.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-2 text-ink border border-line hover:border-line-strong rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>⚙️ Admin MBBank (Chỉnh số dư & Test)</span>
                  </a>
                </div>



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
                    Đã nhận <b>{successNotice.amount.toLocaleString('vi-VN')} đ</b> qua thanh toán điện tử (STK gửi: <b>{successNotice.senderStk}</b> - {successNotice.senderName}).
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
        /* PHƯƠNG THỨC 2: VÍ ĐIỆN TỬ LIÊN KẾT 1-CHẠM (MOMO / ZALOPAY / SHOPEEPAY) */
        <div className="max-w-xl mx-auto bg-surface border border-line-strong rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          {/* Tiêu đề & Giới thiệu */}
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <div className="p-3 bg-accent-soft text-accent rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                <span>Ví Điện Tử 1-Chạm</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Tự động trừ ví
                </span>
              </h3>
              <p className="text-xs text-ink-3">
                Liên kết ví điện tử thanh toán an toàn, không cần mở máy ảnh quét QR
              </p>
            </div>
          </div>

          {/* Toast thông báo liên kết thành công */}
          {walletNotice && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{walletNotice}</span>
            </div>
          )}

          {/* Danh sách 3 Ví điện tử hỗ trợ */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">Danh sách ví của bạn:</span>
              <span className="text-ink-3 text-[11px]">Chọn ví để thanh toán</span>
            </div>

            <div className="space-y-2.5">
              {WALLET_PROVIDERS.map((prov) => {
                const linked = linkedWallets.find((w) => w.id === prov.id);
                const isSelected = selectedWalletId === prov.id;

                return (
                  <div
                    key={prov.id}
                    onClick={() => {
                      if (linked) setSelectedWalletId(prov.id);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                      linked
                        ? isSelected
                          ? 'border-accent bg-accent-soft/30 shadow-sm cursor-pointer'
                          : 'border-line hover:border-line-strong bg-surface cursor-pointer'
                        : 'border-line/70 bg-surface-2/40'
                    }`}
                  >
                    {/* Cột trái: Logo & Thông tin */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Logo Icon đại diện thương hiệu ví */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: prov.color }}
                      >
                        {prov.id === 'momo' ? 'MoMo' : prov.id === 'zalopay' ? 'Zalo' : 'Shopee'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-sm text-ink truncate">
                            {prov.name}
                          </h4>
                          {linked ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã liên kết</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded border border-line">
                              Chưa liên kết
                            </span>
                          )}
                        </div>

                        {linked ? (
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            <span className="text-ink-3 text-[11px] font-mono">
                              {linked.phone.replace(/(\d{4})\d{3}(\d{3})/, '$1•••$2')}
                            </span>
                            <span className="text-ink-3">•</span>
                            <span className="font-bold text-accent text-xs">
                              Số dư: {linked.balance.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-ink-3 mt-0.5">
                            Chưa liên kết. Bấm để liên kết ví thanh toán 1-chạm.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cột phải: Nút thao tác */}
                    <div className="shrink-0 flex items-center gap-2">
                      {linked ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Chỉnh số dư ví (Demo/Debug)"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditBalanceModal(prov.id);
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg transition-colors text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Sửa số dư</span>
                          </button>
                          <button
                            type="button"
                            title="Hủy liên kết ví này"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkWallet(prov.id);
                            }}
                            className="p-1.5 text-ink-3 hover:text-danger hover:bg-danger-soft rounded-lg transition-colors text-[11px]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <input
                            type="radio"
                            name="selected_wallet"
                            checked={isSelected}
                            onChange={() => setSelectedWalletId(prov.id)}
                            className="w-4 h-4 text-accent accent-accent cursor-pointer"
                          />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openLinkModal(prov.id)}
                          className="text-[11px] h-8 px-3 font-semibold hover:border-accent hover:text-accent"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          <span>Liên kết ví</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chi tiết thanh toán & Trừ số dư */}
          <div className="bg-surface-2 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-ink-2">
              <span>Chủ tài khoản:</span>
              <span className="font-semibold text-ink">{user.fullName || user.username}</span>
            </div>
            <div className="flex justify-between text-ink-2">
              <span>Nguồn tiền thanh toán:</span>
              <span className="font-semibold text-ink">
                {selectedWallet ? (
                  <span className="text-accent font-bold">{selectedWallet.name} (Số dư: {selectedWallet.balance.toLocaleString('vi-VN')} đ)</span>
                ) : (
                  <span className="text-ink-3 italic">Chưa chọn ví</span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-ink-2">
              <span>Tạm tính:</span>
              <span className="font-semibold text-ink">
                {subtotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>
                  Voucher giảm giá
                  {promotions && promotions.length > 0
                    ? ` (${promotions.map((p) => p.code).join(', ')})`
                    : promotion?.code
                    ? ` (${promotion.code})`
                    : ''}
                  :
                </span>
                <span className="font-semibold">
                  -{voucherDiscount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Điểm tích lũy đã dùng ({isBuyNow ? buyNowLoyaltyPoints : loyaltyPointsUsed} điểm):</span>
                </span>
                <span className="font-semibold font-mono">
                  -{pointsDiscount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}
            <div className="flex justify-between text-ink-2 border-t border-line pt-2">
              <span className="font-semibold">Tổng tiền thanh toán:</span>
              <span className="font-bold text-accent text-sm">
                {finalTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>
            {selectedWallet && (
              <div className="flex justify-between text-[11px] text-ink-3 pt-1">
                <span>Số dư còn lại sau khi thanh toán:</span>
                <span className="font-mono font-semibold text-ink">
                  {Math.max(0, selectedWallet.balance - finalTotal).toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}
          </div>

          {/* Cảnh báo rõ ràng tình trạng số dư ví */}
          {selectedWallet && (
            selectedWallet.balance < finalTotal ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="leading-snug">
                    <b>Số dư không đủ:</b> {selectedWallet.name} hiện có{' '}
                    <b className="font-mono">{selectedWallet.balance.toLocaleString('vi-VN')} đ</b>, còn thiếu{' '}
                    <b className="font-mono text-rose-700 dark:text-rose-300 underline">
                      {(finalTotal - selectedWallet.balance).toLocaleString('vi-VN')} đ
                    </b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openEditBalanceModal(selectedWallet.id)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors shadow-sm"
                >
                  Sửa số dư
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    <b>Số dư khả dụng:</b> Đủ thanh toán! Sau khi trừ còn dư{' '}
                    <b className="font-mono">{(selectedWallet.balance - finalTotal).toLocaleString('vi-VN')} đ</b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openEditBalanceModal(selectedWallet.id)}
                  className="text-[11px] font-semibold underline text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                >
                  Sửa số dư
                </button>
              </div>
            )
          )}

          {/* Nút Thanh toán */}
          {selectedWallet ? (
            <Button
              type="button"
              onClick={() => handlePay()}
              disabled={loading || selectedWallet.balance < finalTotal}
              className={`w-full py-3.5 text-xs font-bold transition-all shadow-sm ${
                selectedWallet.balance < finalTotal
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {loading ? (
                'Đang Xử Lý Giao Dịch...'
              ) : selectedWallet.balance < finalTotal ? (
                `❌ Số dư ví không đủ (Thiếu ${(finalTotal - selectedWallet.balance).toLocaleString('vi-VN')} đ)`
              ) : (
                `Xác nhận trả ${finalTotal.toLocaleString('vi-VN')} đ bằng ${selectedWallet.name}`
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => openLinkModal('momo')}
              className="w-full py-3 text-xs font-semibold border-accent text-accent hover:bg-accent-soft"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Liên kết Ví MoMo để thanh toán ngay</span>
            </Button>
          )}
        </div>
      )}
    </>
  )}

      {/* MODAL MÔ PHỎNG LIÊN KẾT VÍ ĐIỆN TỬ */}
      {linkingProvider && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: linkingProvider.color }}
                >
                  {linkingProvider.id === 'momo' ? 'M' : linkingProvider.id === 'zalopay' ? 'Z' : 'S'}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-ink">
                    Liên Kết {linkingProvider.name}
                  </h3>
                  <p className="text-[11px] text-ink-3">Xác thực OTP 2 lớp bảo mật</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkingProvider(null)}
                className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1.5">Số điện thoại đăng ký ví:</label>
                <input
                  type="text"
                  value={linkPhone}
                  onChange={(e) => setLinkPhone(e.target.value)}
                  placeholder="0988 888 888"
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-ink">Mã xác thực OTP:</label>
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-accent hover:underline text-[11px] font-semibold"
                    >
                      Nhận mã OTP qua SMS
                    </button>
                  ) : (
                    <span className="text-success text-[11px] flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Đã gửi mã OTP qua SMS (Mã: 888999)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={linkOtp}
                  onChange={(e) => setLinkOtp(e.target.value)}
                  placeholder="Nhập 6 số OTP (VD: 888999)"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-ink font-mono tracking-widest text-sm text-center focus:outline-none focus:border-accent"
                />
              </div>

              {/* Hộp thông tin số dư demo */}
              <div className="p-3 bg-accent-soft/40 border border-accent/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-accent text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hạn mức số dư ví khả dụng:</span>
                </div>
                <p className="text-[11px] text-ink-2">
                  Số dư khả dụng trong ví: <b>{linkingProvider.defaultBalance.toLocaleString('vi-VN')} đ</b> để thực hiện thanh toán trực tiếp.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLinkingProvider(null)}
                className="w-1/2 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleConfirmLink}
                disabled={linkingLoading}
                className="w-1/2 text-xs font-semibold"
              >
                {linkingLoading ? 'Đang Liên Kết...' : 'Xác Nhận Liên Kết'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Số Dư Ví (Demo / Debug Trường Hợp Hết Tiền) */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-bold text-base text-ink">Chỉnh số dư {editingWallet.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="p-1 text-ink-3 hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                Số dư ví mong muốn (VNĐ):
              </label>
              <input
                type="text"
                value={newBalanceInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNewBalanceInput(val);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink font-mono font-bold text-base outline-none focus:border-accent"
                placeholder="Nhập số tiền (VD: 80000 hoặc 80.000)..."
              />
              <div className="mt-1 text-[11px] text-ink-3 flex justify-between">
                <span>Số tiền quy đổi:</span>
                <span className="font-mono font-bold text-accent">
                  {(parseInt(newBalanceInput || '0', 10) || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-ink-3 block mb-1.5">Chọn nhanh số dư:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveBalance(0)}
                  className="px-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold transition-all text-center"
                >
                  0 đ
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBalance(50000)}
                  className="px-2 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all text-center"
                >
                  50.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBalance(100000)}
                  className="px-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all text-center"
                >
                  100.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBalance(200000)}
                  className="px-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-[11px] font-bold transition-all text-center"
                >
                  200.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBalance(500000)}
                  className="px-2 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-[11px] font-bold transition-all text-center"
                >
                  500.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBalance(2000000)}
                  className="px-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all text-center"
                >
                  2.000.000 đ
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-line">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => setEditingWallet(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                className="flex-1 text-xs font-bold"
                onClick={() => handleSaveBalance()}
              >
                Lưu số dư
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </React.Suspense>
  );
}
