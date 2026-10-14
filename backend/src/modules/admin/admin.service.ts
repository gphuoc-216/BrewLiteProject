import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AccountStatus, OrderStatus, Role, ReviewStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 1. Quản lý Tài khoản & Nhân viên
  async getAccounts() {
    return this.prisma.account.findMany({
      include: { customer: true, staff: true, admin: true },
      orderBy: { createdAt: 'desc' },
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
    await this.prisma.account.delete({ where: { id: staff.accountId } });
    return { message: 'Đã xóa hồ sơ nhân viên thành công' };
  }

  // 2. Quản lý Sản phẩm, Biến thể, Công thức
  async createProduct(dto: { name: string; imageUrl: string; description?: string; category: string }) {
    return this.prisma.product.create({
      data: dto,
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

  async updateIngredient(id: string, dto: { name?: string; unit?: string; stockQuantity?: number }) {
    return this.prisma.ingredient.update({
      where: { id },
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
    const [totalRevenueResult, totalOrders, totalCustomers, totalProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] } },
        _sum: { totalAfterDiscount: true },
      }),
      this.prisma.order.count(),
      this.prisma.customer.count(),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);

    return {
      totalRevenue: Number(totalRevenueResult._sum.totalAfterDiscount || 0),
      totalOrders,
      totalCustomers,
      totalProducts,
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
    const revenueByDate: Record<string, number> = {};
    for (const o of orders) {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + Number(o.totalAfterDiscount);
    }

    return Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
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
      .slice(0, 5);
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
