import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { PromotionsService } from './promotions.service';

class ValidatePromoDto {
  @ApiProperty({ example: 'BREW10', description: 'Mã voucher' })
  @IsString()
  @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
  code: string;

  @ApiProperty({ example: 50000, description: 'Tổng tiền hàng trước giảm' })
  @IsNumber()
  @Min(0)
  orderSubtotal: number;
}


@ApiTags('Khuyến mãi (Promotions)')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('available')
  @ApiOperation({ summary: 'Lấy danh sách các voucher khả dụng và tiến trình đạt điều kiện' })
  @ApiResponse({ status: 200, description: 'Danh sách voucher khả dụng' })
  getAvailable(@Query('subtotal') subtotal?: string) {
    return this.promotionsService.getAvailablePromotions(Number(subtotal) || 0);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Kiểm tra và tính toán mức giảm giá của voucher' })
  @ApiResponse({ status: 200, description: 'Mã hợp lệ và thông tin giảm giá' })
  @ApiResponse({ status: 400, description: 'Mã hết hạn hoặc hết lượt' })
  validate(@Body() body: ValidatePromoDto) {
    return this.promotionsService.validatePromotion(body.code, body.orderSubtotal);
  }
}

