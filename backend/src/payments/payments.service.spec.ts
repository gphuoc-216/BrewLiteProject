import { PaymentsService, PaymentRequest } from './payments.service';
import { BadRequestException } from '@nestjs/common';

describe('Payments Service Idempotency Tests (Task 10.2)', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService();
  });

  it('xử lý thanh toán thành công khi có Idempotency-Key hợp lệ', () => {
    const payload: PaymentRequest = {
      orderId: 'order_001',
      amount: 45000,
      method: 'WALLET',
    };

    const result = service.processPayment('key_unique_123', payload);
    expect(result.status).toBe('PAID');
    expect(result.idempotencyKey).toBe('key_unique_123');
  });

  it('gửi 2 lần cùng Idempotency-Key chỉ trả về đúng 1 giao dịch ban đầu, không tạo mới', () => {
    const payload: PaymentRequest = {
      orderId: 'order_002',
      amount: 50000,
      method: 'CARD',
    };

    // Gửi lần 1
    const firstCall = service.processPayment('duplicate_key_456', payload);
    // Gửi lần 2 với cùng key
    const secondCall = service.processPayment('duplicate_key_456', payload);

    expect(firstCall.id).toBe(secondCall.id);
    expect(firstCall.createdAt).toEqual(secondCall.createdAt);
  });

  it('ném lỗi khi thiếu Idempotency-Key trong request', () => {
    const payload: PaymentRequest = {
      orderId: 'order_003',
      amount: 30000,
      method: 'WALLET',
    };

    expect(() => service.processPayment('', payload)).toThrow(
      BadRequestException,
    );
  });
});
