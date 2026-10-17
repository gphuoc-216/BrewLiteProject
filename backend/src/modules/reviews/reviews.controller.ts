import { Controller, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Đánh giá Sản phẩm (Reviews)')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi đánh giá món đã mua (Kiểm tra KiemTraDaMua)' })
  createReview(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.profileId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa đánh giá của chính mình' })
  updateReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('stars') stars?: number,
    @Body('content') content?: string,
  ) {
    return this.reviewsService.updateReview(id, user.profileId, stars, content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đánh giá của chính mình' })
  deleteReview(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.deleteReview(id, user.profileId, user.role);
  }
}
