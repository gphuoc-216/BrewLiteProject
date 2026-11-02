export interface QuickVoucher {
  code: string;
  label: string;
  minOrder: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  badge: string;
  description: string;
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
  },
  {
    code: 'HAPPYHOUR',
    label: 'Giảm 15K (Đơn từ 40K)',
    minOrder: 40000,
    discountType: 'FIXED',
    discountValue: 15000,
    badge: 'Giờ Vàng 15K',
    description: 'Ưu đãi khung giờ vàng tại quán (14h - 17h)',
  },
  {
    code: 'FREESHIP',
    label: 'Freeship 15K (Đơn từ 45K)',
    minOrder: 45000,
    discountType: 'FIXED',
    discountValue: 15000,
    badge: 'Phục Vụ 15K',
    description: 'Miễn phí phục vụ tận bàn & giao nhanh nội khu',
  },
  {
    code: 'GIAM20K',
    label: 'Giảm 20K (Đơn từ 60K)',
    minOrder: 60000,
    discountType: 'FIXED',
    discountValue: 20000,
    badge: 'Khách Quen 20K',
    description: 'Tri ân khách quen thân thiết tại quán',
  },
  {
    code: 'GIAM30K',
    label: 'Giảm 30K (Đơn từ 80K)',
    minOrder: 80000,
    discountType: 'FIXED',
    discountValue: 30000,
    badge: 'Combo 30K',
    description: 'Combo nạp năng lượng sảng khoái',
  },
  {
    code: 'COFFEEVIP',
    label: 'Giảm 30K (Đơn từ 100K)',
    minOrder: 100000,
    discountType: 'FIXED',
    discountValue: 30000,
    badge: 'Tiệc Nhóm 30K',
    description: 'Tiệc cà phê nhóm đồng nghiệp & bạn bè',
  },
  {
    code: 'BREWVIP',
    label: 'Giảm 50K (Đơn từ 120K)',
    minOrder: 120000,
    discountType: 'FIXED',
    discountValue: 50000,
    badge: 'BrewVIP 50K',
    description: 'Đại tiệc nhóm lớn khách hàng thân thiết BrewVIP',
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

