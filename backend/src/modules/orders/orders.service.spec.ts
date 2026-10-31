import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus, PromotionType } from '@prisma/client';

describe('OrdersService - Task 6: API tạo đơn hàng (POST /orders)', () => {
  let service: OrdersService;
  let prismaMock: any;
  let promotionsMock: any;

  beforeEach(() => {
    prismaMock = {
      productVariant: {
        findMany: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    promotionsMock = {
      validatePromotion: jest.fn(),
    };

    service = new OrdersService(prismaMock, promotionsMock);
  });

  it('1. Từ chối tạo đơn khi giỏ hàng rỗng (items = [])', async () => {
    await expect(
      service.createOrder('cust-123', { items: [] })
    ).rejects.toThrow(BadRequestException);
  });

  it('2. Khởi tạo đơn hàng thành công ở trạng thái PENDING và trả về mã đơn', async () => {
    const mockVariants = [
      {
        id: 'var-1',
        productId: 'prod-1',
        size: 'M',
        price: 35000,
        product: { id: 'prod-1', name: 'Cà phê Sữa Đá' },
      },
    ];

    prismaMock.productVariant.findMany.mockResolvedValue(mockVariants);

    const createdOrderMock = {
      id: 'order-uuid-12345',
      customerId: 'cust-123',
      status: OrderStatus.PENDING,
      discountAmount: 0,
      totalAfterDiscount: 70000,
      items: [
        {
          id: 'item-1',
          variantId: 'var-1',
          quantity: 2,
          lineTotal: 70000,
        },
      ],
      createdAt: new Date(),
    };

    prismaMock.order.create.mockResolvedValue(createdOrderMock);
    prismaMock.orderStatusHistory.create.mockResolvedValue({ id: 'hist-1' });

    const result = await service.createOrder('cust-123', {
      items: [{ variantId: 'var-1', quantity: 2 }],
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('order-uuid-12345');
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(result.totalAfterDiscount).toBe(70000);
    expect(prismaMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PENDING,
          customerId: 'cust-123',
          totalAfterDiscount: 70000,
        }),
      })
    );
    expect(prismaMock.orderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-uuid-12345',
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PENDING,
        }),
      })
    );
  });

  it('3. Áp dụng mã khuyến mãi hợp lệ và trừ tiền chính xác vào đơn PENDING', async () => {
    const mockVariants = [
      {
        id: 'var-1',
        productId: 'prod-1',
        size: 'M',
        price: 50000,
        product: { id: 'prod-1', name: 'Trà Đào Cam Sả' },
      },
    ];

    prismaMock.productVariant.findMany.mockResolvedValue(mockVariants);
    promotionsMock.validatePromotion.mockResolvedValue({
      valid: true,
      promotionId: 'promo-brew10',
      code: 'BREW10',
      discountAmount: 5000,
      finalTotal: 45000,
    });

    const createdOrderMock = {
      id: 'order-uuid-discount',
      customerId: 'cust-123',
      promotionId: 'promo-brew10',
      status: OrderStatus.PENDING,
      discountAmount: 5000,
      totalAfterDiscount: 45000,
      items: [{ id: 'item-1', variantId: 'var-1', quantity: 1, lineTotal: 50000 }],
    };

    prismaMock.order.create.mockResolvedValue(createdOrderMock);

    const result = await service.createOrder('cust-123', {
      items: [{ variantId: 'var-1', quantity: 1 }],
      promotionCode: 'BREW10',
    });

    expect(promotionsMock.validatePromotion).toHaveBeenCalledWith('BREW10', 50000);
    expect(result.discountAmount).toBe(5000);
    expect(result.totalAfterDiscount).toBe(45000);
    expect(result.status).toBe(OrderStatus.PENDING);
  });

  it('4. Báo lỗi khi một số biến thể món không tồn tại trong CSDL', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([]); // Không tìm thấy

    await expect(
      service.createOrder('cust-123', {
        items: [{ variantId: 'var-non-existent', quantity: 1 }],
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('5. Tính toán chính xác giá biến thể có topping khi đặt món', async () => {
    const mockVariants = [
      {
        id: 'var-2',
        productId: 'prod-2',
        size: 'L',
        price: 46000,
        topping: 'Trân châu đường đen',
        product: { id: 'prod-2', name: 'Trà Sữa Oolong' },
      },
    ];

    prismaMock.productVariant.findMany.mockResolvedValue(mockVariants);

    prismaMock.order.create.mockImplementation(({ data }) => {
      return Promise.resolve({
        id: 'order-topping-123',
        status: OrderStatus.PENDING,
        totalAfterDiscount: data.totalAfterDiscount,
        items: data.items.create,
      });
    });

    const result = await service.createOrder('cust-123', {
      items: [
        {
          variantId: 'var-2',
          quantity: 1,
        },
      ],
    });

    expect(result.totalAfterDiscount).toBe(46000);
    expect(result.status).toBe(OrderStatus.PENDING);
  });
});

