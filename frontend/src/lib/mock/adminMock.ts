import {
  AdminOverview,
  RevenuePoint,
  TopProduct,
  IngredientRecord,
  SupplierRecord,
  ReviewRecord,
  PromotionRecord,
  AccountRecord,
} from '@/types';

export const MOCK_ADMIN_OVERVIEW: AdminOverview = {
  totalRevenue: 12500000,
  totalOrders: 142,
  activeCustomers: 89,
  lowStockIngredients: 2,
};

export const MOCK_REVENUE_POINTS: RevenuePoint[] = [
  { date: '12/10', amount: 1800000 },
  { date: '13/10', amount: 2400000 },
  { date: '14/10', amount: 1950000 },
  { date: '15/10', amount: 3100000 },
  { date: '16/10', amount: 2800000 },
  { date: '17/10', amount: 3500000 },
  { date: '18/10', amount: 4200000 },
];

export const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { name: 'Cà phê Sữa Đá', totalSold: 94, revenue: 2726000 },
  { name: 'Trà Sữa Ô Long', totalSold: 76, revenue: 3192000 },
  { name: 'Bạc Xỉu Sữa Tươi', totalSold: 58, revenue: 2030000 },
  { name: 'Trà Đào Cam Sả', totalSold: 52, revenue: 2028000 },
];

export const MOCK_INGREDIENTS: IngredientRecord[] = [
  { id: 'ing-1', name: 'Hạt cà phê Robusta', unit: 'g', stockQuantity: 42000, warningThreshold: 15000 },
  { id: 'ing-2', name: 'Hạt cà phê Arabica', unit: 'g', stockQuantity: 12500, warningThreshold: 15000 },
  { id: 'ing-3', name: 'Sữa tươi thanh trùng', unit: 'ml', stockQuantity: 28000, warningThreshold: 10000 },
  { id: 'ing-4', name: 'Đào miếng giòn', unit: 'g', stockQuantity: 8500, warningThreshold: 10000 },
];

export const MOCK_SUPPLIERS: SupplierRecord[] = [
  { id: 'sup-1', name: 'Nông Sản Cà Phê Buôn Ma Thuột', phone: '0901234567' },
  { id: 'sup-2', name: 'Công ty Sữa & Topping Việt', phone: '0912345678' },
];

export const MOCK_REVIEWS: ReviewRecord[] = [
  { id: 'rev-1', customerId: 'cust-1', productId: 'p-1', orderId: 'ord-1', customer: { fullName: 'Minh Khách' }, product: { name: 'Cà phê Sữa Đá' }, stars: 5, content: 'Pha chế thơm ngon, vị đậm chuẩn.', status: 'VISIBLE', createdAt: '2026-03-25' },
  { id: 'rev-2', customerId: 'cust-2', productId: 'p-2', orderId: 'ord-2', customer: { fullName: 'Thuỳ Trang' }, product: { name: 'Trà Đào Cam Sả' }, stars: 4, content: 'Đào giòn, hơi ngọt một chút.', status: 'VISIBLE', createdAt: '2026-03-25' },
];

export const MOCK_PROMOTIONS: PromotionRecord[] = [
  { id: 'p-1', code: 'BREW10', name: 'Giảm 10% khách mới', discountType: 'PERCENT', discountValue: 10, quantity: 100, usedCount: 38, startDate: '2026-01-01', endDate: '2026-12-31', status: 'ACTIVE' },
  { id: 'p-2', code: 'GIAM20K', name: 'Giảm 20.000đ đơn từ 60K', discountType: 'FIXED', discountValue: 20000, quantity: 50, usedCount: 15, startDate: '2026-01-01', endDate: '2026-12-31', status: 'ACTIVE' },
];

export const MOCK_ACCOUNTS: AccountRecord[] = [
  { id: 'acc-1', username: 'barista1', fullName: 'Nguyễn Văn Pha', role: 'STAFF', status: 'ACTIVE' },
  { id: 'acc-2', username: 'barista2', fullName: 'Lê Thị Chế', role: 'STAFF', status: 'ACTIVE' },
  { id: 'acc-3', username: 'customer1', fullName: 'Hoàng Minh Khách', role: 'CUSTOMER', status: 'ACTIVE' },
  { id: 'acc-4', username: 'customer_locked', fullName: 'Đỗ Văn Khóa', role: 'CUSTOMER', status: 'LOCKED' },
];
