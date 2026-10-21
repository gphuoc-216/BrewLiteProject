import { PaymentService } from './payment.service';
import { BadRequestException, UnprocessableEntityException, ConflictException } from '@nestjs/common';
import { PaymentMethod, OrderStatus } from '@prisma/client';

describe('PaymentService (Thanh Toán Idempotent & Tồn Kho Đồng Thời - Task 10)', () => {
  let service: PaymentService;
  let mockPrisma: any;
  let mockGateway: any;

  beforeEach(() => {
    mockPrisma = {
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ingredient: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      customer: {
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockGateway = {
      processCharge: jest.fn(),
    };

    service = new PaymentService(mockPrisma, mockGateway);
  });

  describe('Tính chất Idempotent (Chống trừ tiền 2 lần)', () => {
    it('bắt buộc phải có header Idempotency-Key, nếu thiếu sẽ ném BadRequestException', async () => {
      await expect(
        service.processPayment({ orderId: 'ord-1', method: PaymentMethod.WALLET }, '', { profileId: 'cust-1', role: 'CUSTOMER' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('gửi lại cùng Idempotency-Key và cùng orderId sẽ trả về kết quả cũ (không tạo thanh toán lần 2)', async () => {
      const mockExistingPayment = {
        id: 'pay-1',
        idempotencyKey: 'KEY-12345',
        orderId: 'ord-1',
        amount: 50000,
        status: 'SUCCESS',
        order: { id: 'ord-1', status: OrderStatus.PAID },
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockExistingPayment);

      const result: any = await service.processPayment(
        { orderId: 'ord-1', method: PaymentMethod.WALLET },
        'KEY-12345',
        { profileId: 'cust-1', role: 'CUSTOMER' },
      );

      expect(result.cached).toBe(true);
      expect(result.payment.id).toBe('pay-1');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('gửi cùng Idempotency-Key cho đơn hàng khác sẽ ném UnprocessableEntityException (422)', async () => {
      const mockExistingPayment = {
        id: 'pay-1',
        idempotencyKey: 'KEY-12345',
        orderId: 'ord-OTHER',
        amount: 50000,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockExistingPayment);

      await expect(
        service.processPayment(
          { orderId: 'ord-1', method: PaymentMethod.WALLET },
          'KEY-12345',
          { profileId: 'cust-1', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('Kiểm soát Tồn kho Đồng thời (Optimistic Locking)', () => {
    it('bị chặn và ném ConflictException khi nguyên liệu trong kho không đủ định lượng', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        status: OrderStatus.PENDING,
        totalAfterDiscount: 45000,
        items: [
          {
            quantity: 2,
            variant: {
              recipes: [
                {
                  ingredientId: 'ing-coffee',
                  quantityRequired: 30, // Cần 2 * 30 = 60g
                  ingredient: { id: 'ing-coffee', name: 'Cà phê hạt Robusta' },
                },
              ],
            },
          },
        ],
      });

      // Tồn kho chỉ còn 10g (< 60g)
      mockPrisma.ingredient.findUnique.mockResolvedValue({
        id: 'ing-coffee',
        name: 'Cà phê hạt Robusta',
        stockQuantity: 10,
        version: 1,
      });

      await expect(
        service.processPayment(
          { orderId: 'ord-1', method: PaymentMethod.WALLET },
          'KEY-NEW-01',
          { profileId: 'cust-1', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('bị chặn và ném ConflictException khi xung đột phiên bản version sau 3 lần retry', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-2',
        customerId: 'cust-1',
        status: OrderStatus.PENDING,
        totalAfterDiscount: 35000,
        items: [
          {
            quantity: 1,
            variant: {
              recipes: [
                {
                  ingredientId: 'ing-milk',
                  quantityRequired: 50,
                  ingredient: { id: 'ing-milk', name: 'Sữa đặc' },
                },
              ],
            },
          },
        ],
      });

      mockPrisma.ingredient.findUnique.mockResolvedValue({
        id: 'ing-milk',
        name: 'Sữa đặc',
        stockQuantity: 100,
        version: 1,
      });
      // Giả lập xung đột phiên bản: updateMany trả về count: 0 (có khách hàng khác cập nhật trước)
      mockPrisma.ingredient.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.processPayment(
          { orderId: 'ord-2', method: PaymentMethod.WALLET },
          'KEY-RACE-01',
          { profileId: 'cust-1', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('thanh toán thành công chuyển đơn sang PAID và tích lũy điểm loyalty (+1 điểm / 10.000đ)', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-3',
        customerId: 'cust-1',
        status: OrderStatus.PENDING,
        totalAfterDiscount: 55000, // 55.000đ -> 5 điểm
        items: [
          {
            quantity: 1,
            variant: {
              recipes: [
                {
                  ingredientId: 'ing-coffee',
                  quantityRequired: 20,
                  ingredient: { id: 'ing-coffee', name: 'Cà phê hạt Robusta' },
                },
              ],
            },
          },
        ],
      });

      mockPrisma.ingredient.findUnique.mockResolvedValue({
        id: 'ing-coffee',
        name: 'Cà phê hạt Robusta',
        stockQuantity: 100,
        version: 1,
      });
      mockPrisma.ingredient.updateMany.mockResolvedValue({ count: 1 });
      mockGateway.processCharge.mockResolvedValue({ success: true, message: 'Giao dịch thành công' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-success' });
      mockPrisma.order.update.mockResolvedValue({ id: 'ord-3', status: OrderStatus.PAID });

      const res: any = await service.processPayment(
        { orderId: 'ord-3', method: PaymentMethod.WALLET },
        'KEY-SUCCESS-01',
        { profileId: 'cust-1', role: 'CUSTOMER' },
      );

      expect(res.success).toBe(true);
      expect(res.earnedPoints).toBe(5);

      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { loyaltyPoints: { increment: 5 } },
      });
    });
  });
});

