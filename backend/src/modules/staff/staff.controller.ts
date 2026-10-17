import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderStatus, Role } from '@prisma/client';

@ApiTags('Quầy Pha Chế (Staff / Barista)')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng cho bảng Kanban Barista' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  getOrders(@Query('status') status?: OrderStatus) {
    return this.staffService.getOrdersForBarista(status);
  }

  @Post('orders/:id/accept')
  @ApiOperation({ summary: 'Nhận đơn: chuyển trạng thái từ PAID sang PREPARING' })
  acceptOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.staffService.acceptOrder(id, user.profileId);
  }

  @Post('orders/:id/ready')
  @ApiOperation({ summary: 'Pha xong: chuyển trạng thái từ PREPARING sang READY' })
  markReady(@Param('id') id: string, @CurrentUser() user: any) {
    return this.staffService.markReady(id, user.profileId);
  }

  @Post('orders/:id/complete')
  @ApiOperation({ summary: 'Giao nước: chuyển trạng thái từ READY sang COMPLETED' })
  completeOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.staffService.completeOrder(id, user.profileId);
  }

  @Get('orders/:id/recipes')
  @ApiOperation({ summary: 'Xem công thức pha chế chi tiết của các ly trong đơn' })
  getOrderRecipes(@Param('id') id: string) {
    return this.staffService.getOrderRecipes(id);
  }
}
