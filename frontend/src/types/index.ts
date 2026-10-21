export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'LOCKED';
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  loyaltyPoints?: number;
}

export interface ProductVariant {
  id: string;
  size: 'S' | 'M' | 'L' | string;
  price: number;
  topping?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'COFFEE' | 'TEA' | 'FREEZE' | string;
  imageUrl: string;
  description?: string;
  minPrice: number;
  rating?: number;
  reviewCount?: number;
  variants: ProductVariant[];
  reviews?: Array<{
    id: string;
    stars: number;
    content: string;
    createdAt: string;
    customer: { fullName: string };
  }>;
}

export interface OrderItemRecord {
  id: number;
  orderId: string;
  variantId: string;
  quantity: number;
  lineTotal: number;
  variant?: {
    id: string;
    size: string;
    price: number;
    topping?: string;
    product?: {
      id: string;
      name: string;
      imageUrl: string;
    };
  };
}

export interface OrderRecord {
  id: string;
  customerId: string;
  staffId?: string;
  promotionId?: string;
  status: OrderStatus;
  discountAmount: number;
  totalAfterDiscount: number;
  createdAt: string;
  updatedAt?: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
  };
  staff?: {
    id: string;
    fullName: string;
  };
  items?: OrderItemRecord[];
  promotion?: {
    code: string;
    name: string;
    discountValue: number;
  };
  reviews?: ReviewRecord[];
}

export interface IngredientRecord {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  warningThreshold?: number;
  version?: number;
}

export interface ReviewRecord {
  id: string;
  customerId: string;
  productId: string;
  orderId: string;
  stars: number;
  content: string;
  status: 'VISIBLE' | 'HIDDEN';
  createdAt: string;
  customer?: { fullName: string };
  product?: { name: string };
}

export interface PromotionRecord {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  quantity: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
}

export interface SupplierRecord {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt?: string;
}

export interface AccountRecord {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: Role;
  status: AccountStatus;
  createdAt?: string;
}

export interface RevenuePoint {
  date: string;
  amount: number;
}

export interface TopProduct {
  name: string;
  totalSold: number;
  revenue: number;
}

export interface AdminOverview {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  lowStockIngredients: number;
}

