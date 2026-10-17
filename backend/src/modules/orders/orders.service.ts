import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { assertTransition } from './order-state-machine';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private promotionsService: PromotionsService,
  ) {}

  async createOrder(customerId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không có sản phẩm nào để đặt');
    }

    // 1. Kiểm tra các biến thể sản phẩm tồn tại và tính thành tiền
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('Một số sản phẩm/biến thể trong giỏ hàng không còn tồn tại');
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    let subtotal = 0;

    const orderItemsData = dto.items.map((item) => {
      const variant = variantMap.get(item.variantId)!;
      const unitPrice = Number(variant.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        lineTotal,
      };
    });

    // 2. Xử lý mã khuyến mãi nếu có
    let promotionId: string | null = null;
    let discountAmount = 0;

    if (dto.promotionCode) {
      const promoResult = await this.promotionsService.validatePromotion(dto.promotionCode, subtotal);
      promotionId = promoResult.promotionId;
      discountAmount = promoResult.discountAmount;
    }

    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

    // 3. Khởi tạo đơn hàng ở trạng thái PENDING trong 1 Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId,
          promotionId,
          status: OrderStatus.PENDING,
          discountAmount,
          totalAfterDiscount,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      // Ghi lịch sử trạng thái ban đầu
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PENDING,
          note: 'Khởi tạo đơn hàng thành công, chờ thanh toán',
        },
      });

      return newOrder;
    });

    return order;
  }

  async getMyOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        payments: true,
        promotion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                recipes: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
        payments: true,
        promotion: true,
        statusHistories: {
          orderBy: { createdAt: 'asc' },
        },
        staff: true,
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng');
    }

    // Bảo mật: Nếu là Customer thì chỉ được xem đơn của chính mình
    if (user.role === 'CUSTOMER' && order.customerId !== user.profileId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng của người khác');
    }

    return order;
  }

  async cancelOrder(orderId: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                recipes: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng cần hủy');
    }

    // Kiểm tra quyền hủy
    if (user.role === 'CUSTOMER' && order.customerId !== user.profileId) {
      throw new ForbiddenException('Bạn không thể hủy đơn hàng của người khác');
    }

    // Kiểm tra tính hợp lệ qua State Machine: Chỉ được hủy khi PENDING hoặc PAID
    assertTransition(order.status, OrderStatus.CANCELLED);

    return this.prisma.$transaction(async (tx) => {
      // Nếu đơn đã PAID mà hủy (trước khi Barista pha chế):
      if (order.status === OrderStatus.PAID) {
        // 1. Hoàn tồn kho nguyên liệu (HoanSoLuong)
        for (const item of order.items) {
          for (const recipe of item.variant.recipes) {
            const returnQty = Number(recipe.quantityRequired) * item.quantity;
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: {
                stockQuantity: {
                  increment: returnQty,
                },
              },
            });
          }
        }

        // 2. Trừ lại điểm thưởng loyalty đã cộng
        const loyaltyPointsToRefund = Math.floor(Number(order.totalAfterDiscount) / 10000);
        if (loyaltyPointsToRefund > 0) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: {
              loyaltyPoints: {
                decrement: loyaltyPointsToRefund,
              },
            },
          });
        }

        // 3. Hoàn lại lượt mã khuyến mãi nếu có áp dụng
        if (order.promotionId) {
          await tx.promotion.update({
            where: { id: order.promotionId },
            data: {
              usedCount: {
                decrement: 1,
              },
            },
          });
        }
      }

      // Cập nhật trạng thái CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      // Ghi log chuyển trạng thái
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          actorId: user.profileId || user.accountId,
          note: `Khách hàng/Quản trị viên hủy đơn. ${order.status === OrderStatus.PAID ? 'Đã hoàn kho nguyên liệu và điểm thưởng thành công.' : ''}`,
        },
      });

      return updatedOrder;
    });
  }
}
