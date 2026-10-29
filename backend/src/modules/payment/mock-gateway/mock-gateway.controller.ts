import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MockGatewayService, ChargeRequest } from './mock-gateway.service';

/**
 * Controller cung cấp endpoint REST API cho Cổng thanh toán giả lập.
 * Cho phép các client hoặc Postman gọi trực tiếp để kiểm thử các kịch bản trừ tiền.
 */
@ApiTags('Cổng Thanh Toán Giả Lập (Mock Gateway)')
@Controller('mock-gateway')
export class MockGatewayController {
  constructor(private readonly mockGatewayService: MockGatewayService) {}

  /**
   * Endpoint: POST /api/mock-gateway/charge
   * Nhận yêu cầu trừ tiền và trả về kết quả giả lập (SUCCESS / FAIL / TIMEOUT).
   */
  @Post('charge')
  @ApiOperation({ summary: 'Mô phỏng thanh toán ví/thẻ (hỗ trợ simulate FAIL/TIMEOUT)' })
  charge(@Body() body: ChargeRequest) {
    return this.mockGatewayService.processCharge(body);
  }
}

