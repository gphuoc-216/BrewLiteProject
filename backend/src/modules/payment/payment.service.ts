import { Injectable, BadRequestException, ConflictException, UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { MockGatewayService } from './mock-gateway/mock-gateway.service';
import { assertTransition } from '../orders/order-state-machine';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * Data Transfer Object (DTO) xác thực dữ liệu gửi lên khi thanh toán đơn hàng.
 */
export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã đơn hàng (orderId) không được để trống' })
  orderId: string;

  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ (chỉ chấp nhận WALLET hoặc CARD)' })
  @IsNotEmpty()
  method: PaymentMethod;

  @IsOptional()
  simulateError?: 'FAIL' | 'TIMEOUT'; // Dùng để mô phỏng lỗi khi demo
}

/**
 * Service cốt lõi xử lý Thanh Toán, Chống Trùng Lặp (Idempotency) & Trừ Kho Đồng Thời (Optimistic Locking).
 * Đây là module quan trọng nhất của Task 8 & Task 10 đề bài.
 */
@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private mockGateway: MockGatewayService,
  ) {}

  /**
   * Hàm thực hiện quy trình thanh toán toàn diện:
   * 1. Kiểm tra Idempotency-Key chống thanh toán trùng lặp.
   * 2. Kiểm tra tính hợp lệ của đơn hàng & Order State Machine.
   * 3. Tính toán tổng nguyên liệu cần tiêu hao từ công thức Recipe.
   * 4. Chạy trong Database Transaction:
   *    - Trừ tồn kho nguyên liệu bằng Optimistic Locking kèm Retry tối đa 3 lần.
   *    - Gọi Cổng thanh toán giả lập (Mock Gateway).
   *    - Tạo bản ghi Payment lưu vào CSDL.
   *    - Cập nhật trạng thái đơn hàng sang PAID.
   *    - Tăng số lượt dùng voucher khuyến mãi.
   *    - Tích lũy điểm thưởng loyalty cho khách hàng (1 điểm / 10.000 VNĐ).
   *    - Ghi nhật ký kiểm toán OrderStatusHistory.
   */
  async processPayment(dto: ProcessPaymentDto, idempotencyKey: string, user: any) {
    // =========================================================================
    // BƯỚC 1: KIỂM TRA IDEMPOTENCY-KEY CHỐNG TRÙNG LẶP GIAO DỊCH (Task 10.2)
    // =========================================================================
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException('Bắt buộc phải có header Idempotency-Key để thực hiện thanh toán');
    }

    // Tra cứu trong CSDL xem Idempotency-Key này đã từng được xử lý thành công chưa
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: idempotencyKey.trim() },
      include: { order: true },
    });

    if (existingPayment) {
      if (existingPayment.orderId === dto.orderId) {
        // [Kịch bản Replay]: Cùng key + cùng orderId -> Khách hàng đã thanh toán rồi (bị lag mạng bấm đúp)
        // Trả lại ngay kết quả của giao dịch trước đó (HTTP 200), KHÔNG trừ tiền hay trừ kho lần 2.
        return {
          cached: true,
          replayed: true,
          message: 'Giao dịch đã được xử lý trước đó (Idempotent replay)',
          payment: existingPayment,
          order: existingPayment.order,
        };
      } else {
        // [Kịch bản Vi phạm]: Cùng key nhưng gửi cho một orderId khác -> Nghi vấn gian lận
        // Ném lỗi 422 Unprocessable Entity theo chuẩn kỹ thuật RESTful API.
        throw new UnprocessableEntityException(
          'Idempotency-Key đã được sử dụng cho một đơn hàng khác. Vui lòng sinh key mới.',
        );
      }
    }

    // =========================================================================
    // BƯỚC 2: KIỂM TRA ĐƠN HÀNG & MÁY TRẠNG THÁI ORDER STATE MACHINE (Task 10.1)
    // =========================================================================
    let orderToPayId = dto.orderId;
    if (!orderToPayId || typeof orderToPayId !== 'string') {
      // Hỗ trợ tìm đơn hàng PENDING gần nhất của khách nếu client truyền thiếu mã
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

    // Lấy thông tin chi tiết đơn hàng kèm danh sách món, biến thể size và công thức pha chế
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

    // Kiểm tra quyền hạn: Khách hàng chỉ được phép thanh toán đơn hàng của chính mình
    if (user.role === 'CUSTOMER' && order.customerId !== user.profileId) {
      throw new BadRequestException('Bạn không thể thanh toán đơn hàng của khách hàng khác');
    }

    // KÍCH HOẠT MÁY TRẠNG THÁI (Order State Machine):
    // Chỉ cho phép chuyển từ PENDING hoặc PAYMENT_FAILED sang PAID. Nếu đơn đã CANCELLED hoặc COMPLETED sẽ bị chặn.
    try {
      assertTransition(order.status, OrderStatus.PAID);
    } catch (err) {
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.PAID,
          actorId: user.profileId,
          note: `⛔ [CẢNH BÁO CHẶN GIAN LẬN] Cố tình thanh toán đơn ở trạng thái '${order.status}' không hợp lệ đã bị hệ thống chặn đứng (HTTP 409 Conflict)`,
        },
      });
      throw err;
    }

    // =========================================================================
    // BƯỚC 3: TỔNG HỢP NGUYÊN LIỆU CẦN THIẾT TỪ TẤT CẢ MÓN TRONG ĐƠN
    // =========================================================================
    // Một đơn hàng có thể có nhiều ly nước, các ly nước có thể dùng chung nguyên liệu (VD: Hạt cà phê, Sữa đặc)
    // Cần gộp tổng định lượng cần dùng theo từng ingredientId để trừ kho 1 lần duy nhất.
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

    // =========================================================================
    // BƯỚC 4: DATABASE TRANSACTION - BẢO ĐẢM TÍNH TOÀN VẸN DỮ LIỆU (ACID)
    // =========================================================================
    return this.prisma.$transaction(async (tx) => {
      // -----------------------------------------------------------------------
      // 4.1 Khấu trừ tồn kho bằng OPTIMISTIC LOCKING kèm cơ chế RETRY (Task 10.3)
      // -----------------------------------------------------------------------
      for (const [ingredientId, requirement] of ingredientRequirements.entries()) {
        let updateSuccess = false;
        let lastErrorMsg = '';

        // Cơ chế Retry tối đa 3 lần nếu có xung đột phiên bản (version conflict) giữa các khách hàng đặt cùng lúc
        for (let attempt = 0; attempt < 3; attempt++) {
          const ingredient = await tx.ingredient.findUnique({
            where: { id: ingredientId },
          });

          // Kiểm tra xem số lượng tồn kho thực tế có đủ phục vụ đơn hàng này không
          if (!ingredient || Number(ingredient.stockQuantity) < requirement.qty) {
            throw new ConflictException(
              `Nguyên liệu "${requirement.name}" đã hết hoặc không đủ tồn kho (Còn lại: ${ingredient?.stockQuantity || 0}, Cần: ${requirement.qty}). Giao dịch bị hủy.`,
            );
          }

          // CÂU LỆNH OPTIMISTIC LOCKING:
          // Chỉ cập nhật khi: id trùng khớp, version trùng khớp với lúc đọc ra, và tồn kho >= số lượng cần trừ.
          // Khi update thành công, tự động tăng version lên 1 (version: increment: 1)
          const result = await tx.ingredient.updateMany({
            where: {
              id: ingredientId,
              version: ingredient.version, // Điều kiện phiên bản lạc quan (Optimistic Lock)
              stockQuantity: { gte: requirement.qty },
            },
            data: {
              stockQuantity: { decrement: requirement.qty }, // Giảm số lượng tồn
              version: { increment: 1 },                     // Đánh dấu phiên bản mới
            },
          });

          // Nếu result.count > 0 nghĩa là không bị ai tranh chấp đè lên phiên bản này -> Thành công
          if (result.count > 0) {
            updateSuccess = true;
            break;
          }

          // Nếu result.count == 0 nghĩa là đã có transaction khác cập nhật trước -> Thử lại vòng lặp kế tiếp
          lastErrorMsg = `Xung đột phiên bản nguyên liệu "${requirement.name}" ở lần thử thứ ${attempt + 1}`;
        }

        // Sau 3 lần thử vẫn xung đột -> Báo lỗi để rollback transaction, yêu cầu khách thử lại
        if (!updateSuccess) {
          throw new ConflictException(
            `Hệ thống đang có nhiều khách hàng đặt món đồng thời (${lastErrorMsg}). Vui lòng bấm thanh toán lại.`,
          );
        }
      }

      // -----------------------------------------------------------------------
      // 4.2 GỌI CỔNG THANH TOÁN GIẢ LẬP (MOCK GATEWAY)
      // -----------------------------------------------------------------------
      const chargeResult = await this.mockGateway.processCharge({
        amount: Number(order.totalAfterDiscount),
        method: dto.method,
        simulateError: dto.simulateError,
      });

      if (!chargeResult.success) {
        // Nếu thanh toán thất bại (ví dụ tài khoản không đủ tiền):
        // 1. Cập nhật trạng thái đơn thành PAYMENT_FAILED
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAYMENT_FAILED },
        });

        // 2. Ghi nhật ký lỗi thanh toán vào OrderStatusHistory
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: OrderStatus.PAYMENT_FAILED,
            actorId: user.profileId,
            note: `Thanh toán thất bại: ${chargeResult.message}`,
          },
        });

        // 3. Ném lỗi để tự động ROLLBACK toàn bộ việc trừ kho nguyên liệu đã thực hiện ở bước 4.1
        throw new BadRequestException(`Cổng thanh toán từ chối: ${chargeResult.message}`);
      }

      // -----------------------------------------------------------------------
      // 4.3 TẠO BẢN GHI GIAO DỊCH THANH TOÁN (PAYMENT)
      // -----------------------------------------------------------------------
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: idempotencyKey.trim(), // Khóa duy nhất (Unique)
          amount: order.totalAfterDiscount,
          status: PaymentStatus.SUCCESS,
          method: dto.method,
        },
      });

      // -----------------------------------------------------------------------
      // 4.4 CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG SANG 'PAID' (ĐÃ THANH TOÁN)
      // -----------------------------------------------------------------------
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      // -----------------------------------------------------------------------
      // 4.5 TĂNG SỐ LƯỢT ĐÃ SỬ DỤNG CỦA MÃ VOUCHER KHUYẾN MÃI (NẾU CÓ)
      // -----------------------------------------------------------------------
      if (order.promotionId) {
        await tx.promotion.update({
          where: { id: order.promotionId },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      // -----------------------------------------------------------------------
      // 4.6 TÍCH LŨY ĐIỂM THƯỞNG CHO KHÁCH HÀNG (LOYALTY POINTS)
      // -----------------------------------------------------------------------
      // Quy tắc nghiệp vụ: Mỗi 10.000 VNĐ chi tiêu thực tế được cộng 1 điểm thưởng
      const earnedPoints = Math.floor(Number(order.totalAfterDiscount) / 10000);
      if (earnedPoints > 0) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            loyaltyPoints: { increment: earnedPoints },
          },
        });
      }

      // -----------------------------------------------------------------------
      // 4.7 GHI NHẬT KÝ KIỂM TOÁN CHUYỂN TRẠNG THÁI ĐƠN HÀNG (AUDIT LOG)
      // -----------------------------------------------------------------------
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.PAID,
          actorId: user.profileId,
          note: `Thanh toán thành công ${Number(order.totalAfterDiscount).toLocaleString('vi-VN')} VNĐ qua ${dto.method}. Tích lũy +${earnedPoints} điểm thưởng.`,
        },
      });

      // Hoàn tất transaction và trả về dữ liệu cho Client
      return {
        cached: false,
        replayed: false,
        success: true,
        message: 'Thanh toán đơn hàng thành công',
        payment,
        order: updatedOrder,
        earnedPoints,
      };
    });
  }

  // =========================================================================
  // PHÂN HỆ ĐỒNG BỘ REALTIME MBBANK QUA MẠNG LAN / MOBILE CAMERA
  // =========================================================================

  /**
   * Bộ nhớ đệm tĩnh lưu trữ danh sách các giao dịch chuyển khoản MBBank nhận được từ điện thoại.
   * Key: mã đơn hàng hoặc nội dung chuyển khoản | Value: thông tin giao dịch.
   */
  private static mbPayments = new Map<string, {
    orderCode: string;
    amount: number;
    content: string;
    sender: string;
    senderName: string;
    transId: string;
    time: number;
  }>();

  /**
   * Hàm Webhook nhận biến động số dư khi điện thoại quét mã VietQR và bấm xác nhận chuyển tiền.
   * Tự động trích xuất mã đơn hàng (ví dụ: BL810243 hoặc ORD-XXX) từ nội dung chuyển khoản.
   */
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

    // Tạo bản ghi giao dịch chuẩn hóa
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

    // Lưu vào bộ nhớ theo nhiều khóa để hỗ trợ tra cứu linh hoạt
    if (orderCode) {
      PaymentService.mbPayments.set(orderCode, paymentRecord);
    }
    if (rawCode && rawCode !== orderCode) {
      PaymentService.mbPayments.set(rawCode, paymentRecord);
    }
    if (content) {
      PaymentService.mbPayments.set(content, paymentRecord);
    }
    // Lưu giao dịch gần nhất để hỗ trợ đối soát các trường hợp sai nội dung chuyển khoản
    PaymentService.mbPayments.set('LATEST_TX', paymentRecord);

    return {
      success: true,
      message: 'Đã nhận biến động số dư chuyển khoản MBBank',
      payment: paymentRecord,
    };
  }

  /**
   * Hàm kiểm tra trạng thái thanh toán chuyển khoản MBBank cho mã hóa đơn.
   * Client (trang Checkout) định kỳ gọi hàm này để cập nhật trạng thái "Đã thanh toán" tự động.
   */
  async checkMbPayment(orderCode: string) {
    const code = String(orderCode || '').toUpperCase().trim();
    let payment = PaymentService.mbPayments.get(code);

    // Tìm kiếm mở rộng nếu mã nằm trong chuỗi nội dung chuyển khoản
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

    // Giao dịch hợp lệ nếu tìm thấy và thời gian phát sinh chưa quá 10 phút
    if (payment && Date.now() - payment.time < 600000) {
      return { paid: true, payment };
    }

    // NGHIỆP VỤ ĐẶC THÙ (Napas 247): Nếu có giao dịch chuyển tiền gần nhất trong vòng 2 phút nhưng không khớp mã đơn
    // -> Nhận diện ngay là khách hàng đã chuyển tiền nhưng "GHI SAI NỘI DUNG CHUYỂN KHOẢN"
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

  /**
   * Hàm vô hiệu hóa / xóa mã thanh toán MBBank khỏi bộ nhớ khi đơn đã thanh toán hoặc bị hủy.
   */
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


