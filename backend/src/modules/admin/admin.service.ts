import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AccountStatus, OrderStatus, Role, ReviewStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 1. Quản lý Tài khoản & Nhân viên
  async getAccounts() {
    const accounts = await this.prisma.account.findMany({
      include: { customer: true, staff: true, admin: true },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((acc) => {
      const profile = acc.customer || acc.staff || acc.admin;
      return {
        id: acc.id,
        username: acc.username,
        role: acc.role,
        status: acc.status,
        createdAt: acc.createdAt,
        fullName: profile?.fullName || acc.username,
        email: profile?.email || '',
        customer: acc.customer,
        staff: acc.staff,
        admin: acc.admin,
      };
    });
  }

  async lockAccount(id: string) {
    return this.prisma.account.update({
      where: { id },
      data: { status: AccountStatus.LOCKED },
    });
  }

  async unlockAccount(id: string) {
    return this.prisma.account.update({
      where: { id },
      data: { status: AccountStatus.ACTIVE },
    });
  }

  async getStaffList() {
    return this.prisma.staff.findMany({
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(dto: { username: string; password?: string; fullName: string; email: string }) {
    const existing = await this.prisma.account.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const passwordHash = await bcrypt.hash(dto.password || '123456', 10);
    return this.prisma.account.create({
      data: {
        username: dto.username,
        passwordHash,
        role: Role.STAFF,
        status: AccountStatus.ACTIVE,
        staff: {
          create: {
            fullName: dto.fullName,
            email: dto.email,
          },
        },
      },
      include: { staff: true },
    });
  }

  async updateStaff(id: string, dto: { fullName?: string; email?: string }) {
    return this.prisma.staff.update({
      where: { id },
      data: dto,
    });
  }

  async deleteStaff(id: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Không tìm thấy nhân viên');
    await this.deleteAccount(staff.accountId);
    return { message: 'Đã xóa hồ sơ nhân viên thành công' };
  }

  async createCustomer(dto: {
    username: string;
    password?: string;
    fullName: string;
    email: string;
    loyaltyPoints?: number;
  }) {
    const existing = await this.prisma.account.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const existingEmail = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email này đã được sử dụng');

    const passwordHash = await bcrypt.hash(dto.password || '123456', 10);
    return this.prisma.account.create({
      data: {
        username: dto.username,
        passwordHash,
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
        customer: {
          create: {
            fullName: dto.fullName,
            email: dto.email,
            loyaltyPoints: Number(dto.loyaltyPoints) || 0,
          },
        },
      },
      include: { customer: true },
    });
  }

  async updateAccount(
    id: string,
    dto: {
      fullName?: string;
      email?: string;
      password?: string;
      status?: AccountStatus;
      loyaltyPoints?: number;
    },
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { customer: true, staff: true, admin: true },
    });

    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật mật khẩu hoặc trạng thái tài khoản
      const accountUpdateData: any = {};
      if (dto.password && dto.password.trim().length >= 6) {
        accountUpdateData.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
      }
      if (dto.status) {
        accountUpdateData.status = dto.status;
      }
      if (Object.keys(accountUpdateData).length > 0) {
        await tx.account.update({
          where: { id },
          data: accountUpdateData,
        });
      }

      // 2. Cập nhật thông tin profile
      if (account.role === Role.CUSTOMER && account.customer) {
        await tx.customer.update({
          where: { id: account.customer.id },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
            ...(dto.email ? { email: dto.email.trim() } : {}),
            ...(dto.loyaltyPoints !== undefined ? { loyaltyPoints: Number(dto.loyaltyPoints) } : {}),
          },
        });
      } else if (account.role === Role.STAFF && account.staff) {
        await tx.staff.update({
          where: { id: account.staff.id },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
            ...(dto.email ? { email: dto.email.trim() } : {}),
          },
        });
      } else if (account.role === Role.ADMIN && account.admin) {
        await tx.admin.update({
          where: { id: account.admin.id },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
            ...(dto.email ? { email: dto.email.trim() } : {}),
          },
        });
      }

      return tx.account.findUnique({
        where: { id },
        include: { customer: true, staff: true, admin: true },
      });
    });
  }

  async deleteAccount(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        customer: { include: { orders: true } },
        staff: { include: { orders: true } },
      },
    });

    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');
    if (account.role === Role.ADMIN) {
      throw new BadRequestException('Không thể xóa tài khoản Quản trị viên tối cao');
    }

    return this.prisma.$transaction(async (tx) => {
      if (account.customer) {
        await tx.review.deleteMany({ where: { customerId: account.customer.id } });
        if (account.customer.orders.length > 0) {
          const orderIds = account.customer.orders.map((o) => o.id);
          await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        await tx.customer.delete({ where: { id: account.customer.id } });
      }

      if (account.staff) {
        await tx.order.updateMany({
          where: { staffId: account.staff.id },
          data: { staffId: null },
        });
        await tx.staff.delete({ where: { id: account.staff.id } });
      }

      await tx.account.delete({ where: { id } });
      return { message: 'Đã xóa tài khoản thành công' };
    });
  }

  // 2. Quản lý Sản phẩm, Biến thể, Công thức
  async createProduct(dto: {
    name: string;
    imageUrl: string;
    description?: string;
    category: string;
    basePrice?: number;
    variants?: Array<{ size: string; price: number; topping?: string }>;
    recipes?: Array<{ ingredientId: string; quantityRequired: number; size?: string }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          imageUrl: dto.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
          description: dto.description || '',
          category: dto.category || 'COFFEE',
        },
      });

      const variantsToCreate: Array<{ productId: string; size: string; price: number; topping?: string }> = [];
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          variantsToCreate.push({
            productId: product.id,
            size: v.size,
            price: Number(v.price),
            topping: v.topping || 'Tiêu chuẩn',
          });
        }
      } else {
        const base = Number(dto.basePrice) || 35000;
        variantsToCreate.push(
          { productId: product.id, size: 'S', price: base, topping: 'Tiêu chuẩn' },
          { productId: product.id, size: 'M', price: base + 6000, topping: 'Tiêu chuẩn' },
          { productId: product.id, size: 'L', price: base + 12000, topping: 'Tiêu chuẩn' },
        );
      }

      await tx.productVariant.createMany({
        data: variantsToCreate,
      });

      // Tạo công thức nguyên liệu ban đầu nếu được cung cấp
      if (dto.recipes && Array.isArray(dto.recipes) && dto.recipes.length > 0) {
        const createdVariants = await tx.productVariant.findMany({
          where: { productId: product.id },
        });

        for (const item of dto.recipes) {
          if (!item.ingredientId || !item.quantityRequired || Number(item.quantityRequired) <= 0) continue;
          const baseQty = Number(item.quantityRequired);

          for (const variant of createdVariants) {
            if (item.size && item.size !== 'ALL' && variant.size !== item.size) continue;

            let qty = baseQty;
            if (!item.size || item.size === 'ALL') {
              if (variant.size === 'M') qty = Math.round(baseQty * 1.3);
              else if (variant.size === 'L') qty = Math.round(baseQty * 1.6);
            }

            try {
              await tx.recipe.create({
                data: {
                  variantId: variant.id,
                  ingredientId: item.ingredientId,
                  quantityRequired: qty,
                },
              });
            } catch {
              // Bỏ qua nếu đã tồn tại bản ghi công thức
            }
          }
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { variants: true },
      });
    });
  }

  async updateProduct(id: string, dto: any) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createVariant(dto: { productId: string; size: string; price: number; topping?: string }) {
    return this.prisma.productVariant.create({
      data: {
        productId: dto.productId,
        size: dto.size,
        price: dto.price,
        topping: dto.topping,
      },
    });
  }

  async updateVariant(id: string, dto: { price?: number; topping?: string }) {
    return this.prisma.productVariant.update({
      where: { id },
      data: dto,
    });
  }

  async deleteVariant(id: string) {
    return this.prisma.productVariant.delete({ where: { id } });
  }

  async getRecipes(productId?: string) {
    return this.prisma.recipe.findMany({
      where: productId ? { variant: { productId } } : {},
      include: {
        variant: {
          include: { product: true },
        },
        ingredient: true,
      },
    });
  }

  async createRecipe(dto: { variantId: string; ingredientId: string; quantityRequired: number }) {
    return this.prisma.recipe.create({
      data: dto,
    });
  }

  async updateRecipe(id: string, quantityRequired: number) {
    return this.prisma.recipe.update({
      where: { id },
      data: { quantityRequired },
    });
  }

  async deleteRecipe(id: string) {
    return this.prisma.recipe.delete({ where: { id } });
  }

  // 3. Quản lý Khuyến mãi
  async getPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPromotion(dto: any) {
    return this.prisma.promotion.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async updatePromotion(id: string, dto: any) {
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
      },
    });
  }

  async deletePromotion(id: string) {
    return this.prisma.promotion.delete({ where: { id } });
  }

  // 4. Quản lý Kho & Nhà cung cấp
  async getIngredients() {
    return this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createIngredient(dto: { name: string; unit: string; stockQuantity: number }) {
    return this.prisma.ingredient.create({
      data: { ...dto, version: 1 },
    });
  }

  async updateIngredient(identifier: string, dto: { name?: string; unit?: string; stockQuantity?: number }) {
    let ing = null;
    const cleanId = (identifier || '').trim();

    // 1. Nếu là chuỗi UUID hợp lệ, tìm theo ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUuid) {
      ing = await this.prisma.ingredient.findUnique({ where: { id: cleanId } }).catch(() => null);
    }

    // 2. Nếu không phải UUID hoặc không tìm thấy, tự động tìm theo TÊN nguyên liệu (không phân biệt hoa thường)
    if (!ing) {
      ing = await this.prisma.ingredient.findFirst({
        where: {
          name: {
            contains: cleanId,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!ing) {
      throw new NotFoundException(`Không tìm thấy nguyên liệu có mã hoặc tên chứa '${cleanId}'`);
    }

    return this.prisma.ingredient.update({
      where: { id: ing.id },
      data: dto,
    });
  }

  async deleteIngredient(id: string) {
    return this.prisma.ingredient.delete({ where: { id } });
  }

  async getSuppliers() {
    return this.prisma.supplier.findMany({
      include: { importReceipts: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSupplier(dto: { name: string; phone: string; address: string }) {
    return this.prisma.supplier.create({ data: dto });
  }

  async getImportReceipts() {
    return this.prisma.importReceipt.findMany({
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
      orderBy: { importDate: 'desc' },
    });
  }

  async createImportReceipt(dto: {
    supplierId: string;
    items: Array<{ ingredientId: string; quantity: number; unitPrice: number }>;
  }) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Phiếu nhập phải có ít nhất 1 mặt hàng');
    }

    let totalAmount = 0;
    const itemsData = dto.items.map((i) => {
      const lineTotal = i.quantity * i.unitPrice;
      totalAmount += lineTotal;
      return {
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal,
      };
    });

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.importReceipt.create({
        data: {
          supplierId: dto.supplierId,
          totalAmount,
          items: {
            create: itemsData,
          },
        },
      });

      // Tự động cộng dồn tồn kho nguyên liệu
      for (const item of dto.items) {
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }

      return receipt;
    });
  }

  // 5. Kiểm duyệt Đánh giá
  async getAllReviews() {
    return this.prisma.review.findMany({
      include: {
        customer: true,
        product: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async hideReview(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { status: ReviewStatus.HIDDEN },
    });
  }

  async showReview(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { status: ReviewStatus.VISIBLE },
    });
  }

  // 6. Thống kê & Báo cáo
  async getOverview() {
    const [totalRevenueResult, totalOrders, totalCustomers, totalProducts, lowStockIngredients] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] } },
        _sum: { totalAfterDiscount: true },
      }),
      this.prisma.order.count(),
      this.prisma.customer.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.ingredient.count({ where: { stockQuantity: { lte: 2000 } } }),
    ]);

    return {
      totalRevenue: Number(totalRevenueResult._sum.totalAfterDiscount || 0),
      totalOrders,
      totalCustomers,
      activeCustomers: totalCustomers,
      totalProducts,
      lowStockIngredients,
    };
  }

  async getRevenueStats() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] } },
      select: {
        totalAfterDiscount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Gom nhóm theo ngày
    const revenueByDate: Record<string, { revenue: number; orderCount: number }> = {};
    for (const o of orders) {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (!revenueByDate[dateStr]) {
        revenueByDate[dateStr] = { revenue: 0, orderCount: 0 };
      }
      revenueByDate[dateStr].revenue += Number(o.totalAfterDiscount);
      revenueByDate[dateStr].orderCount += 1;
    }

    return Object.entries(revenueByDate).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      amount: val.revenue,
      orderCount: val.orderCount,
    }));
  }

  async getTopProducts() {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] },
        },
      },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const item of orderItems) {
      const prodId = item.variant.productId;
      const prodName = item.variant.product.name;
      if (!productSales[prodId]) {
        productSales[prodId] = { name: prodName, quantity: 0, revenue: 0 };
      }
      productSales[prodId].quantity += item.quantity;
      productSales[prodId].revenue += Number(item.lineTotal);
    }

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        totalSold: p.quantity,
      }));
  }

  async getOrdersByStatus() {
    const counts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return counts.map((c) => ({
      status: c.status,
      count: c._count.id,
    }));
  }
}
