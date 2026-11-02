export type VoucherCategory = 'ORDER_DISCOUNT' | 'HAPPY_HOUR' | 'SERVICE';

export interface QuickVoucher {
  code: string;
  label: string;
  minOrder: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  badge: string;                            
  description: string;
  category: VoucherCategory;
  isStackable: boolean; // true = được cộng dồn thêm (Giờ vàng, Freeship); false = voucher đơn hàng (chỉ chọn 1)
}

export const SHOP_VOUCHERS: QuickVoucher[] = [
  {
    code: 'BANMOI',
    label: 'Giảm 15K (Đơn từ 35K)',
    minOrder: 35000,
    discountType: 'FIXED',
    discountValue: 15000,
    badge: 'Bạn Mới 15K',
    description: 'Ưu đãi chào bạn mới tại quán BrewLite',
    category: 'ORDER_DISCOUNT',
    isStackable: false,
  },
  {
    code: 'BREW10',
    label: 'Giảm 10% (Tối đa 15K)',
    minOrder: 30000,
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscount: 15000,
    badge: 'Giảm 10%',
    description: 'Giảm 10% cho đồ uống chuẩn vị BrewLite',
    category: 'ORDER_DISCOUNT',
    isStackable: false,
  },
  {
    code: 'HAPPYHOUR',
    label: 'Giờ Vàng Giảm 15K (Đơn từ 40K)',
    minOrder: 40000,
    discountType: 'FIXED',
    discountValue: 15000,
    badge: 'Giờ Vàng 15K (Cộng dồn)',
    description: 'Ưu đãi khung giờ vàng tại quán (14h - 17h) - Được phép cộng dồn',
    category: 'HAPPY_HOUR',
    isStackable: true,
  },
  {
    code: 'FREESHIP',
    label: 'Freeship 15K (Đơn từ 45K)',
    minOrder: 45000,
    discountType: 'FIXED',
    discountValue: 15000,
    badge: 'Freeship 15K (Cộng dồn)',
    description: 'Miễn phí phục vụ tận bàn & giao nhanh nội khu - Được phép cộng dồn',
    category: 'SERVICE',
    isStackable: true,
  },
  {
    code: 'GIAM20K',
    label: 'Giảm 20K (Đơn từ 60K)',
    minOrder: 60000,
    discountType: 'FIXED',
    discountValue: 20000,
    badge: 'Khách Quen 20K',
    description: 'Tri ân khách quen thân thiết tại quán',
    category: 'ORDER_DISCOUNT',
    isStackable: false,
  },
  {
    code: 'GIAM30K',
    label: 'Giảm 30K (Đơn từ 80K)',
    minOrder: 80000,
    discountType: 'FIXED',
    discountValue: 30000,
    badge: 'Combo 30K',
    description: 'Combo nạp năng lượng sảng khoái',
    category: 'ORDER_DISCOUNT',
    isStackable: false,
  },
  {
    code: 'COFFEEVIP',
    label: 'Giảm 30K (Đơn từ 100K)',
    minOrder: 100000,
    discountType: 'FIXED',
    discountValue: 30000,
    badge: 'Tiệc Nhóm 30K',
    description: 'Tiệc cà phê nhóm đồng nghiệp & bạn bè',
    category: 'ORDER_DISCOUNT',
    isStackable: false,
  },
  {
    code: 'BREWVIP',
    label: 'Giảm 50K (Đơn từ 120K)',
    minOrder: 120000,
    discountType: 'FIXED',
    discountValue: 50000,
    badge: 'BrewVIP 50K',
    description: 'Đại tiệc nhóm lớn khách hàng thân thiết BrewVIP',
    category: 'ORDER_DISCOUNT',
    isStackable: false,
  },
];

export function calculateSingleVoucherDiscount(voucher: QuickVoucher, orderSubtotal: number): number {
  if (orderSubtotal < voucher.minOrder) return 0;
  if (voucher.discountType === 'PERCENT') {
    const raw = Math.round((orderSubtotal * voucher.discountValue) / 100);
    return voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
  }
  return Math.min(voucher.discountValue, orderSubtotal);
}

