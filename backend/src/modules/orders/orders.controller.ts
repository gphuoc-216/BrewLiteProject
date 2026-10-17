import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Đơn hàng (Orders)')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới (Trạng thái PENDING)' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được khởi tạo thành công' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.profileId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách lịch sử đơn hàng của tôi' })
  getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.getMyOrders(user.profileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn hàng theo ID' })
  getOrderById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrderById(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (Chỉ cho phép khi đơn còn PENDING hoặc PAID)' })
  cancelOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.cancelOrder(id, user);
  }
}
