import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PAID,       // Cho phép thử lại thanh toán thành công
    OrderStatus.PENDING,   // Cho phép thử lại thanh toán
    OrderStatus.CANCELLED, // Khách chọn hủy đơn
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING, // Barista bắt đầu pha chế
    OrderStatus.CANCELLED, // Khách hoặc Admin hủy đơn (hoàn tiền & kho)
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,     // Barista pha chế xong
  ],
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED, // Bàn giao đồ uống thành công cho khách
  ],
  [OrderStatus.COMPLETED]: [], // Trạng thái kết thúc
  [OrderStatus.CANCELLED]: [], // Trạng thái kết thúc
};

/**
 * Hàm kiểm tra tính hợp lệ của việc chuyển đổi trạng thái đơn hàng.
 * Ném ConflictException nếu phát hiện chuyển tiếp bất hợp lệ theo mục 9 đề bài bài tập lớn.
 */
export function assertTransition(fromStatus: OrderStatus, toStatus: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new ConflictException(
      `Chuyển đổi trạng thái đơn hàng không hợp lệ: Không thể chuyển từ '${fromStatus}' sang '${toStatus}'.`,
    );
  }
}
