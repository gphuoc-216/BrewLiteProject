import { Injectable, BadRequestException, RequestTimeoutException } from '@nestjs/common';

export interface ChargeRequest {
  amount: number;
  method: string;
  simulateError?: 'FAIL' | 'TIMEOUT';
}

@Injectable()
export class MockGatewayService {
  async processCharge(req: ChargeRequest) {
    if (req.simulateError === 'TIMEOUT') {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      throw new RequestTimeoutException('Cổng thanh toán phản hồi timeout (quá thời gian chờ)');
    }

    if (req.simulateError === 'FAIL') {
      return {
        success: false,
        errorCode: 'INSUFFICIENT_FUNDS',
        message: 'Tài khoản ví/thẻ không đủ số dư để thanh toán đơn hàng',
      };
    }

    return {
      success: true,
      transactionRef: `BREW-MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount: req.amount,
      method: req.method,
      timestamp: new Date().toISOString(),
    };
  }
}
