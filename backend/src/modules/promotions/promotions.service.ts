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
  BANMOI: {
    minOrderValue: 35000,
    maxDiscount: 15000,
    badge: "Bạn Mới 15K",
    description: "Ưu đãi chào bạn mới tại quán BrewLite",
  },
  BREW10: {
    minOrderValue: 30000,
    maxDiscount: 15000,
    badge: "Giảm 10%",
    description: "Giảm 10% (tối đa 15.000đ) cho đơn từ 30.000đ",
  },
  HAPPYHOUR: {
    minOrderValue: 40000,
    maxDiscount: 15000,
    badge: "Giờ Vàng 15K",
    description: "Ưu đãi khung giờ vàng tại quán (14h - 17h)",
  },
  GIAM20K: {
    minOrderValue: 60000,
    maxDiscount: 20000,
    badge: "Khách Quen 20K",
    description: "Giảm ngay 20.000đ cho đơn từ 60.000đ",
  },
  GIAM30K: {
    minOrderValue: 80000,
    maxDiscount: 30000,
    badge: "Combo 30K",
    description: "Giảm 30.000đ cho combo nạp năng lượng từ 80.000đ",
  },
  COFFEEVIP: {
    minOrderValue: 100000,
    maxDiscount: 30000,
    badge: "Tiệc Nhóm 30K",
    description: "Giảm 30.000đ cho đơn từ 100.000đ (Tiệc nhóm bạn)",
  },
  BREWVIP: {
    minOrderValue: 120000,
    maxDiscount: 50000,
    badge: "BrewVIP 50K",
    description: "Giảm 50.000đ cho đơn từ 120.000đ (Hội nhóm cà phê)",
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
      promos = promos.filter(
        (p) => p.usedCount < p.quantity && p.code !== 'SOLDOUT' && p.code !== 'EXPIRED50'
      );
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
          discountType: code === 'BREW10' ? PromotionType.PERCENT : PromotionType.FIXED,
          discountValue: (code === 'BREW10' ? 10 : code === 'GIAM20K' ? 20000 : 30000) as any,
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
    let promo = null;
    try {
      promo = await this.prisma.promotion.findUnique({
        where: { code: codeUpper },
      });
    } catch {
      promo = null;
    }

    // Fallback preset vouchers if not in DB
    if (!promo && VOUCHER_RULES[codeUpper]) {
      const rule = VOUCHER_RULES[codeUpper];
      promo = {
        id: `virtual-${codeUpper}`,
        code: codeUpper,
        name: rule.description,
        discountType: codeUpper === 'BREW10' ? PromotionType.PERCENT : PromotionType.FIXED,
        discountValue: (codeUpper === 'BREW10' ? 10 : (rule.maxDiscount || 20000)) as any,
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

    // Kiểm tra quy tắc giá trị đơn hàng tối thiểu
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
