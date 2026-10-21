import { OrderStatus } from '@/types';

export interface OrderStatusConfig {
  label: string;
  tone: 'warning' | 'info' | 'accent' | 'success' | 'neutral' | 'danger';
  step: number; // -1 for special (PENDING, PAYMENT_FAILED, CANCELLED), 0: PAID, 1: PREPARING, 2: READY, 3: COMPLETED
  bg: string;
  text: string;
  border: string;
  baristaTitle?: string;
  timelineSub?: string;
}

export const ORDER_STATUS: Record<OrderStatus, OrderStatusConfig> = {
  PENDING: {
    label: 'Chờ thanh toán',
    tone: 'warning',
    step: -1,
    bg: 'bg-warning-soft',
    text: 'text-warning',
    border: 'border-warning/20',
    timelineSub: 'Đang xử lý tạo đơn',
  },
  PAID: {
    label: 'Đã thanh toán',
    tone: 'info',
    step: 0,
    bg: 'bg-info-soft',
    text: 'text-info',
    border: 'border-info/20',
    baristaTitle: 'Đơn chờ pha chế',
    timelineSub: 'Đã gửi tới quầy',
  },
  PREPARING: {
    label: 'Đang pha chế',
    tone: 'accent',
    step: 1,
    bg: 'bg-accent-soft',
    text: 'text-accent',
    border: 'border-accent/25',
    baristaTitle: 'Đang thực hiện',
    timelineSub: 'Barista đang làm',
  },
  READY: {
    label: 'Sẵn sàng lấy món',
    tone: 'success',
    step: 2,
    bg: 'bg-success-soft',
    text: 'text-success',
    border: 'border-success/25',
    baristaTitle: 'Chờ khách nhận',
    timelineSub: 'Mời bạn tới quầy',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    tone: 'neutral',
    step: 3,
    bg: 'bg-surface-2',
    text: 'text-ink-2',
    border: 'border-line',
    timelineSub: 'Chúc bạn ngon miệng',
  },
  PAYMENT_FAILED: {
    label: 'Thanh toán lỗi',
    tone: 'danger',
    step: -1,
    bg: 'bg-danger-soft',
    text: 'text-danger',
    border: 'border-danger/20',
    timelineSub: 'Giao dịch chưa hoàn tất',
  },
  CANCELLED: {
    label: 'Đã hủy',
    tone: 'neutral',
    step: -1,
    bg: 'bg-surface-2',
    text: 'text-ink-3',
    border: 'border-line',
    timelineSub: 'Đơn hàng đã hủy',
  },
};
