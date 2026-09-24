import { assertTransition, OrderStatus } from './order-state-machine';
import { BadRequestException } from '@nestjs/common';

describe('Order State Machine Tests (Task 10.1)', () => {
  it('cho phép chuyển luồng thành công: PENDING -> PAID -> PREPARING -> READY -> COMPLETED', () => {
    expect(() =>
      assertTransition(OrderStatus.PENDING, OrderStatus.PAID),
    ).not.toThrow();
    expect(() =>
      assertTransition(OrderStatus.PAID, OrderStatus.PREPARING),
    ).not.toThrow();
    expect(() =>
      assertTransition(OrderStatus.PREPARING, OrderStatus.READY),
    ).not.toThrow();
    expect(() =>
      assertTransition(OrderStatus.READY, OrderStatus.COMPLETED),
    ).not.toThrow();
  });

  it('cho phép chuyển luồng lỗi: PENDING -> PAYMENT_FAILED -> PENDING', () => {
    expect(() =>
      assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED),
    ).not.toThrow();
    expect(() =>
      assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING),
    ).not.toThrow();
  });

  it('chặn chuyển trạng thái sai: PENDING -> COMPLETED trực tiếp', () => {
    expect(() =>
      assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
    ).toThrow(BadRequestException);
  });

  it('chặn thay đổi khi đã COMPLETED hoặc CANCELLED', () => {
    expect(() =>
      assertTransition(OrderStatus.COMPLETED, OrderStatus.PENDING),
    ).toThrow(BadRequestException);
    expect(() =>
      assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID),
    ).toThrow(BadRequestException);
  });
});
