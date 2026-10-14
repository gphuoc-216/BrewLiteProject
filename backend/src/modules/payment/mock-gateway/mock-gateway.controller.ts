import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MockGatewayService, ChargeRequest } from './mock-gateway.service';

@ApiTags('Cổng Thanh Toán Giả Lập (Mock Gateway)')
@Controller('mock-gateway')
export class MockGatewayController {
  constructor(private readonly mockGatewayService: MockGatewayService) {}

  @Post('charge')
  @ApiOperation({ summary: 'Mô phỏng thanh toán ví/thẻ (hỗ trợ simulate FAIL/TIMEOUT)' })
  charge(@Body() body: ChargeRequest) {
    return this.mockGatewayService.processCharge(body);
  }
}
