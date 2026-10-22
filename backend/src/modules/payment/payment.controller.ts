import { Controller, Post, Get, Body, Headers, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService, ProcessPaymentDto } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Thanh toán (Payments)')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thực hiện thanh toán đơn hàng không tiền mặt (Idempotent)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Khóa chống trùng lặp giao dịch (UUIDv4 sinh từ client)',
  })
  @ApiResponse({ status: 201, description: 'Thanh toán thành công' })
  @ApiResponse({ status: 409, description: 'Hết nguyên liệu hoặc xung đột phiên bản' })
  @ApiResponse({ status: 422, description: 'Trùng Idempotency-Key nhưng khác payload' })
  pay(
    @Body() dto: ProcessPaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.processPayment(dto, idempotencyKey, user);
  }

  @Post('mbbank-sync')
  @ApiOperation({ summary: 'Webhook/Sync biến động số dư từ ứng dụng MBBank trên điện thoại' })
  syncMbPayment(@Body() dto: any) {
    return this.paymentService.syncMbPayment(dto);
  }

  @Get('mbbank-check/:orderCode')
  @ApiOperation({ summary: 'Kiểm tra trạng thái thanh toán MBBank cho mã đơn hàng' })
  checkMbPayment(@Param('orderCode') orderCode: string) {
    return this.paymentService.checkMbPayment(orderCode);
  }
}

