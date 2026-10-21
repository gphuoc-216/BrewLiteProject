import { Injectable, BadRequestException, ConflictException, UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockGatewayService } from './mock-gateway/mock-gateway.service';
import { assertTransition } from '../orders/order-state-machine';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export class ProcessPaymentDto {
  orderId: string;
  method: PaymentMethod;
  simulateError?: 'FAIL' | 'TIMEOUT';
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private mockGateway: MockGatewayService,
  ) {}

  async processPayment(dto: ProcessPaymentDto, idempotencyKey: string, user: any) {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException('Bắt buộc phải có header Idempotency-Key để thực hiện thanh toán');
    }

    // 1. Kiểm tra Idempotency-Key chống trùng lặp giao dịch
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: idempotencyKey.trim() },
      include: { order: true },
    });

    if (existingPayment) {
      if (existingPayment.orderId === dto.orderId) {
        // Cùng key + cùng orderId -> Trả lại kết quả cũ đã xử lý
        return {
          cached: true,
          message: 'Giao dịch đã được xử lý trước đó (Idempotent replay)',
          payment: existingPayment,
          order: existingPayment.order,
        };
      } else {
        // Cùng key nhưng khác orderId -> 422 Unprocessable Entity
        throw new UnprocessableEntityException(
          'Idempotency-Key đã được sử dụng cho một đơn hàng khác. Vui lòng sinh key mới.',
        );
      }
    }

    // 2. Kiểm tra đơn hàng cần thanh toán
    if (!dto.orderId || typeof dto.orderId !== 'string') {
      throw new BadRequestException('Mã đơn hàng (orderId) không được để trống hoặc không hợp lệ');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                recipes: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
        promotion: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng');
    }

    // Kiểm tra quyền hạn: Customer chỉ được thanh toán đơn của chính mình
    if (user.role === 'CUSTOMER' && order.customerId !== user.profileId) {
      throw new BadRequestException('Bạn không thể thanh toán đơn hàng của khách hàng khác');
    }

    // Kiểm tra máy trạng thái đơn hàng (chỉ cho phép từ PENDING hoặc PAYMENT_FAILED sang PAID)
    assertTransition(order.status, OrderStatus.PAID);

    // 3. Tính toán tổng định lượng nguyên liệu cần thiết cho toàn bộ đơn hàng
    const ingredientRequirements = new Map<string, { qty: number; name: string }>();

    for (const item of order.items) {
      for (const recipe of item.variant.recipes) {
        const ingId = recipe.ingredientId;
        const required = Number(recipe.quantityRequired) * item.quantity;
        const current = ingredientRequirements.get(ingId) || { qty: 0, name: recipe.ingredient.name };
        current.qty += required;
        ingredientRequirements.set(ingId, current);
      }
    }

    // 4. Xử lý trong Database Transaction với Optimistic Locking
    return this.prisma.$transaction(async (tx) => {
      // 4.1 Khấu trừ tồn kho nguyên liệu bằng Optimistic Locking kèm Retry (tối đa 3 lần)
      for (const [ingredientId, requirement] of ingredientRequirements.entries()) {
        let updateSuccess = false;
        let lastErrorMsg = '';

        for (let attempt = 0; attempt < 3; attempt++) {
          const ingredient = await tx.ingredient.findUnique({
            where: { id: ingredientId },
          });

          if (!ingredient || Number(ingredient.stockQuantity) < requirement.qty) {
            throw new ConflictException(
              `Nguyên liệu "${requirement.name}" đã hết hoặc không đủ tồn kho (Còn lại: ${ingredient?.stockQuantity || 0}, Cần: ${requirement.qty}). Giao dịch bị hủy.`,
            );
          }

          // Cập nhật với điều kiện phiên bản (Optimistic Locking)
          const result = await tx.ingredient.updateMany({
            where: {
              id: ingredientId,
              version: ingredient.version,
              stockQuantity: { gte: requirement.qty },
            },
            data: {
              stockQuantity: { decrement: requirement.qty },
              version: { increment: 1 },
            },
          });

          if (result.count > 0) {
            updateSuccess = true;
            break;
          }

          lastErrorMsg = `Xung đột phiên bản nguyên liệu "${requirement.name}" ở lần thử thứ ${attempt + 1}`;
        }

        if (!updateSuccess) {
          throw new ConflictException(
            `Hệ thống đang có nhiều khách hàng đặt món đồng thời (${lastErrorMsg}). Vui lòng bấm thanh toán lại.`,
          );
        }
      }

      // 4.2 Gọi Mock Payment Gateway
      const chargeResult = await this.mockGateway.processCharge({
        amount: Number(order.totalAfterDiscount),
        method: dto.method,
        simulateError: dto.simulateError,
      });

      if (!chargeResult.success) {
        // Cập nhật trạng thái đơn thành PAYMENT_FAILED
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAYMENT_FAILED },
        });

        // Ghi lịch sử lỗi thanh toán
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: OrderStatus.PAYMENT_FAILED,
            actorId: user.profileId,
            note: `Thanh toán thất bại: ${chargeResult.message}`,
          },
        });

        // Ném lỗi để rollback việc trừ kho nguyên liệu
        throw new BadRequestException(`Cổng thanh toán từ chối: ${chargeResult.message}`);
      }

      // 4.3 Tạo bản ghi GiaoDichThanhToan (Payment)
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: idempotencyKey.trim(),
          amount: order.totalAfterDiscount,
          status: PaymentStatus.SUCCESS,
          method: dto.method,
        },
      });

      // 4.4 Cập nhật đơn hàng sang PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      // 4.5 Tăng usedCount của mã khuyến mãi (nếu có)
      if (order.promotionId) {
        await tx.promotion.update({
          where: { id: order.promotionId },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      // 4.6 Tích lũy điểm thưởng cho khách hàng (1 điểm / 10.000 VNĐ)
      const earnedPoints = Math.floor(Number(order.totalAfterDiscount) / 10000);
      if (earnedPoints > 0) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            loyaltyPoints: { increment: earnedPoints },
          },
        });
      }

      // 4.7 Ghi lịch sử chuyển trạng thái đơn hàng
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.PAID,
          actorId: user.profileId,
          note: `Thanh toán thành công ${Number(order.totalAfterDiscount).toLocaleString('vi-VN')} VNĐ qua ${dto.method}. Tích lũy +${earnedPoints} điểm thưởng.`,
        },
      });

      return {
        cached: false,
        success: true,
        message: 'Thanh toán đơn hàng thành công',
        payment,
        order: updatedOrder,
        earnedPoints,
      };
    });
  }
}
