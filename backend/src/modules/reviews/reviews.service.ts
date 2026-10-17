import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  productId: string;
  orderId: string;
  stars: number;
  content: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(customerId: string, dto: CreateReviewDto) {
    if (dto.stars < 1 || dto.stars > 5) {
      throw new BadRequestException('Số sao đánh giá phải từ 1 đến 5 sao');
    }

    // 1. Kiểm tra điều kiện KiemTraDaMua
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng này');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Bạn không thể đánh giá trên đơn hàng của người khác');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã hoàn tất (COMPLETED)');
    }

    // Kiểm tra sản phẩm có trong đơn hàng không
    const hasProduct = order.items.some((i) => i.variant.productId === dto.productId);
    if (!hasProduct) {
      throw new BadRequestException('Sản phẩm này không nằm trong đơn hàng đã chọn');
    }

    // 2. Kiểm tra trùng lặp đánh giá
    const existing = await this.prisma.review.findUnique({
      where: {
        customerId_productId_orderId: {
          customerId,
          productId: dto.productId,
          orderId: dto.orderId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Bạn đã gửi đánh giá cho sản phẩm trong đơn hàng này rồi');
    }

    return this.prisma.review.create({
      data: {
        customerId,
        productId: dto.productId,
        orderId: dto.orderId,
        stars: dto.stars,
        content: dto.content,
        status: ReviewStatus.VISIBLE,
      },
      include: {
        customer: { select: { fullName: true } },
        product: { select: { name: true } },
      },
    });
  }

  async updateReview(reviewId: string, customerId: string, stars?: number, content?: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    if (review.customerId !== customerId) throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(stars ? { stars } : {}),
        ...(content ? { content } : {}),
      },
    });
  }

  async deleteReview(reviewId: string, customerId: string, role: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    if (role !== 'ADMIN' && review.customerId !== customerId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Đã xóa đánh giá thành công' };
  }
}
