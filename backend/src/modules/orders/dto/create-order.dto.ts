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

  @ApiPropertyOptional({ description: 'Danh sách topping thêm (Shopee/Grab model)', example: ['Khúc bạch phô mai', 'Trân châu đường đen'] })
  @IsOptional()
  @IsArray()
  toppings?: string[];
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

  @ApiPropertyOptional({ description: 'Số điểm thưởng muốn sử dụng để trừ tiền (1 điểm = 100 VNĐ)', example: 10 })
  @IsOptional()
  @IsNumber()
  loyaltyPointsToUse?: number;
}
