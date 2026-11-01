import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * =========================================================================================
 * ORDERS CONTROLLER (API ĐƠN HÀNG - TASK 9 BE)
 * =========================================================================================
 * Cung cấp các endpoint REST API cho việc đặt hàng, xem lịch sử và hủy đơn:
 * - POST /api/orders         : Tạo đơn hàng mới (trạng thái ban đầu PENDING)
 * - GET  /api/orders/me      : Lấy danh sách lịch sử đơn hàng của người dùng hiện tại
 * - GET  /api/orders/:id     : Xem chi tiết đơn hàng (bao gồm công thức, nguyên liệu & audit log)
 * - POST /api/orders/:id/cancel : Hủy đơn hàng và kích hoạt hoàn kho/điểm thưởng nếu đã thanh toán
 * 
 * Toàn bộ Controller được bảo vệ bởi JwtAuthGuard (yêu cầu gửi kèm Bearer Token).
 * =========================================================================================
 */
@ApiTags('Đơn hàng (Orders)')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Endpoint: Khởi tạo đơn hàng mới
   * Nhận giỏ hàng từ Frontend, tính toán thành tiền, áp dụng voucher (nếu có) và tạo đơn PENDING.
   */
  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới (Trạng thái PENDING)' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được khởi tạo thành công' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.profileId, dto);
  }

  /**
   * Endpoint: Lấy lịch sử các đơn hàng của khách hàng đang đăng nhập
   */
  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách lịch sử đơn hàng của tôi' })
  getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.getMyOrders(user.profileId);
  }

  /**
   * Endpoint: Xem chi tiết một đơn hàng cụ thể theo ID
   * Kiểm tra quyền sở hữu (Customer chỉ được xem đơn của mình).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn hàng theo ID' })
  getOrderById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrderById(id, user);
  }

  /**
   * Endpoint: Hủy đơn hàng
   * Chỉ cho phép khi đơn ở trạng thái PENDING hoặc PAID.
   * Nếu đơn đã PAID, tự động kích hoạt hoàn kho nguyên liệu và thu hồi điểm loyalty.
   */
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (Chỉ cho phép khi đơn còn PENDING hoặc PAID)' })
  cancelOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.cancelOrder(id, user);
  }
}
