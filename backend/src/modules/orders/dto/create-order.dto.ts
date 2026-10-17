import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'ID biến thể món (size, topping)' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ description: 'Số lượng ly đặt', example: 1 })
  @IsNumber()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto], description: 'Danh sách các món đặt trong giỏ' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Mã voucher khuyến mãi (nếu có)', example: 'BREW10' })
  @IsOptional()
  @IsString()
  promotionCode?: string;
}
