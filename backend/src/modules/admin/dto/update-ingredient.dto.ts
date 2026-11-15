import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateIngredientDto {
  @ApiPropertyOptional({ description: 'Tên nguyên liệu mới', example: 'Cà phê Robusta Đắk Lắk' })
  @IsString({ message: 'Tên nguyên liệu phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Đơn vị tính', example: 'gram' })
  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Số lượng tồn kho (tuyệt đối không âm)', example: 5000, minimum: 0 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tồn kho phải là định dạng số' })
  @Min(0, { message: 'Số lượng tồn kho không được là số âm' })
  @IsOptional()
  stockQuantity?: number;
}
