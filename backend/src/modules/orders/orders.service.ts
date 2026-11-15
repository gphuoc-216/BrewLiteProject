import { Injectable, BadRequestException, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { assertTransition } from './order-state-machine';
import { OrderStatus } from '@prisma/client';
import { calculateToppingsExtraPrice } from '../products/constants/toppings.constant';

/**
 * =========================================================================================
 * ORDERS SERVICE (DỊCH VỤ QUẢN LÝ ĐƠN HÀNG - TASK 9 BE)
 * =========================================================================================
 * Chịu trách nhiệm toàn bộ vòng đời của một Đơn hàng:
 * 1. Khởi tạo đơn hàng ở trạng thái PENDING, tính toán giá trị và áp dụng mã giảm giá.
 * 2. Lấy danh sách lịch sử đơn hàng của khách hàng (getMyOrders).
 * 3. Xem chi tiết đơn hàng kèm công thức nguyên liệu và Audit Log (getOrderById).
 * 4. Hủy đơn hàng (cancelOrder) kèm cơ chế HOÀN KHO và HOÀN ĐIỂM nếu đơn đã thanh toán (PAID).
 * =========================================================================================
 */
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private promotionsService: PromotionsService,
  ) {}

  /**
   * =======================================================================================
   * PHƯƠNG THỨC: TẠO ĐƠN HÀNG MỚI (CREATE ORDER)
   * =======================================================================================
   * @param customerId ID hồ sơ khách hàng đang đăng nhập
   * @param dto Danh sách món đặt (items) và mã khuyến mãi (promotionCode nếu có)
   * 
   * Quy trình xử lý:
   * 1. Kiểm tra giỏ hàng hợp lệ, nạp dữ liệu các biến thể sản phẩm (ProductVariant) để lấy giá chuẩn.
   * 2. Tính tổng tiền gốc (subtotal) của các món hàng.
   * 3. Thẩm định mã khuyến mãi qua PromotionsService và tính số tiền được giảm (discountAmount).
   * 4. Tính tổng tiền cần thanh toán = max(0, subtotal - discountAmount).
   * 5. Mở Database Transaction ($transaction) để:
   *    - Tạo bản ghi Order ở trạng thái ban đầu là PENDING kèm các dòng chi tiết OrderItem.
   *    - Ghi bản ghi Audit Log đầu tiên vào OrderStatusHistory.
   */
  private async resolveCustomerId(customerId: string): Promise<string> {
    if (!this.prisma.isConnected) return customerId;
    try {
      const cust = await this.prisma.customer.findUnique({ where: { id: customerId } });
      if (cust) return cust.id;

      const acc = await this.prisma.account.findFirst({
        where: {
          OR: [
            { id: customerId },
            { customer: { id: customerId } },
          ],
        },
        include: { customer: true },
      });

      if (acc?.customer) {
        return acc.customer.id;
      }
    } catch {
      // ignore
    }
    return customerId;
  }

  async createOrder(customerId: string, dto: CreateOrderDto) {
    // Bước 0: Thẩm định giỏ hàng không được rỗng
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không có sản phẩm nào để đặt');
    }

    const effectiveCustomerId = await this.resolveCustomerId(customerId);

    // 1. Thử ghi nhận qua Database trước
    try {
      // Bước 1: Truy vấn danh sách biến thể sản phẩm từ Database để lấy đơn giá chính xác
      const variantIds = dto.items.map((i) => i.variantId);
      const uniqueVariantIds = Array.from(new Set(variantIds));
      const variants = await this.prisma.productVariant.findMany({
        where: { id: { in: uniqueVariantIds } },
        include: { product: true },
      });

      // Nếu số lượng biến thể độc nhất tìm thấy không khớp -> có món bị xóa hoặc ID sai
      if (variants.length !== uniqueVariantIds.length) {
        throw new BadRequestException('Một số sản phẩm/biến thể trong giỏ hàng không còn tồn tại');
      }

      // Tạo Map ánh xạ để tra cứu nhanh thông tin biến thể theo variantId
      const variantMap = new Map(variants.map((v) => [v.id, v]));
      let subtotal = 0;

      // Chuẩn bị dữ liệu chi tiết đơn hàng (OrderItem) và tính tổng tiền chưa giảm (subtotal)
      const orderItemsData = dto.items.map((item) => {
        const variant = variantMap.get(item.variantId)!;
        const extraToppingsPrice = calculateToppingsExtraPrice(item.toppings);
        const unitPrice = Number(variant.price) + extraToppingsPrice;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        return {
          variantId: item.variantId,
          quantity: item.quantity,
          lineTotal,
        };
      });

      // Bước 2: Kiểm tra và áp dụng mã khuyến mãi (nếu khách hàng có nhập mã)
      const promoApplied = await this.applyPromotionCodes(dto.promotionCode, subtotal);
      const promotionId = promoApplied.promotionId;
      let discountAmount = promoApplied.discountAmount;

      // 2.2 Áp dụng điểm thưởng Loyalty (1 điểm = 100 VNĐ, 10 điểm = 1.000 VNĐ)
      let actualPointsUsed = 0;
      let pointsDiscount = 0;
      if (dto.loyaltyPointsToUse && dto.loyaltyPointsToUse > 0) {
        const customer = await this.prisma.customer.findUnique({ where: { id: effectiveCustomerId } });
        const availablePoints = customer?.loyaltyPoints || 0;
        const remainingSubtotal = Math.max(0, subtotal - discountAmount);
        actualPointsUsed = Math.min(
          Math.floor(dto.loyaltyPointsToUse),
          availablePoints,
          Math.floor(remainingSubtotal / 100)
        );
        pointsDiscount = actualPointsUsed * 100;
        discountAmount += pointsDiscount;
      }

      // Tiền sau giảm giá tuyệt đối không được âm
      const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

      // Bước 3: Khởi tạo đơn hàng ở trạng thái PENDING trong 1 Transaction đảm bảo tính nguyên tố
      const order = await this.prisma.$transaction(async (tx) => {
        if (actualPointsUsed > 0) {
          await tx.customer.update({
            where: { id: effectiveCustomerId },
            data: { loyaltyPoints: { decrement: actualPointsUsed } },
          });
        }

        // 3.1 Tạo bản ghi Order cùng các OrderItem
        const newOrder = await tx.order.create({
          data: {
            customerId: effectiveCustomerId,
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

        // 3.2 Ghi vết lịch sử trạng thái ban đầu (Audit Log)
        const initNote =
          actualPointsUsed > 0
            ? `Khởi tạo đơn hàng thành công, chờ thanh toán [REDEEMED_POINTS:${actualPointsUsed}]`
            : 'Khởi tạo đơn hàng thành công, chờ thanh toán';
        await tx.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            fromStatus: OrderStatus.PENDING,
            toStatus: OrderStatus.PENDING,
            note: initNote,
          },
        });

        return newOrder;
      });

      return order;
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw err;
    }
  }

  /**
   * Thẩm định danh sách mã voucher (tối đa 1 mã đơn hàng + mã cộng dồn HAPPYHOUR),
   * không nuốt lỗi khi mã không hợp lệ và tránh gán virtual-* làm FK PostgreSQL.
   */
  private async applyPromotionCodes(
    promotionCode: string | undefined,
    subtotal: number,
  ): Promise<{ promotionId: string | null; discountAmount: number }> {
    if (!promotionCode) {
      return { promotionId: null, discountAmount: 0 };
    }

    const codes = Array.from(
      new Set(
        promotionCode
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    const regularCodes = codes.filter((c) => c !== 'HAPPYHOUR');
    if (regularCodes.length > 1) {
      throw new BadRequestException(
        'Chỉ được áp dụng tối đa 1 mã giảm giá đơn hàng (có thể kết hợp thêm mã HAPPYHOUR)',
      );
    }

    let promotionId: string | null = null;
    let remaining = subtotal;
    let discountAmount = 0;

    for (const code of codes) {
      if (remaining <= 0) break;
      const promoResult = await this.promotionsService.validatePromotion(code, subtotal);
      const applied = Math.min(promoResult.discountAmount, remaining);
      discountAmount += applied;
      remaining -= applied;

      const rawId = promoResult.promotionId;
      if (rawId && !String(rawId).startsWith('virtual-') && !String(rawId).startsWith('seed-')) {
        if (!promotionId) promotionId = rawId;
      }
    }

    return { promotionId, discountAmount };
  }

  /**
   * =======================================================================================
   * PHƯƠNG THỨC: LẤY LỊCH SỬ ĐƠN HÀNG CỦA KHÁCH HÀNG (GET MY ORDERS)
   * =======================================================================================
   * @param customerId ID hồ sơ của khách hàng hiện tại
   * Trả về danh sách đơn hàng được sắp xếp theo thời gian mới nhất lên đầu (createdAt DESC),
   * nạp kèm danh sách món, giao dịch thanh toán và thông tin khuyến mãi.
   */
  async getMyOrders(customerId: string) {
    const effectiveCustomerId = await this.resolveCustomerId(customerId);
    const orders = await this.prisma.order.findMany({
      where: { customerId: effectiveCustomerId },
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
    return orders || [];
  }

  /**
   * =======================================================================================
   * PHƯƠNG THỨC: XEM CHI TIẾT ĐƠN HÀNG THEO ID (GET ORDER BY ID)
   * =======================================================================================
   * @param orderId Mã định danh duy nhất của đơn hàng
   * @param user Thông tin người dùng hiện tại trích xuất từ Token JWT
   * 
   * Kiểm soát quyền truy cập (RBAC / Data Isolation):
   * - Nếu người dùng có vai trò là CUSTOMER, bắt buộc đơn hàng đó phải thuộc quyền sở hữu của chính họ.
   * - Trả về toàn bộ chi tiết: công thức pha chế, nguyên liệu, lịch sử chuyển trạng thái (Audit Log).
   */
  async getOrderById(orderId: string, user: any) {
    if (!user || user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Chỉ khách hàng (Customer) mới có quyền xem chi tiết đơn hàng cá nhân');
    }

    const actorCustomerId = user.customerId || user.profileId;

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
          reviews: true,
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

      if (!actorCustomerId || order.customerId !== actorCustomerId) {
        throw new ForbiddenException('Bạn không có quyền xem đơn hàng của người khác');
      }
      return order;
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw err;
    }
  }

  /**
   * =======================================================================================
   * PHƯƠNG THỨC: HỦY ĐƠN HÀNG (CANCEL ORDER - TASK 9 & 10 BE)
   * =======================================================================================
   * @param orderId Mã đơn hàng cần hủy
   * @param user Khách hàng chủ đơn hàng thực hiện yêu cầu hủy
   * 
   * Quy trình xử lý hủy đơn:
   * 1. Kiểm tra đơn hàng có tồn tại không và kiểm tra quyền sở hữu.
   * 2. Gọi Máy Trạng Thái `assertTransition(order.status, OrderStatus.CANCELLED)`:
   *    - Chỉ cho phép hủy khi đơn đang ở trạng thái PENDING (chưa trả tiền) hoặc PAID (đã trả nhưng chưa pha).
   *    - Chặn đứng nếu đơn đã chuyển sang PREPARING (đang pha chế), READY hoặc COMPLETED.
   * 3. Mở Database Transaction ($transaction) để thực thi nguyên tố:
   *    a) NẾU ĐƠN ĐÃ THANH TOÁN (status === PAID):
   *       - Hoàn lại số lượng nguyên liệu tồn kho theo định lượng công thức pha chế (HoanSoLuong).
   *       - Thu hồi số điểm thưởng Loyalty đã tích lũy cho khách hàng từ đơn này.
   *       - Giảm `usedCount` của mã khuyến mãi để khách hàng có thể sử dụng lại mã.
   *    b) Cập nhật trạng thái đơn hàng sang `CANCELLED`.
   *    c) Ghi bản ghi Audit Log vào `orderStatusHistory` ghi rõ ai hủy và ghi chú hoàn kho.
   */
  async cancelOrder(orderId: string, user: any) {
    if (user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Chỉ khách hàng (Customer) chủ đơn hàng mới có quyền hủy đơn hàng');
    }

    const actorCustomerId = user.customerId || user.profileId;

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
        // Kiểm tra quyền: Khách hàng chỉ được hủy đơn của chính mình
        if (!actorCustomerId || order.customerId !== actorCustomerId) {
          throw new ForbiddenException('Bạn không thể hủy đơn hàng của người khác');
        }

        // Kiểm tra tính hợp lệ qua State Machine: Chỉ được hủy khi đơn ở trạng thái PENDING hoặc PAID
        try {
          assertTransition(order.status, OrderStatus.CANCELLED);
        } catch (err) {
          await this.prisma.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: order.status,
              toStatus: OrderStatus.CANCELLED,
              actorId: user.profileId || user.accountId,
              note: `⛔ [CẢNH BÁO CHẶN GIAN LẬN] Cố tình hủy đơn ở trạng thái '${order.status}' không hợp lệ đã bị hệ thống chặn đứng (HTTP 409 Conflict)`,
            },
          });
          throw err;
        }

        return await this.prisma.$transaction(async (tx) => {
          // Trường hợp đặc biệt: Đơn đã thanh toán (PAID) bị hủy trước khi Barista pha chế
          if (order.status === OrderStatus.PAID) {
            // 1. Hoàn lại nguyên liệu vào kho (Hoàn số lượng tồn kho)
            for (const item of order.items) {
              for (const recipe of item.variant.recipes) {
                const returnQty = Number(recipe.quantityRequired) * item.quantity;
                await tx.ingredient.update({
                  where: { id: recipe.ingredientId },
                  data: {
                    stockQuantity: {
                      increment: returnQty, // Cộng trả lại số lượng nguyên liệu vào kho
                    },
                  },
                });
              }
            }

            // 2. Thu hồi lại số điểm thưởng loyalty đã tích lũy (+1 điểm / 10.000đ)
            const loyaltyPointsToRefund = Math.floor(Number(order.totalAfterDiscount) / 10000);
            if (loyaltyPointsToRefund > 0) {
              await tx.customer.update({
                where: { id: order.customerId },
                data: {
                  loyaltyPoints: {
                    decrement: loyaltyPointsToRefund, // Trừ lại điểm thưởng khách hàng
                  },
                },
              });
            }

            // 3. Hoàn lại lượt sử dụng mã khuyến mãi nếu đơn này có áp dụng
            if (order.promotionId) {
              await tx.promotion.update({
                where: { id: order.promotionId },
                data: {
                  usedCount: {
                    decrement: 1, // Giảm số lần đã dùng để voucher có hiệu lực lại
                  },
                },
              });
            }
          }

          // Hoàn lại điểm tích lũy khách hàng đã quy đổi giảm giá cho đơn này (nếu có)
          const initHistory = await (tx as any).orderStatusHistory?.findFirst?.({
            where: {
              orderId,
              fromStatus: OrderStatus.PENDING,
              toStatus: OrderStatus.PENDING,
            },
            orderBy: { createdAt: 'asc' },
          });
          const redeemedMatch = initHistory?.note?.match?.(/\[REDEEMED_POINTS:(\d+)\]/);
          const redeemedPoints = redeemedMatch ? parseInt(redeemedMatch[1], 10) : 0;
          if (redeemedPoints > 0) {
            await tx.customer.update({
              where: { id: order.customerId },
              data: {
                loyaltyPoints: {
                  increment: redeemedPoints,
                },
              },
            });
          }

          // Cập nhật trạng thái đơn hàng sang CANCELLED
          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CANCELLED },
          });

          // Ghi vết vào bảng Audit Log (OrderStatusHistory) phục vụ đối soát và chấm điểm đồ án
          const refundNotes: string[] = [];
          if (order.status === OrderStatus.PAID) {
            refundNotes.push('Đã hoàn kho nguyên liệu, thu hồi điểm tích và hoàn voucher thành công.');
          }
          if (redeemedPoints > 0) {
            refundNotes.push(`Đã hoàn ${redeemedPoints} điểm tích lũy đã sử dụng.`);
          }
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: order.status,
              toStatus: OrderStatus.CANCELLED,
              actorId: actorCustomerId || user.accountId,
              note: `Khách hàng hủy đơn.${refundNotes.length ? ' ' + refundNotes.join(' ') : ''}`,
            },
          });

          return updatedOrder;
        });
      }

      throw new NotFoundException('Không tìm thấy đơn hàng cần hủy');
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err?.status === 409) {
        throw err;
      }
      throw err;
    }
  }
}
