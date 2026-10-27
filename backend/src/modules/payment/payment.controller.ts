import { Controller, Post, Get, Body, Headers, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService, ProcessPaymentDto } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Controller phụ trách các API thanh toán đơn hàng (Task 8 & 10)
 * Hỗ trợ thanh toán Idempotent (chống trùng giao dịch) và webhook đồng bộ MBBank.
 */
@ApiTags('Thanh toán (Payments)')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Endpoint: POST /api/payments
   * Mục đích: Khách hàng thực hiện thanh toán cho đơn hàng đã tạo (trạng thái PENDING).
   * Yêu cầu bảo mật: Phải đăng nhập (JWT Guard).
   * Yêu cầu Idempotency: Bắt buộc truyền Header 'Idempotency-Key' (UUID) để chống việc trừ tiền 2 lần khi click đúp.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thực hiện thanh toán đơn hàng không tiền mặt (Idempotent)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Khóa chống trùng lặp giao dịch (UUIDv4 sinh từ client)',
  })
  @ApiResponse({ status: 201, description: 'Thanh toán mới thành công' })
  @ApiResponse({ status: 200, description: 'Giao dịch đã xử lý trước đó (Idempotent Replay)' })
  @ApiResponse({ status: 409, description: 'Hết nguyên liệu hoặc xung đột phiên bản' })
  @ApiResponse({ status: 422, description: 'Trùng Idempotency-Key nhưng khác payload' })
  async pay(
    @Body() dto: ProcessPaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.paymentService.processPayment(dto, idempotencyKey, user);
    if (result.cached || result.replayed) {
      res.status(HttpStatus.OK);
    } else {
      res.status(HttpStatus.CREATED);
    }
    return result;
  }

  /**
   * Endpoint: POST /api/payments/mbbank-sync
   * Mục đích: Webhook nhận biến động số dư chuyển khoản từ điện thoại quét mã QR.
   * Hoạt động theo thời gian thực (Realtime sync giữa điện thoại và máy tính).
   */
  @Post('mbbank-sync')
  @ApiOperation({ summary: 'Webhook/Sync biến động số dư từ ứng dụng MBBank trên điện thoại' })
  syncMbPayment(@Body() dto: any) {
    return this.paymentService.syncMbPayment(dto);
  }

  /**
   * Endpoint: GET /api/payments/mbbank-check/:orderCode
   * Mục đích: Màn hình Checkout của khách hàng định kỳ kiểm tra (polling) xem đơn đã được chuyển khoản chưa.
   */
  @Get('mbbank-check/:orderCode')
  @ApiOperation({ summary: 'Kiểm tra trạng thái thanh toán MBBank cho mã đơn hàng' })
  checkMbPayment(@Param('orderCode') orderCode: string) {
    return this.paymentService.checkMbPayment(orderCode);
  }

  /**
   * Endpoint: POST /api/payments/mbbank-invalidate/:orderCode
   * Mục đích: Hủy bỏ hoặc xóa mã QR MBBank khỏi bộ nhớ sau khi đơn đã xử lý xong hoặc bị hủy.
   */
  @Post('mbbank-invalidate/:orderCode')
  @ApiOperation({ summary: 'Hủy/Vô hiệu hóa mã QR MBBank sau khi thanh toán hoặc hủy đơn' })
  invalidateMbPayment(@Param('orderCode') orderCode: string) {
    return this.paymentService.invalidateMbPayment(orderCode);
  }
}


