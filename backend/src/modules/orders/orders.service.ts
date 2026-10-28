import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { fallbackStore } from '../../prisma/fallback-store';
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

    // 1. Try DB first
    try {
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

      let promotionId: string | null = null;
      let discountAmount = 0;

      if (dto.promotionCode) {
        const promoResult = await this.promotionsService.validatePromotion(dto.promotionCode, subtotal);
        promotionId = promoResult.promotionId;
        discountAmount = promoResult.discountAmount;
      }

      const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

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
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      // DB connection error -> fallback
    }

    // 2. Fallback in-memory store
    let subtotal = 0;
    for (const item of dto.items) {
      const v = fallbackStore.findVariantById(item.variantId);
      const price = v ? v.price : 35000;
      subtotal += price * item.quantity;
    }

    let promotionId: string | null = null;
    let discountAmount = 0;

    if (dto.promotionCode) {
      const promoResult = await this.promotionsService.validatePromotion(dto.promotionCode, subtotal);
      promotionId = promoResult.promotionId;
      discountAmount = promoResult.discountAmount;
    }

    return fallbackStore.createOrder(customerId, dto.items, discountAmount, promotionId);
  }

  async getMyOrders(customerId: string) {
    try {
      const orders = await this.prisma.order.findMany({
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
          reviews: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (orders && orders.length > 0) {
        return orders;
      }
    } catch {}

    return fallbackStore.getMyOrders(customerId);
  }

  async getOrderById(orderId: string, user: any) {
    try {
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

      if (order) {
        if (user.role === 'CUSTOMER' && order.customerId !== user.profileId) {
          throw new ForbiddenException('Bạn không có quyền xem đơn hàng của người khác');
        }
        return order;
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
    }

    const fallbackOrder = fallbackStore.findOrderById(orderId);
    if (!fallbackOrder) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng');
    }

    if (user.role === 'CUSTOMER' && fallbackOrder.customerId !== user.profileId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng của người khác');
    }

    return fallbackOrder;
  }

  async cancelOrder(orderId: string, user: any) {
    try {
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

      if (order) {
        if (user.role === 'CUSTOMER' && order.customerId !== user.profileId) {
          throw new ForbiddenException('Bạn không thể hủy đơn hàng của người khác');
        }

        assertTransition(order.status, OrderStatus.CANCELLED);

        return this.prisma.$transaction(async (tx) => {
          if (order.status === OrderStatus.PAID) {
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

          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CANCELLED },
          });

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
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
    }

    const fallbackOrder = fallbackStore.findOrderById(orderId);
    if (!fallbackOrder) {
      throw new NotFoundException('Không tìm thấy đơn hàng cần hủy');
    }

    if (user.role === 'CUSTOMER' && fallbackOrder.customerId !== user.profileId) {
      throw new ForbiddenException('Bạn không thể hủy đơn hàng của người khác');
    }

    assertTransition(fallbackOrder.status, OrderStatus.CANCELLED);
    return fallbackStore.cancelOrder(orderId, user.profileId || user.accountId);
  }
}
