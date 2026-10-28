import * as bcrypt from 'bcryptjs';
import { Role, AccountStatus, OrderStatus, PaymentStatus, PaymentMethod, PromotionType } from '@prisma/client';
import { SAMPLE_PRODUCTS } from '../modules/products/products.service';

export interface MockAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  status: AccountStatus;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    loyaltyPoints: number;
  };
  staff?: {
    id: string;
    fullName: string;
    email: string;
  };
  admin?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface MockOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  lineTotal: number;
  variant: {
    id: string;
    size: string;
    price: number;
    product: {
      id: string;
      name: string;
      imageUrl: string;
      category: string;
    };
  };
}

export interface MockOrder {
  id: string;
  customerId: string;
  promotionId: string | null;
  status: OrderStatus;
  discountAmount: number;
  totalAfterDiscount: number;
  createdAt: Date;
  updatedAt: Date;
  items: MockOrderItem[];
  payments: any[];
  promotion?: any;
  reviews?: any[];
  statusHistories: any[];
  customer?: {
    id: string;
    fullName: string;
    email: string;
  };
}

class FallbackStore {
  private accounts: Map<string, MockAccount> = new Map();
  private orders: Map<string, MockOrder> = new Map();
  private payments: Map<string, any> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const defaultHash = bcrypt.hashSync('123456', 10);

    // 1. Seed Customer 1
    const cust1: MockAccount = {
      id: 'acc-cust-1',
      username: 'customer1',
      passwordHash: defaultHash,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      customer: {
        id: 'cust-1',
        fullName: 'Hoàng Minh Khách',
        email: 'customer1@brewlite.vn',
        loyaltyPoints: 120,
      },
    };

    // 2. Seed Customer 2
    const cust2: MockAccount = {
      id: 'acc-cust-2',
      username: 'customer2',
      passwordHash: defaultHash,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      customer: {
        id: 'cust-2',
        fullName: 'Phạm Thu Trang',
        email: 'khach2@gmail.com',
        loyaltyPoints: 45,
      },
    };

    // 3. Seed Customer 3 (Locked)
    const cust3: MockAccount = {
      id: 'acc-cust-3',
      username: 'customer3',
      passwordHash: defaultHash,
      role: Role.CUSTOMER,
      status: AccountStatus.LOCKED,
      customer: {
        id: 'cust-3',
        fullName: 'Đỗ Văn Khóa',
        email: 'khach3@gmail.com',
        loyaltyPoints: 0,
      },
    };

    // 4. Seed Barista
    const staff1: MockAccount = {
      id: 'acc-staff-1',
      username: 'barista1',
      passwordHash: defaultHash,
      role: Role.STAFF,
      status: AccountStatus.ACTIVE,
      staff: {
        id: 'staff-1',
        fullName: 'Nguyễn Văn Pha (Barista 1)',
        email: 'barista1@brewlite.vn',
      },
    };

    // 5. Seed Admin
    const adminAcc: MockAccount = {
      id: 'acc-admin-1',
      username: 'admin',
      passwordHash: defaultHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      admin: {
        id: 'admin-1',
        fullName: 'Trần Văn Quản Trị (Admin)',
        email: 'admin@brewlite.vn',
      },
    };

    this.accounts.set(cust1.username, cust1);
    this.accounts.set(cust2.username, cust2);
    this.accounts.set(cust3.username, cust3);
    this.accounts.set(staff1.username, staff1);
    this.accounts.set(adminAcc.username, adminAcc);

