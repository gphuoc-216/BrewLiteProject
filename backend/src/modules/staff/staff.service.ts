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

    assertTransition(order.status, OrderStatus.PREPARING);

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

    assertTransition(order.status, OrderStatus.READY);

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

    assertTransition(order.status, OrderStatus.COMPLETED);

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
