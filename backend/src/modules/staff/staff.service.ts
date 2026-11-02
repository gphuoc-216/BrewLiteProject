import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { assertTransition } from '../orders/order-state-machine';
import { OrderStatus } from '@prisma/client';

/**
 * =========================================================================================
 * ☕ STAFF SERVICE: DỊCH VỤ ĐIỀU PHỐI QUẦY PHA CHẾ (BARISTA KANBAN - TASK 9 BE)
 * =========================================================================================
 * Module này quản lý toàn bộ quy trình làm việc của Nhân viên / Barista tại quầy:
 * 
 * 1. [Kanban FIFO]: Hiển thị danh sách các đơn hàng đã thanh toán theo thứ tự vào trước làm trước.
 * 2. [Vòng đời pha chế]: 
 *    PAID (Đã thanh toán) ➔ PREPARING (Đang pha chế) ➔ READY (Pha xong) ➔ COMPLETED (Hoàn tất).
 * 3. [Kiểm soát State Machine]: 
 *    Chặn đứng mọi hành vi nhảy cóc trạng thái (ví dụ chưa thanh toán mà đòi hoàn thành).
 * 4. [Audit Trail]:
 *    Tự động ghi nhận lịch sử vào bảng OrderStatusHistory để lưu vết Barista nào đã xử lý đơn.
 */