export function calcDiscountForVoucherList(
  voucherList: QuickVoucher[],
  selectedCodes: string[],
  subtotal: number
): { totalDiscount: number; breakdown: { code: string; name: string; amount: number }[] } {
  let remaining = subtotal;
  let totalDiscount = 0;
  const breakdown: { code: string; name: string; amount: number }[] = [];

  for (const code of selectedCodes) {
    if (remaining <= 0) break;
    const v = voucherList.find((item) => item.code.toUpperCase() === code.toUpperCase());
    if (!v) continue;
    if (subtotal < v.minOrder) continue;

    let discount = 0;
    if (v.discountType === 'PERCENT') {
      const raw = Math.round((subtotal * v.discountValue) / 100);
      discount = v.maxDiscount ? Math.min(raw, v.maxDiscount) : raw;
    } else {
      discount = v.discountValue;
    }

    const appliedAmount = Math.min(discount, remaining);
    if (appliedAmount > 0) {
      totalDiscount += appliedAmount;
      remaining -= appliedAmount;
      breakdown.push({
        code: v.code,
        name: v.label,
        amount: appliedAmount,
      });
    }
  }

  return { totalDiscount, breakdown };
}

/**
 * Quy tắc áp dụng đa voucher nghiêm ngặt:
 * 1. Khi đơn hàng đã về 0đ -> Khóa toàn bộ các voucher khác, không cho chọn thêm.
 * 2. Voucher Đơn Hàng (ORDER_DISCOUNT): Chỉ được chọn tối đa 1 mã. Nếu chọn mã mới sẽ thay thế mã cũ.
 * 3. Voucher Khung Giờ Vàng (HAPPY_HOUR) & Freeship (SERVICE): Được phép cộng dồn thêm cùng mã đơn hàng nếu đơn chưa về 0đ.
 */
export function toggleSmartVoucherSelection(
  currentCodes: string[],
  targetVoucher: QuickVoucher,
  subtotal: number
): { nextCodes: string[]; error?: string } {
  const isCurrentlySelected = currentCodes.some(
    (c) => c.toUpperCase() === targetVoucher.code.toUpperCase()
  );

  // Nếu đang chọn mà bấm lại -> Gỡ mã
  if (isCurrentlySelected) {
    return {
      nextCodes: currentCodes.filter(
        (c) => c.toUpperCase() !== targetVoucher.code.toUpperCase()
      ),
    };
  }

  // Kiểm tra điều kiện đơn tối thiểu
  if (subtotal < targetVoucher.minOrder) {
    const missing = targetVoucher.minOrder - subtotal;
    return {
      nextCodes: currentCodes,
      error: `Đơn cần tối thiểu ${targetVoucher.minOrder.toLocaleString('vi-VN')}đ để áp dụng mã "${targetVoucher.code}" (còn thiếu ${missing.toLocaleString('vi-VN')}đ).`,
    };
  }

  // Kiểm tra nếu đơn hàng đã được giảm tối đa 0đ
  const { totalDiscount } = calcDiscountForVoucherList(SHOP_VOUCHERS, currentCodes, subtotal);
  if (subtotal - totalDiscount <= 0) {
    return {
      nextCodes: currentCodes,
      error: 'Đơn hàng đã được khấu trừ 100% (0đ), không thể chọn thêm voucher khác.',
    };
  }

  // Nếu voucher là ORDER_DISCOUNT (không cộng dồn với ORDER_DISCOUNT khác)
  if (!targetVoucher.isStackable) {
    // Lọc bỏ voucher ORDER_DISCOUNT cũ (nếu có) và thay bằng voucher mới
    const filtered = currentCodes.filter((code) => {
      const existing = SHOP_VOUCHERS.find((v) => v.code.toUpperCase() === code.toUpperCase());
      return existing?.isStackable; // Chỉ giữ lại các voucher stackable (giờ vàng, freeship)
    });
    return {
      nextCodes: [...filtered, targetVoucher.code],
    };
  }

  // Nếu là voucher stackable (giờ vàng, freeship) -> Thêm vào danh sách
  return {
    nextCodes: [...currentCodes, targetVoucher.code],
  };
}

