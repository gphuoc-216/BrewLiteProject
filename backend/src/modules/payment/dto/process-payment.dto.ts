import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class ProcessPaymentDto {
  @ApiProperty({
    example: '1f86ddf8-3a10-48d4-9ddc-28944a7108b3',
    description: 'ID đơn hàng cần thực hiện thanh toán',
  })
  @IsString({ message: 'Mã đơn hàng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã đơn hàng không được để trống' })
  orderId: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.WALLET,
    description: 'Phương thức thanh toán không tiền mặt (WALLET hoặc CARD)',
  })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán phải là WALLET hoặc CARD' })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  method: PaymentMethod;

  @ApiPropertyOptional({
    enum: ['FAIL', 'TIMEOUT'],
    description: 'Mô phỏng lỗi thanh toán cho mục đích kiểm thử (Task 10)',
  })
  @IsOptional()
  @IsEnum(['FAIL', 'TIMEOUT'], { message: 'Lỗi mô phỏng không hợp lệ' })
  simulateError?: 'FAIL' | 'TIMEOUT';
}