    // Seed Sample Orders for customer1 so /orders/me shows data immediately
    const sampleOrder1: MockOrder = {
      id: 'ord-demo-101',
      customerId: 'cust-1',
      promotionId: 'virtual-BREW10',
      status: OrderStatus.COMPLETED,
      discountAmount: 7000,
      totalAfterDiscount: 63000,
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2),
      items: [
        {
          id: 'item-101-1',
          orderId: 'ord-demo-101',
          variantId: 'var-001-m',
          quantity: 2,
          lineTotal: 70000,
          variant: {
            id: 'var-001-m',
            size: 'M',
            price: 35000,
            product: {
              id: 'prod-001',
              name: 'Cà phê Sữa Đá Truyền Thống',
              imageUrl: SAMPLE_PRODUCTS[0]?.imageUrl || '',
              category: 'COFFEE',
            },
          },
        },
      ],
      payments: [
        {
          id: 'pay-101',
          orderId: 'ord-demo-101',
          amount: 63000,
          method: PaymentMethod.WALLET,
          status: PaymentStatus.SUCCESS,
          createdAt: new Date(Date.now() - 86400000 * 2),
        },
      ],
      promotion: {
        code: 'BREW10',
        name: 'Giảm 10% (tối đa 15K)',
      },
      statusHistories: [
        { id: 'h1', fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PENDING, note: 'Khởi tạo đơn hàng', createdAt: new Date(Date.now() - 86400000 * 2) },
        { id: 'h2', fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAID, note: 'Thanh toán thành công qua MoMo', createdAt: new Date(Date.now() - 86400000 * 2 + 60000) },
        { id: 'h3', fromStatus: OrderStatus.PAID, toStatus: OrderStatus.PREPARING, note: 'Barista đang pha chế đồ uống', createdAt: new Date(Date.now() - 86400000 * 2 + 120000) },
        { id: 'h4', fromStatus: OrderStatus.PREPARING, toStatus: OrderStatus.READY, note: 'Đồ uống đã sẵn sàng tại quầy', createdAt: new Date(Date.now() - 86400000 * 2 + 600000) },
        { id: 'h5', fromStatus: OrderStatus.READY, toStatus: OrderStatus.COMPLETED, note: 'Khách hàng đã nhận món thành công', createdAt: new Date(Date.now() - 86400000 * 2 + 900000) },
      ],
      customer: {
        id: 'cust-1',
        fullName: 'Hoàng Minh Khách',
        email: 'customer1@brewlite.vn',
      },
    };

    const sampleOrder2: MockOrder = {
      id: 'ord-demo-102',
      customerId: 'cust-1',
      promotionId: null,
      status: OrderStatus.PREPARING,
      discountAmount: 0,
      totalAfterDiscount: 42000,
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(Date.now() - 1200000),
      items: [
        {
          id: 'item-102-1',
          orderId: 'ord-demo-102',
          variantId: 'var-003-m',
          quantity: 1,
          lineTotal: 42000,
          variant: {
            id: 'var-003-m',
            size: 'M',
            price: 42000,
            product: {
              id: 'prod-003',
              name: 'Bạc Xỉu Sữa Tươi 3 Tầng',
              imageUrl: SAMPLE_PRODUCTS[2]?.imageUrl || '',
              category: 'COFFEE',
            },
          },
        },
      ],
      payments: [
        {
          id: 'pay-102',
          orderId: 'ord-demo-102',
          amount: 42000,
          method: PaymentMethod.CARD,
          status: PaymentStatus.SUCCESS,
          createdAt: new Date(Date.now() - 1700000),
        },
      ],
      statusHistories: [
        { id: 'h21', fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PENDING, note: 'Khởi tạo đơn hàng', createdAt: new Date(Date.now() - 1800000) },
        { id: 'h22', fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAID, note: 'Thanh toán quét mã VietQR MBBank thành công', createdAt: new Date(Date.now() - 1700000) },
        { id: 'h23', fromStatus: OrderStatus.PAID, toStatus: OrderStatus.PREPARING, note: 'Barista đã nhận đơn và bắt đầu pha chế', createdAt: new Date(Date.now() - 1200000) },
      ],
      customer: {
        id: 'cust-1',
        fullName: 'Hoàng Minh Khách',
        email: 'customer1@brewlite.vn',
      },
    };

    this.orders.set(sampleOrder1.id, sampleOrder1);
    this.orders.set(sampleOrder2.id, sampleOrder2);
  }

  // --- ACCOUNTS ---
  findAccountByUsername(username: string): MockAccount | undefined {
    return this.accounts.get(username);
  }

  findAccountById(id: string): MockAccount | undefined {
    for (const acc of this.accounts.values()) {
      if (acc.id === id) return acc;
    }
    return undefined;
  }

  findAccountByEmail(email: string): MockAccount | undefined {
    for (const acc of this.accounts.values()) {
      if (acc.customer?.email?.toLowerCase() === email.toLowerCase()) return acc;
      if (acc.staff?.email?.toLowerCase() === email.toLowerCase()) return acc;
      if (acc.admin?.email?.toLowerCase() === email.toLowerCase()) return acc;
    }
    return undefined;
  }

  createAccount(data: { username: string; passwordHash: string; fullName: string; email: string }): MockAccount {
    const id = `acc-${Date.now()}`;
    const custId = `cust-${Date.now()}`;
    const newAcc: MockAccount = {
      id,
      username: data.username,
      passwordHash: data.passwordHash,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      customer: {
        id: custId,
        fullName: data.fullName,
        email: data.email,
        loyaltyPoints: 0,
      },
    };
    this.accounts.set(newAcc.username, newAcc);
    return newAcc;
  }

  updatePassword(id: string, newPasswordHash: string): boolean {
    const acc = this.findAccountById(id);
    if (acc) {
      acc.passwordHash = newPasswordHash;
      return true;
    }
    return false;
  }

  addLoyaltyPoints(customerId: string, points: number) {
    for (const acc of this.accounts.values()) {
      if (acc.customer && acc.customer.id === customerId) {
        acc.customer.loyaltyPoints = Math.max(0, acc.customer.loyaltyPoints + points);
        break;
      }
    }
  }

  // --- ORDERS ---
  findVariantById(variantId: string) {
    for (const prod of SAMPLE_PRODUCTS) {
      const v = prod.variants.find((item) => item.id === variantId);
      if (v) {
        return {
          id: v.id,
          size: v.size,
          price: v.price,
          product: {
            id: prod.id,
            name: prod.name,
            imageUrl: prod.imageUrl,
            category: prod.category,
          },
        };
      }
    }
    return null;
  }

  createOrder(customerId: string, itemsData: { variantId: string; quantity: number }[], discountAmount = 0, promotionId: string | null = null): MockOrder {
    const orderId = `ord-${Date.now()}`;
    let subtotal = 0;
    const orderItems: MockOrderItem[] = [];

    for (const item of itemsData) {
      const variant = this.findVariantById(item.variantId);
      const unitPrice = variant ? variant.price : 35000;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId,
        variantId: item.variantId,
        quantity: item.quantity,
        lineTotal,
        variant: variant || {
          id: item.variantId,
          size: 'M',
          price: unitPrice,
          product: {
            id: 'prod-fallback',
            name: 'Đồ uống BrewLite',
            imageUrl: SAMPLE_PRODUCTS[0]?.imageUrl || '',
            category: 'COFFEE',
          },
        },
      });
    }

    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const order: MockOrder = {
      id: orderId,
      customerId,
      promotionId,
      status: OrderStatus.PENDING,
      discountAmount,
      totalAfterDiscount,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: orderItems,
      payments: [],
      statusHistories: [
        {
          id: `h-${Date.now()}`,
          orderId,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PENDING,
          note: 'Khởi tạo đơn hàng thành công, chờ thanh toán',
          createdAt: new Date(),
        },
      ],
    };

    this.orders.set(orderId, order);
    return order;
  }

  getMyOrders(customerId: string): MockOrder[] {
    const list: MockOrder[] = [];
    for (const order of this.orders.values()) {
      if (order.customerId === customerId) {
        list.push(order);
      }
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findOrderById(orderId: string): MockOrder | undefined {
    return this.orders.get(orderId);
  }

  cancelOrder(orderId: string, actorId: string): MockOrder | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    const prevStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();
    order.statusHistories.push({
      id: `h-${Date.now()}`,
      orderId,
      fromStatus: prevStatus,
      toStatus: OrderStatus.CANCELLED,
      actorId,
      note: 'Khách hàng/Quản trị viên hủy đơn. Đã cập nhật trạng thái hủy thành công.',
      createdAt: new Date(),
    });
    return order;
  }

  // --- PAYMENTS ---
  findPaymentByIdempotencyKey(key: string) {
    return this.payments.get(key);
  }

  processPayment(params: {
    orderId: string;
    idempotencyKey: string;
    method: PaymentMethod;
    simulateError?: 'FAIL' | 'TIMEOUT';
    actorId: string;
  }) {
    const order = this.orders.get(params.orderId);
    if (!order) return null;

    if (params.simulateError === 'FAIL' || params.simulateError === 'TIMEOUT') {
      order.status = OrderStatus.PAYMENT_FAILED;
      order.updatedAt = new Date();
      order.statusHistories.push({
        id: `h-${Date.now()}`,
        orderId: order.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.PAYMENT_FAILED,
        actorId: params.actorId,
        note: `Thanh toán thất bại: Giao dịch bị từ chối (${params.simulateError})`,
        createdAt: new Date(),
      });
      return {
        success: false,
        order,
      };
    }

    // Success payment
    const payment = {
      id: `pay-${Date.now()}`,
      orderId: order.id,
      idempotencyKey: params.idempotencyKey,
      amount: order.totalAfterDiscount,
      status: PaymentStatus.SUCCESS,
      method: params.method,
      createdAt: new Date(),
    };

    this.payments.set(params.idempotencyKey, { ...payment, order });
    order.payments.push(payment);
    const prevStatus = order.status;
    order.status = OrderStatus.PAID;
    order.updatedAt = new Date();

    const earnedPoints = Math.floor(order.totalAfterDiscount / 10000);
    if (earnedPoints > 0) {
      this.addLoyaltyPoints(order.customerId, earnedPoints);
    }

    order.statusHistories.push({
      id: `h-${Date.now()}`,
      orderId: order.id,
      fromStatus: prevStatus,
      toStatus: OrderStatus.PAID,
      actorId: params.actorId,
      note: `Thanh toán thành công ${order.totalAfterDiscount.toLocaleString('vi-VN')} VNĐ qua ${params.method}. Tích lũy +${earnedPoints} điểm thưởng.`,
      createdAt: new Date(),
    });

    return {
      success: true,
      payment,
      order,
      earnedPoints,
    };
  }
}

export const fallbackStore = new FallbackStore();
