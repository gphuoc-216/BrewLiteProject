import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * =========================================================================================
 * BẢNG ĐIỀU KIỆN CHUYỂN TRẠNG THÁI HỢP LỆ (STATE MACHINE MATRIX - TASK 9 BE)
 * =========================================================================================
 * Định nghĩa ma trận các bước nhảy trạng thái được phép xảy ra đối với một Đơn hàng (Order).
 * Ngăn chặn tuyệt đối tình trạng "nhảy cóc" trạng thái (ví dụ: vừa tạo đơn PENDING nhảy ngay sang COMPLETED)
 * hoặc chuyển lùi phi logic (ví dụ: đã pha chế READY quay lại PREPARING).
 * 
 * Luồng chuẩn:
 *   [PENDING] --------> [PAID] --------> [PREPARING] --------> [READY] --------> [COMPLETED]
 *       |                  |
 *       v                  v
 *  [PAYMENT_FAILED]   [CANCELLED] (Hoàn tiền & Hoàn kho)
 *       |
 *       v
 *   [PENDING] (Thử lại)
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // Trạng thái PENDING (Chờ thanh toán):
  // - Khách thanh toán thành công -> PAID
  // - Thanh toán thất bại hoặc timeout -> PAYMENT_FAILED
  // - Khách chủ động hủy đơn trước khi thanh toán -> CANCELLED
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],

  // Trạng thái PAYMENT_FAILED (Thanh toán lỗi/thất bại):
  // - Cho phép khách hàng bấm "Thử lại thanh toán" -> quay về PENDING
  // - Khách hàng không muốn tiếp tục và chọn hủy -> CANCELLED
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,   // Cho phép thử lại thanh toán
    OrderStatus.CANCELLED, // Khách chọn hủy đơn
  ],

  // Trạng thái PAID (Đã thanh toán thành công):
  // - Nhân viên/Barista tiếp nhận đơn bắt đầu làm đồ uống -> PREPARING
  // - Khách hoặc Admin hủy đơn TRƯỚC KHI pha chế -> CANCELLED (Kích hoạt hoàn kho và hoàn điểm)
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING, // Barista bắt đầu pha chế
    OrderStatus.CANCELLED, // Khách hoặc Admin hủy đơn (hoàn tiền & kho)
  ],

  // Trạng thái PREPARING (Đang pha chế):
  // - Sau khi barista pha chế xong -> READY (Sẵn sàng phục vụ / Chờ lấy)
  // - LƯU Ý: Khi đã pha chế thì KHÔNG ĐƯỢC PHÉP HỦY ĐƠN (tránh lãng phí nguyên liệu)
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,     // Barista pha chế xong
  ],

  // Trạng thái READY (Đồ uống đã làm xong, chờ khách nhận hoặc giao đi):
  // - Bàn giao thành công cho khách hàng -> COMPLETED
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED, // Bàn giao đồ uống thành công cho khách
  ],

  // Trạng thái COMPLETED (Đơn hàng hoàn tất): Trạng thái kết thúc (Terminal State), không thể chuyển tiếp
  [OrderStatus.COMPLETED]: [],

  // Trạng thái CANCELLED (Đơn hàng đã hủy): Trạng thái kết thúc (Terminal State), không thể chuyển tiếp
  [OrderStatus.CANCELLED]: [],
};

/**
 * =========================================================================================
 * HÀM XÁC THỰC CHUYỂN ĐỔI TRẠNG THÁI (ASSERT TRANSITION)
 * =========================================================================================
 * @param fromStatus Trạng thái hiện tại của đơn hàng lấy từ Database
 * @param toStatus Trạng thái đích mà request muốn chuyển đến
 * 
 * Kiểm tra xem bước chuyển này có nằm trong VALID_TRANSITIONS hay không:
 * - Nếu hợp lệ: Hàm chạy qua bình thường (không ném lỗi).
 * - Nếu không hợp lệ: Ném `ConflictException (HTTP 409 Conflict)` kèm thông báo lỗi chi tiết,
 *   bảo vệ tính toàn vẹn nghiệp vụ của hệ thống.
 */
export function assertTransition(fromStatus: OrderStatus, toStatus: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new ConflictException(
      `Chuyển đổi trạng thái đơn hàng không hợp lệ: Không thể chuyển từ '${fromStatus}' sang '${toStatus}'.`,
    );
  }
}
