import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class ValidatePromoDto {
  code: string;
  orderSubtotal: number;
}

@ApiTags('Khuyến mãi (Promotions)')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra và tính toán mức giảm giá của voucher' })
  @ApiResponse({ status: 200, description: 'Mã hợp lệ và thông tin giảm giá' })
  @ApiResponse({ status: 400, description: 'Mã hết hạn hoặc hết lượt' })
  validate(@Body() body: ValidatePromoDto) {
    return this.promotionsService.validatePromotion(body.code, body.orderSubtotal);
  }
}
