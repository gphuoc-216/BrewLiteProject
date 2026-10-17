import { PromotionsService } from './promotions.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PromotionType } from '@prisma/client';

describe('PromotionsService (Khuyến Mãi & Giảm Giá - Task 10)', () => {
  let service: PromotionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      promotion: {
        findUnique: jest.fn(),
      },
    };
    service = new PromotionsService(mockPrisma);
  });

  it('tính toán giảm giá theo phần trăm (PERCENT) chuẩn xác', async () => {
    mockPrisma.promotion.findUnique.mockResolvedValue({
      id: 'promo-1',
      code: 'BREW10',
      name: 'Giảm 10%',
      discountType: PromotionType.PERCENT,
      discountValue: 10,
      quantity: 100,
      usedCount: 0,
      startDate: new Date(Date.now() - 100000),
      endDate: new Date(Date.now() + 100000),
      status: 'ACTIVE',
    });

    const result = await service.validatePromotion('BREW10', 50000);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(5000);
    expect(result.finalTotal).toBe(45000);
  });

  it('tính toán giảm giá cố định (FIXED) và không vượt quá tổng tiền đơn', async () => {
    mockPrisma.promotion.findUnique.mockResolvedValue({
      id: 'promo-2',
      code: 'GIAM20K',
      name: 'Giảm 20K',
      discountType: PromotionType.FIXED,
      discountValue: 20000,
      quantity: 100,
      usedCount: 0,
      startDate: new Date(Date.now() - 100000),
      endDate: new Date(Date.now() + 100000),
      status: 'ACTIVE',
    });

    // Đơn 15.000đ nhưng mã giảm 20.000đ -> Giảm tối đa 15.000đ, tổng tiền còn 0đ
    const result = await service.validatePromotion('GIAM20K', 15000);
    expect(result.discountAmount).toBe(15000);
    expect(result.finalTotal).toBe(0);
  });

  it('từ chối mã khuyến mãi đã hết hạn', async () => {
    mockPrisma.promotion.findUnique.mockResolvedValue({
      id: 'promo-3',
      code: 'EXPIRED',
      name: 'Hết hạn',
      discountType: PromotionType.PERCENT,
      discountValue: 10,
      quantity: 100,
      usedCount: 0,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2020-12-31'),
      status: 'ACTIVE',
    });

    await expect(service.validatePromotion('EXPIRED', 50000)).rejects.toThrow(BadRequestException);
  });

  it('từ chối mã khuyến mãi đã dùng hết số lượt (usedCount >= quantity)', async () => {
    mockPrisma.promotion.findUnique.mockResolvedValue({
      id: 'promo-4',
      code: 'SOLDOUT',
      name: 'Hết lượt',
      discountType: PromotionType.PERCENT,
      discountValue: 10,
      quantity: 10,
      usedCount: 10,
      startDate: new Date(Date.now() - 100000),
      endDate: new Date(Date.now() + 100000),
      status: 'ACTIVE',
    });

    await expect(service.validatePromotion('SOLDOUT', 50000)).rejects.toThrow(BadRequestException);
  });
});
