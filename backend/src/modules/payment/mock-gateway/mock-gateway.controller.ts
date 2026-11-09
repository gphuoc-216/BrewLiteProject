import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 49000, description: 'Số tiền thanh toán (VNĐ)' },
        method: { type: 'string', example: 'WALLET', enum: ['WALLET', 'CARD'], description: 'Phương thức thanh toán: WALLET hoặc CARD' },
        simulateError: {
          type: 'string',
          example: 'FAIL',
          enum: ['FAIL', 'TIMEOUT'],
          nullable: true,
          description: 'Kịch bản lỗi kiểm thử: FAIL (hết tiền) hoặc TIMEOUT (mạng trễ 3s). Bỏ qua nếu muốn thành công.',
        },
      },
    },
  })
  charge(@Body() body: ChargeRequest) {
    return this.mockGatewayService.processCharge(body);
  }
}

