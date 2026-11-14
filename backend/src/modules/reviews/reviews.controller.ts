import { Controller, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService, CreateReviewDto, UpdateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Đánh giá Sản phẩm (Reviews)')
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi đánh giá món đã mua (Kiểm tra KiemTraDaMua)' })
  createReview(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    const actorId = user.customerId || user.profileId || '';
    return this.reviewsService.createReview(actorId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa đánh giá của chính mình' })
  updateReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateReviewDto,
  ) {
    const actorId = user.customerId || user.profileId || '';
    return this.reviewsService.updateReview(id, actorId, dto.stars, dto.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đánh giá của chính mình' })
  deleteReview(@Param('id') id: string, @CurrentUser() user: any) {
    const actorId = user.customerId || user.profileId || '';
    return this.reviewsService.deleteReview(id, actorId, user.role);
  }
}
