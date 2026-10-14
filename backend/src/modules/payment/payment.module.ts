import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MockGatewayService } from './mock-gateway/mock-gateway.service';
import { MockGatewayController } from './mock-gateway/mock-gateway.controller';

@Module({
  controllers: [PaymentController, MockGatewayController],
  providers: [PaymentService, MockGatewayService],
  exports: [PaymentService, MockGatewayService],
})
export class PaymentModule {}
