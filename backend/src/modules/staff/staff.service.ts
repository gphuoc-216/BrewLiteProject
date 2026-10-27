import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { assertTransition } from '../orders/order-state-machine';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async getOrdersForBarista(status?: OrderStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = {
        in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY],
      };
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true },
        },
        staff: {
          select: { id: true, fullName: true },
        },
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
      },
      orderBy: { createdAt: 'asc' }, // Đơn vào trước làm trước (FIFO)
    });
  }

  async acceptOrder(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    try {
      assertTransition(order.status, OrderStatus.PREPARING);
    } catch (err) {
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.PREPARING,
          actorId: staffId,
          note: `⛔ [CẢNH BÁO CHẶN GIAN LẬN] Chuyển đổi trạng thái từ '${order.status}' sang 'PREPARING' bị từ chối: ${(err as Error).message}`,
        },
      });
      throw err;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PREPARING,
          staffId,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.PREPARING,
          actorId: staffId,
          note: 'Barista đã tiếp nhận đơn và bắt đầu pha chế đồ uống',
        },
      });

      return updated;
    });
  }

  async markReady(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    try {
      assertTransition(order.status, OrderStatus.READY);
    } catch (err) {
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.READY,
          actorId: staffId,
          note: `⛔ [CẢNH BÁO CHẶN GIAN LẬN] Chuyển đổi trạng thái từ '${order.status}' sang 'READY' bị từ chối: ${(err as Error).message}`,
        },
      });
      throw err;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.READY },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.READY,
          actorId: staffId,
          note: 'Đồ uống đã pha chế xong, sẵn sàng mời khách tới nhận',
        },
      });

      return updated;
    });
  }

  async completeOrder(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    try {
      assertTransition(order.status, OrderStatus.COMPLETED);
    } catch (err) {
      // Ghi nhật ký kiểm toán (Audit Log) lưu vết hành vi cố tình vi phạm State Machine để làm minh chứng
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.COMPLETED,
          actorId: staffId,
          note: `⛔ [CẢNH BÁO CHẶN GIAN LẬN] Cố tình nhảy cóc từ '${order.status}' sang 'COMPLETED' đã bị hệ thống chặn đứng (HTTP 409 Conflict)`,
        },
      });
      throw err;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.COMPLETED,
          actorId: staffId,
          note: 'Đã bàn giao đồ uống thành công cho khách hàng',
        },
      });

      return updated;
    });
  }

  async getOrderRecipes(orderId: string) {
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
      },
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }
}
