import { assertTransition, VALID_TRANSITIONS } from './order-state-machine';
import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * =========================================================================================
 * BỘ KIỂM THỬ TỰ ĐỘNG CHO MÁY TRẠNG THÁI ĐƠN HÀNG (STATE MACHINE UNIT TEST - TASK 10.1)
 * =========================================================================================
 * Bộ test này chịu trách nhiệm:
 * 1. Kiểm tra tất cả các bước chuyển trạng thái hợp lệ trong vòng đời đơn hàng:
 *    PENDING -> PAID -> PREPARING -> READY -> COMPLETED.
 * 2. Đảm bảo các chuyển tiếp ngoại lệ (thanh toán lỗi, hủy đơn, thử lại) được phép diễn ra đúng kịch bản.
 * 3. Đảm bảo các hành vi "nhảy cóc" hoặc "quay ngược" bất hợp lệ phải bị ném ngoại lệ ConflictException (409).
 * =========================================================================================
 */
describe('Order State Machine (Máy Trạng Thái Đơn Hàng - Task 10)', () => {
  // ---------------------------------------------------------------------------------------
  // NHÓM 1: CÁC LUỒNG CHUYỂN ĐỔI HỢP LỆ (CHO PHÉP THỰC HIỆN)
  // ---------------------------------------------------------------------------------------
  describe('assertTransition - Luồng chuyển đổi hợp lệ', () => {
    // 1.1 Khách thanh toán tiền thành công qua thẻ hoặc ví
    it('cho phép chuyển từ PENDING sang PAID (thanh toán thành công)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    });

    // 1.2 Cổng thanh toán báo lỗi (thẻ hết tiền, mã OTP sai, timeout)
    it('cho phép chuyển từ PENDING sang PAYMENT_FAILED (thanh toán lỗi)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED)).not.toThrow();
    });

    // 1.3 Khách đổi ý không muốn mua nữa trước khi thanh toán
    it('cho phép chuyển từ PENDING sang CANCELLED (khách hủy đơn)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).not.toThrow();
    });

    // 1.4 Khách bấm "Thanh toán lại" sau khi lần trước bị lỗi
    it('cho phép chuyển từ PAYMENT_FAILED sang PENDING (thử lại thanh toán)', () => {
      expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING)).not.toThrow();
    });

    // 1.5 Barista tại quầy bấm tiếp nhận đơn để bắt đầu pha chế đồ uống
    it('cho phép chuyển từ PAID sang PREPARING (barista tiếp nhận đơn)', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.PREPARING)).not.toThrow();
    });

    // 1.6 Khách hoặc Admin hủy đơn sau khi thanh toán nhưng TRƯỚC KHI Barista pha chế
    it('cho phép chuyển từ PAID sang CANCELLED (hủy trước khi pha chế, hoàn kho & tiền)', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.CANCELLED)).not.toThrow();
    });

    // 1.7 Barista làm xong tất cả món và bấm sẵn sàng phục vụ
    it('cho phép chuyển từ PREPARING sang READY (pha chế xong)', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY)).not.toThrow();
    });

    // 1.8 Khách lấy nước hoặc shipper giao thành công
    it('cho phép chuyển từ READY sang COMPLETED (bàn giao khách)', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------------------
  // NHÓM 2: CHẶN ĐỨNG CÁC CHUYỂN ĐỔI BẤT HỢP LỆ (BẮT BUỘC NÉM CONFLICT EXCEPTION)
  // ---------------------------------------------------------------------------------------
  describe('assertTransition - Chặn đứng các luồng chuyển đổi bất hợp lệ (ConflictException)', () => {
    // 2.1 Chặn nhảy cóc từ PENDING trực tiếp sang COMPLETED (chưa trả tiền và chưa pha đã đòi hoàn tất)
    it('chặn nhảy cóc từ PENDING trực tiếp sang COMPLETED', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED)).toThrow(ConflictException);
    });

    // 2.2 Chặn nhảy cóc từ PENDING sang PREPARING (chưa trả tiền mà Barista đã pha)
    it('chặn nhảy cóc từ PENDING trực tiếp sang PREPARING', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PREPARING)).toThrow(ConflictException);
    });

    // 2.3 Chặn chuyển lùi từ PREPARING về PAID (đang pha chế không thể quay về chưa pha)
    it('chặn chuyển từ PREPARING về PAID', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.PAID)).toThrow(ConflictException);
    });

    // 2.4 Chặn chuyển lùi từ READY về PREPARING (đã pha xong không thể quay lại đang pha)
    it('chặn chuyển từ READY về PREPARING', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.PREPARING)).toThrow(ConflictException);
    });

    // 2.5 Đơn hàng đã COMPLETED là trạng thái kết thúc (Terminal State), không thể thay đổi nữa
    it('chặn thay đổi trạng thái sau khi đã COMPLETED (trạng thái kết thúc)', () => {
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PENDING)).toThrow(ConflictException);
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toThrow(ConflictException);
    });

    // 2.6 Đơn hàng đã CANCELLED là trạng thái kết thúc (Terminal State), không thể hồi sinh hoặc pha chế
    it('chặn thay đổi trạng thái sau khi đã CANCELLED (trạng thái kết thúc)', () => {
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toThrow(ConflictException);
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PREPARING)).toThrow(ConflictException);
    });
  });
});
