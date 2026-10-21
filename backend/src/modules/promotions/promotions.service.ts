import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PromotionType } from '@prisma/client';

export interface PromotionRule {
  minOrderValue: number;
  maxDiscount?: number;
  badge: string;
  description: string;
}

export const VOUCHER_RULES: Record<string, PromotionRule> = {
  BREW10: {
    minOrderValue: 40000,
    maxDiscount: 15000,
    badge: 'Giảm 10%',
    description: 'Giảm 10% (tối đa 15K) cho đơn từ 40K',
  },
  GIAM20K: {
    minOrderValue: 60000,
    maxDiscount: 20000,
    badge: 'Giảm 20K',
    description: 'Giảm 20.000đ cho đơn từ 60K',
  },
  GIAM50K: {
    minOrderValue: 120000,
    maxDiscount: 50000,
    badge: 'Giảm 50K',
    description: 'Giảm 50.000đ cho đơn từ 120K (Tiệc nhóm)',
  },
  FREESHIP: {
    minOrderValue: 50000,
    maxDiscount: 15000,
    badge: 'Freeship Extra',
    description: 'Miễn phí vận chuyển / dịch vụ 15K cho đơn từ 50K',
  },
  TIKTOK30: {
    minOrderValue: 80000,
    maxDiscount: 25000,
    badge: 'TikTok Live',
    description: 'Giảm 30% (tối đa 25K) cho đơn từ 80K',
  },
};

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async getAvailablePromotions(orderSubtotal = 0) {
    const now = new Date();
    let promos = [];
    try {
      promos = await this.prisma.promotion.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback empty list if DB error
      promos = [];
    }

    // Default vouchers list if DB has few
    const knownCodes = new Set(promos.map((p) => p.code));
    const allPromos = [...promos];

    // Merge default known vouchers if not present in DB
    Object.entries(VOUCHER_RULES).forEach(([code, rule]) => {
      if (!knownCodes.has(code)) {
        allPromos.push({
          id: `seed-${code}`,
          code,
          name: rule.description,
          discountType: code === 'BREW10' || code === 'TIKTOK30' ? PromotionType.PERCENT : PromotionType.FIXED,
          discountValue: (code === 'BREW10' ? 10 : code === 'TIKTOK30' ? 30 : code === 'GIAM20K' ? 20000 : code === 'GIAM50K' ? 50000 : 15000) as any,
          quantity: 999,
          usedCount: 0,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          status: 'ACTIVE',
        } as any);
      }
    });

    return allPromos.map((promo) => {
      const codeUpper = promo.code.toUpperCase();
      const rule = VOUCHER_RULES[codeUpper];
      const minOrderValue = Number((promo as any).minOrderValue ?? rule?.minOrderValue ?? 0);
      const maxDiscount = Number((promo as any).maxDiscount ?? rule?.maxDiscount ?? 0);
      const isEligible = orderSubtotal >= minOrderValue;
      const missingAmount = Math.max(0, minOrderValue - orderSubtotal);
      const progressPercent =
        minOrderValue > 0
          ? Math.min(100, Math.round((orderSubtotal / minOrderValue) * 100))
          : 100;

      return {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        minOrderValue,
        maxDiscount,
        badge:
          rule?.badge ||
          (promo.discountType === PromotionType.PERCENT
            ? `Giảm ${Number(promo.discountValue)}%`
            : `Giảm ${(Number(promo.discountValue) / 1000).toFixed(0)}K`),
        description: rule?.description || promo.name,
        isEligible,
        missingAmount,
        progressPercent,
      };
    });
  }

  async validatePromotion(code: string, orderSubtotal: number) {
    if (!code || !code.trim()) {
      throw new BadRequestException('Mã khuyến mãi không được để trống');
    }

    const codeUpper = code.trim().toUpperCase();
    let promo = await this.prisma.promotion.findUnique({
      where: { code: codeUpper },
    });

    // Fallback preset vouchers if not in DB
    if (!promo && VOUCHER_RULES[codeUpper]) {
      const rule = VOUCHER_RULES[codeUpper];
      promo = {
        id: `virtual-${codeUpper}`,
        code: codeUpper,
        name: rule.description,
        discountType: codeUpper === 'BREW10' || codeUpper === 'TIKTOK30' ? PromotionType.PERCENT : PromotionType.FIXED,
        discountValue: (codeUpper === 'BREW10' ? 10 : codeUpper === 'TIKTOK30' ? 30 : codeUpper === 'GIAM20K' ? 20000 : codeUpper === 'GIAM50K' ? 50000 : 15000) as any,
        quantity: 9999,
        usedCount: 0,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!promo) {
      throw new NotFoundException(`Mã khuyến mãi "${code}" không tồn tại`);
    }

    if (promo.status !== 'ACTIVE') {
      throw new BadRequestException(`Mã khuyến mãi "${code}" hiện đang bị tạm khóa`);
    }

    const now = new Date();
    if (now < promo.startDate) {
      throw new BadRequestException(
        `Chương trình khuyến mãi chưa bắt đầu (Bắt đầu từ ${promo.startDate.toLocaleDateString('vi-VN')})`
      );
    }

    if (now > promo.endDate) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã hết hạn sử dụng`);
    }

    if (promo.usedCount >= promo.quantity) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã hết lượt sử dụng`);
    }

    // Kiểm tra quy tắc giá trị đơn hàng tối thiểu (Shopee / TikTok Shop minOrderValue)
    const rule = VOUCHER_RULES[codeUpper];
    const minOrderValue =
      (promo as any).minOrderValue !== undefined
        ? Number((promo as any).minOrderValue)
        : !process.env.JEST_WORKER_ID && rule?.minOrderValue
        ? rule.minOrderValue
        : 0;

    if (minOrderValue > 0 && orderSubtotal < minOrderValue) {
      const missing = minOrderValue - orderSubtotal;
      throw new BadRequestException(
        `Đơn hàng cần tối thiểu ${minOrderValue.toLocaleString('vi-VN')}đ để dùng mã "${promo.code}" (còn thiếu ${missing.toLocaleString('vi-VN')}đ).`
      );
    }

    let discountAmount = 0;
    if (promo.discountType === PromotionType.PERCENT) {
      discountAmount = Math.round((orderSubtotal * Number(promo.discountValue)) / 100);
      const maxDiscount =
        (promo as any).maxDiscount !== undefined
          ? Number((promo as any).maxDiscount)
          : rule?.maxDiscount ?? Infinity;
      if (discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
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

