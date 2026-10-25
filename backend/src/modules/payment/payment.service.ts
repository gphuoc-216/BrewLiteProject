import { Injectable, BadRequestException, ConflictException, UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { MockGatewayService } from './mock-gateway/mock-gateway.service';
import { assertTransition } from '../orders/order-state-machine';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã đơn hàng (orderId) không được để trống' })
  orderId: string;

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  @IsNotEmpty()
  method: PaymentMethod;

  @IsOptional()
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

    // 2. Kiểm tra đơn hàng cần thanh toán (hỗ trợ fallback nếu client bị thiếu orderId)
    let orderToPayId = dto.orderId;
    if (!orderToPayId || typeof orderToPayId !== 'string') {
      const pendingOrder = await this.prisma.order.findFirst({
        where: { customerId: user.profileId, status: OrderStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });
      if (pendingOrder) {
        orderToPayId = pendingOrder.id;
      } else {
        throw new BadRequestException('Mã đơn hàng (orderId) không được để trống hoặc không hợp lệ');
      }
    }

    let order = await this.prisma.order.findUnique({
      where: { id: orderToPayId },
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
      },
    });

    if (!order) {
      const pendingOrder = await this.prisma.order.findFirst({
        where: { customerId: user.profileId, status: OrderStatus.PENDING },
        orderBy: { createdAt: 'desc' },
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
        },
      });
      if (pendingOrder) {
        order = pendingOrder;
      } else {
        throw new NotFoundException(`Không tìm thấy đơn hàng với mã: ${orderToPayId}`);
      }
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

  // --- MBBANK REALTIME CROSS-DEVICE SYNC ---
  private static mbPayments = new Map<string, {
    orderCode: string;
    amount: number;
    content: string;
    sender: string;
    senderName: string;
    transId: string;
    time: number;
  }>();

  async syncMbPayment(data: any) {
    const content = String(data?.content || '').toUpperCase().trim();
    const rawCode = String(data?.invoice_code || '').toUpperCase().trim();
    
    // Tách mã hóa đơn chuẩn: ưu tiên 6 số BL\d{6} (ví dụ BL810243)
    let orderCode = '';
    const match6Digits = content.match(/BL\d{6}/) || rawCode.match(/BL\d{6}/);
    if (match6Digits) {
      orderCode = match6Digits[0];
    } else {
      const matchGeneral = content.match(/BL\d+/) || content.match(/ORD-[A-Z0-9]+/) || [rawCode];
      orderCode = (matchGeneral[0] || rawCode).replace(/^BREWLITE\s*/i, '').trim();
      if (orderCode.length === 10 && orderCode.endsWith('6304')) {
        orderCode = orderCode.slice(0, 6);
      }
    }

    const paymentRecord = {
      orderCode,
      amount: Number(data?.amount) || 0,
      content: data?.content || '',
      sender: String(data?.sender || '0589822346'),
      senderName: String(data?.sender_name || data?.senderName || 'NGUYEN HOANG ANH'),
      transId: String(data?.trans_id || data?.transId || `FT${Date.now()}`),
      time: Date.now(),
    };

    console.log(`[MBBank Sync] 💸 Nhận giao dịch mới: Đơn=${orderCode}, Tiền=${paymentRecord.amount}, Nội dung="${paymentRecord.content}"`);

    if (orderCode) {
      PaymentService.mbPayments.set(orderCode, paymentRecord);
    }
    if (rawCode && rawCode !== orderCode) {
      PaymentService.mbPayments.set(rawCode, paymentRecord);
    }
    if (content) {
      PaymentService.mbPayments.set(content, paymentRecord);
    }
    // Lưu giao dịch gần nhất để hỗ trợ đối soát các trường hợp sai nội dung
    PaymentService.mbPayments.set('LATEST_TX', paymentRecord);

    return {
      success: true,
      message: 'Đã nhận biến động số dư chuyển khoản MBBank',
      payment: paymentRecord,
    };
  }

  async checkMbPayment(orderCode: string) {
    const code = String(orderCode || '').toUpperCase().trim();
    let payment = PaymentService.mbPayments.get(code);

    if (!payment) {
      for (const [key, val] of PaymentService.mbPayments.entries()) {
        if (
          key !== 'LATEST_TX' &&
          (key.includes(code) ||
          code.includes(key) ||
          (val.content && (val.content.toUpperCase().includes(code) || code.includes(val.content.toUpperCase()))) ||
          (val.orderCode && (val.orderCode.toUpperCase().includes(code) || code.includes(val.orderCode.toUpperCase()))))
        ) {
          payment = val;
          break;
        }
      }
    }

    if (payment && Date.now() - payment.time < 600000) { // 10 phút hiệu lực
      return { paid: true, payment };
    }

    // Nếu không khớp mã nhưng có giao dịch chuyển tiền gần nhất trong vòng 2 phút -> Nhận diện SAI NỘI DUNG
    const latestTx = PaymentService.mbPayments.get('LATEST_TX');
    if (latestTx && Date.now() - latestTx.time < 120000) {
      const txContent = (latestTx.content || '').toUpperCase();
      if (!txContent.includes(code)) {
        return {
          paid: false,
          mismatched: true,
          errorType: 'WRONG_CONTENT',
          message: `Phát hiện giao dịch chuyển khoản SAI NỘI DUNG: Hệ thống nhận được nội dung "${latestTx.content}" (${Number(latestTx.amount || 0).toLocaleString('vi-VN')} đ), không khớp với mã hóa đơn "BREWLITE ${code}". Đơn hàng từ chối kích hoạt tự động theo quy chế.`,
          latestPayment: latestTx,
        };
      }
    }

    return { paid: false };
  }

  async invalidateMbPayment(orderCode: string) {
    const code = String(orderCode || '').toUpperCase().trim();
    PaymentService.mbPayments.delete(code);
    for (const [key, val] of PaymentService.mbPayments.entries()) {
      if (key.includes(code) || (val?.orderCode && val.orderCode.includes(code))) {
        PaymentService.mbPayments.delete(key);
      }
    }
    return { success: true, message: `Đã hủy mã thanh toán ${code}` };
  }
}

