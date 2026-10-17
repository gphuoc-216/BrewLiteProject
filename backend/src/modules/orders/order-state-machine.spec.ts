import { assertTransition, VALID_TRANSITIONS } from './order-state-machine';
import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('Order State Machine (Máy Trạng Thái Đơn Hàng - Task 10)', () => {
  describe('assertTransition - Luồng chuyển đổi hợp lệ', () => {
    it('cho phép chuyển từ PENDING sang PAID (thanh toán thành công)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    });

    it('cho phép chuyển từ PENDING sang PAYMENT_FAILED (thanh toán lỗi)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED)).not.toThrow();
    });

    it('cho phép chuyển từ PENDING sang CANCELLED (khách hủy đơn)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).not.toThrow();
    });

    it('cho phép chuyển từ PAYMENT_FAILED sang PENDING (thử lại thanh toán)', () => {
      expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING)).not.toThrow();
    });

    it('cho phép chuyển từ PAID sang PREPARING (barista tiếp nhận đơn)', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.PREPARING)).not.toThrow();
    });

    it('cho phép chuyển từ PAID sang CANCELLED (hủy trước khi pha chế, hoàn kho & tiền)', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.CANCELLED)).not.toThrow();
    });

    it('cho phép chuyển từ PREPARING sang READY (pha chế xong)', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY)).not.toThrow();
    });

    it('cho phép chuyển từ READY sang COMPLETED (bàn giao khách)', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
    });
  });

  describe('assertTransition - Chặn đứng các luồng chuyển đổi bất hợp lệ (ConflictException)', () => {
    it('chặn nhảy cóc từ PENDING trực tiếp sang COMPLETED', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED)).toThrow(ConflictException);
    });

    it('chặn nhảy cóc từ PENDING trực tiếp sang PREPARING', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PREPARING)).toThrow(ConflictException);
    });

    it('chặn chuyển từ PREPARING về PAID', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.PAID)).toThrow(ConflictException);
    });

    it('chặn chuyển từ READY về PREPARING', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.PREPARING)).toThrow(ConflictException);
    });

    it('chặn thay đổi trạng thái sau khi đã COMPLETED (trạng thái kết thúc)', () => {
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PENDING)).toThrow(ConflictException);
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toThrow(ConflictException);
    });

    it('chặn thay đổi trạng thái sau khi đã CANCELLED (trạng thái kết thúc)', () => {
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toThrow(ConflictException);
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PREPARING)).toThrow(ConflictException);
    });
  });
});
