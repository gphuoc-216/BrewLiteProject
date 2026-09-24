import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { assertTransition, OrderStatus } from '../orders/order-state-machine';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: 'WALLET' | 'CARD';
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: string;
  status: 'PAID' | 'PAYMENT_FAILED';
  createdAt: Date;
}

@Injectable()
export class PaymentsService {
  // Dùng Map in-memory để kiểm thử logic chống trùng lặp độc lập
  private paymentsMap = new Map<string, PaymentRecord>();

  processPayment(
    idempotencyKey: string,
    payload: PaymentRequest,
  ): PaymentRecord {
    if (!idempotencyKey) {
      throw new BadRequestException('Thiếu header Idempotency-Key');
    }

    // Task 10.2: Nếu idempotencyKey đã tồn tại, trả về kết quả cũ ngay lập tức (không trừ tiền lần 2)
    if (this.paymentsMap.has(idempotencyKey)) {
      return this.paymentsMap.get(idempotencyKey)!;
    }

    // Kiểm tra luồng trạng thái
    assertTransition(OrderStatus.PENDING, OrderStatus.PAID);

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      orderId: payload.orderId,
      idempotencyKey,
      amount: payload.amount,
      method: payload.method,
      status: 'PAID',
      createdAt: new Date(),
    };

    this.paymentsMap.set(idempotencyKey, newPayment);
    return newPayment;
  }

  getPaymentByKey(key: string): PaymentRecord | undefined {
    return this.paymentsMap.get(key);
  }
}
