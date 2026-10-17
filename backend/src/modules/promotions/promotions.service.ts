import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PromotionType } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async validatePromotion(code: string, orderSubtotal: number) {
    if (!code || !code.trim()) {
      throw new BadRequestException('Mã khuyến mãi không được để trống');
    }

    const promo = await this.prisma.promotion.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo) {
      throw new NotFoundException(`Mã khuyến mãi "${code}" không tồn tại`);
    }

    if (promo.status !== 'ACTIVE') {
      throw new BadRequestException(`Mã khuyến mãi "${code}" hiện đang bị tạm khóa`);
    }

    const now = new Date();
    if (now < promo.startDate) {
      throw new BadRequestException(`Chương trình khuyến mãi chưa bắt đầu (Bắt đầu từ ${promo.startDate.toLocaleDateString()})`);
    }

    if (now > promo.endDate) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã hết hạn sử dụng`);
    }

    if (promo.usedCount >= promo.quantity) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã hết lượt sử dụng`);
    }

    let discountAmount = 0;
    if (promo.discountType === PromotionType.PERCENT) {
      discountAmount = Math.round((orderSubtotal * Number(promo.discountValue)) / 100);
    } else {
      discountAmount = Number(promo.discountValue);
    }

    // Không giảm quá tổng tiền đơn
    discountAmount = Math.min(discountAmount, orderSubtotal);
    const finalTotal = Math.max(0, orderSubtotal - discountAmount);

    return {
      valid: true,
      promotionId: promo.id,
      code: promo.code,
      name: promo.name,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount,
      finalTotal,
    };
  }
}