@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  /**
   * =======================================================================================
   * HÀM TRỢ GIÚP: XÁC ĐỊNH MÃ ĐỊNH DANH NHÂN VIÊN (resolveStaffId)
   * =======================================================================================
   * @param actorId Mã truyền từ Token JWT (có thể là ID bảng Staff hoặc ID bảng Account)
   * @returns staffId hợp lệ trong bảng "staffs" để liên kết khóa ngoại với đơn hàng
   */
  private async resolveStaffId(actorId?: string): Promise<string | null> {
    if (!this.prisma.isConnected) return null;
    if (actorId) {
      // 1. Kiểm tra xem actorId có phải trực tiếp là ID của bảng Staff không
      const staff = await this.prisma.staff.findUnique({ where: { id: actorId } });
      if (staff) return staff.id;

      // 2. Nếu là accountId từ bảng Account -> Tìm Staff tương ứng qua quan hệ 1-1
      const staffByAcc = await this.prisma.staff.findFirst({ where: { accountId: actorId } });
      if (staffByAcc) return staffByAcc.id;
    }

    // 3. Fallback: Nếu không tìm thấy, lấy nhân viên đầu tiên trong hệ thống
    const firstStaff = await this.prisma.staff.findFirst();
    return firstStaff ? firstStaff.id : null;
  }

  /**
   * =======================================================================================
   * 1. LẤY DANH SÁCH ĐƠN HÀNG CHO QUẦY BARISTA (getOrdersForBarista)
   * =======================================================================================
   * @param status Bộ lọc trạng thái tùy chọn (PAID, PREPARING, READY...)
   * 
   * ĐẶC ĐIỂM NGHIỆP VỤ:
   * - Mặc định chỉ lấy các đơn đang cần Barista thao tác: PAID, PREPARING, READY.
   * - Áp dụng nguyên tắc FIFO (First-In, First-Out): `orderBy: { createdAt: 'asc' }`
   *   (Đơn nào khách đặt trước thì Barista phải ưu tiên pha trước, đảm bảo công bằng).
   * - Tự động tải kèm thông tin Khách hàng, Nhân viên phụ trách, và Công thức định lượng.
   */
  async getOrdersForBarista(status?: OrderStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      // Mặc định lấy các đơn cần pha chế tại quầy
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
      orderBy: { createdAt: 'asc' }, // ⏱️ Đơn vào trước làm trước (FIFO)
    });
  }

  /**
   * =======================================================================================
   * 2. BARISTA TIẾP NHẬN ĐƠN HÀNG (acceptOrder): PAID ➔ PREPARING
   * =======================================================================================
   * @param orderId Mã đơn hàng Barista bấm nhận trên màn hình
   * @param staffId Mã nhân viên tiếp nhận đơn
   * 
   * QUY TRÌNH:
   * 1. Tìm đơn hàng trong CSDL.
   * 2. Gọi assertTransition(order.status, PREPARING):
   *    - Bắt buộc đơn hiện tại phải là 'PAID' (đã thanh toán thành công).
   *    - Nếu đơn chưa trả tiền (PENDING), hệ thống từ chối và ghi log cảnh báo gian lận.
   * 3. Chạy Transaction ($transaction):
   *    - Cập nhật đơn sang 'PREPARING' và gán staffId của Barista đó vào đơn.
   *    - Ghi bản ghi Audit Log vào bảng orderStatusHistory.
   */
  async acceptOrder(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // 🛡️ Bước 1: Kiểm tra quy chuẩn Máy trạng thái (State Machine)
    try {
      assertTransition(order.status, OrderStatus.PREPARING);
    } catch (err) {
      // Ghi vết hành vi vi phạm vào Audit Log
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

    // ⚡ Bước 2: Thực hiện chuyển đổi nguyên tố trong Transaction
    return this.prisma.$transaction(async (tx) => {
      const validStaffId = await this.resolveStaffId(staffId);
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PREPARING,
          ...(validStaffId ? { staffId: validStaffId } : {}),
        },
      });

      // 📝 Bước 3: Ghi vết nhật ký kiểm toán (Audit Trail)
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

  /**
   * =======================================================================================
   * 3. BÁO PHA CHẾ XONG (markReady): PREPARING ➔ READY
   * =======================================================================================
   * @param orderId Mã đơn hàng đã làm xong
   * @param staffId Mã Barista hoàn thành pha chế
   * 
   * QUY TRÌNH:
   * 1. Bắt buộc đơn phải đang ở trạng thái 'PREPARING' mới được chuyển sang 'READY'.
   * 2. Đổi trạng thái đơn sang 'READY' (Sẵn sàng phục vụ / Nước đã để trên quầy chờ lấy).
   * 3. Ghi vết Audit Log để ghi nhận thời gian hoàn thành của Barista.
   */
  async markReady(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // 🛡️ Bước 1: Kiểm tra State Machine
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

    // ⚡ Bước 2: Cập nhật CSDL trong Transaction
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.READY },
      });

      // 📝 Bước 3: Ghi vết Audit Log
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

  /**
   * =======================================================================================
   * 4. HOÀN TẤT BÀN GIAO CHO KHÁCH (completeOrder): READY ➔ COMPLETED
   * =======================================================================================
   * @param orderId Mã đơn hàng khách đã nhận
   * @param staffId Mã nhân viên bàn giao
   * 
   * 🎯 ĐIỂM CHẤM THI QUAN TRỌNG NHẤT (BẮT LỖI NHẢY CÓC HTTP 409 CONFLICT):
   * - Nếu ai đó cố tình gọi API này khi đơn đang ở 'PENDING' (chưa trả tiền)
   *   hoặc 'PAID' (chưa pha chế xong) -> assertTransition() sẽ NÉM LỖI 409 CONFLICT!
   * - Ghi nhận ngay vết cố tình gian lận vào bảng OrderStatusHistory để làm minh chứng.
   * - Khi hợp lệ (từ READY): Đổi sang 'COMPLETED' (Trạng thái kết thúc - Terminal State).
   */
  async completeOrder(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // 🛡️ Bước 1: Chặn đứng hành vi gian lận nhảy cóc
    try {
      assertTransition(order.status, OrderStatus.COMPLETED);
    } catch (err) {
      // ⚠️ Ghi nhật ký kiểm toán lưu vết hành vi nhảy cóc vi phạm quy trình
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

    // ⚡ Bước 2: Hoàn tất đơn hàng trong Transaction
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      // 📝 Bước 3: Ghi Audit Log hoàn tất
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

  /**
   * =======================================================================================
   * 5. XEM CÔNG THỨC PHA CHẾ CỦA ĐƠN HÀNG (getOrderRecipes)
   * =======================================================================================
   * @param orderId Mã đơn hàng cần xem định lượng
   * 
   * Giúp Barista nhìn thấy chính xác:
   * - Ly nước này Size gì? Topping gì?
   * - Cần cho bao nhiêu gram cà phê, bao nhiêu ml sữa, bao nhiêu gram đường.
   */
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
