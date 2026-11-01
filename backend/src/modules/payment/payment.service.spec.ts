import { PaymentService } from './payment.service';
import { BadRequestException, UnprocessableEntityException, ConflictException } from '@nestjs/common';
import { PaymentMethod, OrderStatus } from '@prisma/client';

/**
 * Bộ kiểm thử tự động (Unit Test bằng Jest) cho Phân hệ Thanh Toán & Tồn Kho Đồng Thời (Task 10).
 * Kiểm chứng 2 kỹ thuật nâng cao:
 * 1. Thanh toán Idempotent (Chống trừ tiền 2 lần khi lag mạng bấm đúp).
 * 2. Kiểm soát tồn kho bằng Optimistic Locking (Chống Race Condition khi nhiều khách đặt cùng lúc).
 */
describe('PaymentService (Thanh Toán Idempotent & Tồn Kho Đồng Thời - Task 10)', () => {
  let service: PaymentService;
  let mockPrisma: any;
  let mockGateway: any;

  // Thiết lập dữ liệu giả lập (Mock) trước mỗi ca kiểm thử (Test Case)
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
      // Giả lập transaction Prisma: gọi trực tiếp callback truyền mockPrisma vào
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockGateway = {
      processCharge: jest.fn(),
    };

    service = new PaymentService(mockPrisma, mockGateway);
  });

  // ===========================================================================
  // NHÓM 1: KIỂM THỬ TÍNH CHẤT IDEMPOTENT (CHỐNG TRỪ TIỀN TRÙNG LẶP)
  // ===========================================================================
  // NHÓM 1: KIỂM THỬ TÍNH CHẤT IDEMPOTENT (CHỐNG TRỪ TIỀN TRÙNG LẶP)
  // ===========================================================================
  describe('Tính chất Idempotent (Chống trừ tiền 2 lần)', () => {
    // Ca kiểm thử 1: Thiếu Header Idempotency-Key
    it('bắt buộc phải có header Idempotency-Key, nếu thiếu sẽ ném BadRequestException', async () => {
      await expect(
        service.processPayment({ orderId: 'ord-1', method: PaymentMethod.WALLET }, '', { profileId: 'cust-1', role: 'CUSTOMER' }),
      ).rejects.toThrow(BadRequestException);
    });

    // Ca kiểm thử 2: Replay - Gửi lại cùng key và cùng đơn hàng đã thanh toán
    it('gửi lại cùng Idempotency-Key và cùng orderId sẽ trả về kết quả cũ (không tạo thanh toán lần 2)', async () => {
      // Giả lập trong CSDL đã có bản ghi thanh toán trước đó
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

      // Kỳ vọng: Trả về cờ cached: true và KHÔNG bao giờ gọi transaction để trừ kho lần 2
      expect(result.cached).toBe(true);
      expect(result.payment.id).toBe('pay-1');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    // Ca kiểm thử 3: Dùng lại key cũ nhưng gửi cho đơn hàng khác -> Vi phạm, ném lỗi 422
    it('gửi cùng Idempotency-Key cho đơn hàng khác sẽ ném UnprocessableEntityException (422)', async () => {
      const mockExistingPayment = {
        id: 'pay-1',
        idempotencyKey: 'KEY-12345',
        orderId: 'ord-OTHER', // Đơn hàng khác
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

  // ===========================================================================
  // NHÓM 2: KIỂM THỬ TỒN KHO ĐỒNG THỜI BẰNG OPTIMISTIC LOCKING (Task 10.3)
  // ===========================================================================
  describe('Kiểm soát Tồn kho Đồng thời (Optimistic Locking)', () => {
    // Ca kiểm thử 4: Tồn kho thực tế không đủ định lượng của công thức
    it('bị chặn và ném ConflictException khi nguyên liệu trong kho không đủ định lượng', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        status: OrderStatus.PENDING,
        totalAfterDiscount: 45000,
        items: [
          {
            quantity: 2, // Đặt 2 ly
            variant: {
              recipes: [
                {
                  ingredientId: 'ing-coffee',
                  quantityRequired: 30, // Cần 2 * 30 = 60g cà phê hạt
                  ingredient: { id: 'ing-coffee', name: 'Cà phê hạt Robusta' },
                },
              ],
            },
          },
        ],
      });

      // Giả lập kho chỉ còn 10g (< 60g cần dùng)
      mockPrisma.ingredient.findUnique.mockResolvedValue({
        id: 'ing-coffee',
        name: 'Cà phê hạt Robusta',
        stockQuantity: 10,
        version: 1,
      });

      // Kỳ vọng: Hệ thống từ chối thanh toán và ném ConflictException báo hết hàng
      await expect(
        service.processPayment(
          { orderId: 'ord-1', method: PaymentMethod.WALLET },
          'KEY-NEW-01',
          { profileId: 'cust-1', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    // Ca kiểm thử 5: Xung đột phiên bản version sau 3 lần retry (Race Condition)
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
      // Giả lập xung đột phiên bản: updateMany trả về count: 0 (có khách hàng khác cập nhật version trước)
      mockPrisma.ingredient.updateMany.mockResolvedValue({ count: 0 });

      // Kỳ vọng: Sau 3 lần retry thất bại, ném ConflictException báo hệ thống đang có nhiều người đặt cùng lúc
      await expect(
        service.processPayment(
          { orderId: 'ord-2', method: PaymentMethod.WALLET },
          'KEY-RACE-01',
          { profileId: 'cust-1', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    // Ca kiểm thử 6: Thanh toán thành công, chuyển trạng thái PAID và tích điểm thưởng
    it('thanh toán thành công chuyển đơn sang PAID và tích lũy điểm loyalty (+1 điểm / 10.000đ)', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-3',
        customerId: 'cust-1',
        status: OrderStatus.PENDING,
        totalAfterDiscount: 55000, // 55.000đ -> Kỳ vọng tích lũy Math.floor(55000 / 10000) = 5 điểm
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
      mockPrisma.ingredient.updateMany.mockResolvedValue({ count: 1 }); // Cập nhật kho thành công
      mockGateway.processCharge.mockResolvedValue({ success: true, message: 'Giao dịch thành công' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-success' });
      mockPrisma.order.update.mockResolvedValue({ id: 'ord-3', status: OrderStatus.PAID });

      const res: any = await service.processPayment(
        { orderId: 'ord-3', method: PaymentMethod.WALLET },
        'KEY-SUCCESS-01',
        { profileId: 'cust-1', role: 'CUSTOMER' },
      );

      // Kỳ vọng: Thành công và tích đúng 5 điểm
      expect(res.success).toBe(true);
      expect(res.earnedPoints).toBe(5);

      // Kiểm tra xem hàm cộng điểm có được gọi đúng tham số không
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { loyaltyPoints: { increment: 5 } },
      });
    });
  });
});

