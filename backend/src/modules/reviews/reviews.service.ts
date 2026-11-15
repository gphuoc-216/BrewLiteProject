import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, ReviewStatus } from '@prisma/client';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID của sản phẩm cần đánh giá' })
  @IsString({ message: 'Mã sản phẩm phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã sản phẩm không được để trống' })
  productId: string;

  @ApiPropertyOptional({ description: 'ID của đơn hàng đã mua' })
  @IsString({ message: 'Mã đơn hàng phải là chuỗi ký tự' })
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Số sao đánh giá (1-5 sao)', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt({ message: 'Số sao đánh giá phải là số nguyên' })
  @Min(1, { message: 'Đánh giá tối thiểu 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa 5 sao' })
  stars: number;

  @ApiPropertyOptional({ description: 'Nội dung nhận xét chi tiết' })
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi ký tự' })
  @IsOptional()
  content?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'Số sao đánh giá (1-5 sao)', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt({ message: 'Số sao đánh giá phải là số nguyên' })
  @Min(1, { message: 'Đánh giá tối thiểu 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa 5 sao' })
  @IsOptional()
  stars?: number;

  @ApiPropertyOptional({ description: 'Nội dung nhận xét chi tiết' })
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi ký tự' })
  @IsOptional()
  content?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(actorId: string, dto: CreateReviewDto) {
    if (!dto.productId) {
      throw new BadRequestException('Mã sản phẩm không được để trống');
    }
    if (dto.stars < 1 || dto.stars > 5) {
      throw new BadRequestException('Số sao đánh giá phải từ 1 đến 5 sao');
    }

    const effectiveProductId = dto.productId.trim();

    let finalCustId = '';
    try {
      const directCustomer = await this.prisma.customer.findUnique({ where: { id: actorId } });
        if (directCustomer) {
          finalCustId = directCustomer.id;
        } else {
          const account = await this.prisma.account.findFirst({
            where: {
              OR: [{ id: actorId }, { customer: { id: actorId } }],
            },
            include: { customer: true },
          });
          if (account?.customer) {
            finalCustId = account.customer.id;
          }
        }
      } catch (err: any) {
        console.error(
          JSON.stringify({
            level: 'ERROR',
            module: 'ReviewsService',
            event: 'resolveCustomer_failed',
            actorId,
            error: err?.message,
          }),
        );
      }

      if (!finalCustId) {
        throw new ForbiddenException('Không tìm thấy hồ sơ khách hàng hợp lệ để đánh giá');
      }

      try {
        // 2. Xác thực sản phẩm tồn tại trong CSDL (không tự ý tạo bản ghi giả)
        const prodRecord = await this.prisma.product.findUnique({
          where: { id: effectiveProductId },
        });
        if (!prodRecord) {
          throw new NotFoundException('Không tìm thấy sản phẩm cần đánh giá');
        }

        // 3. KiemTraDaMua: Chỉ cho phép đánh giá nếu có đơn hàng COMPLETED thuộc khách hàng này chứa món đồ uống
        let verifiedOrder: any = null;
        if (dto.orderId) {
          const candidateOrder = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { items: { include: { variant: true } } },
          });
          const hasMatchingItem = candidateOrder?.items?.some(
            (i: any) =>
              i.variant?.productId === effectiveProductId || i.variantId === effectiveProductId,
          );
          if (
            candidateOrder &&
            candidateOrder.customerId === finalCustId &&
            candidateOrder.status === OrderStatus.COMPLETED &&
            hasMatchingItem
          ) {
            verifiedOrder = candidateOrder;
          }
        } else {
          verifiedOrder = await this.prisma.order.findFirst({
            where: {
              customerId: finalCustId,
              status: OrderStatus.COMPLETED,
              items: {
                some: {
                  variant: { productId: effectiveProductId },
                },
              },
            },
            include: { items: { include: { variant: true } } },
            orderBy: { createdAt: 'desc' },
          });
        }

        if (!verifiedOrder) {
          throw new ForbiddenException(
            'Bạn chỉ có thể đánh giá sau khi đã mua và nhận hoàn tất (COMPLETED) món đồ uống này!',
          );
        }

        // 4. Chặn đánh giá trùng lặp cho cùng 1 sản phẩm bởi 1 khách hàng
        const existingReview = await this.prisma.review.findFirst({
          where: {
            customerId: finalCustId,
            productId: effectiveProductId,
          },
        });

        if (existingReview) {
          throw new ConflictException(
            'Bạn đã đánh giá món đồ uống này rồi. Bạn chỉ có thể sửa hoặc xóa đánh giá hiện có!',
          );
        }

        return await this.prisma.review.create({
          data: {
            customerId: finalCustId,
            productId: effectiveProductId,
            orderId: verifiedOrder.id,
            stars: dto.stars,
            content: dto.content || 'Đồ uống rất ngon và vừa miệng!',
            status: ReviewStatus.VISIBLE,
          },
          include: {
            customer: { select: { fullName: true } },
            product: { select: { name: true } },
          },
        });
      } catch (err: any) {
        if (err instanceof HttpException) {
          throw err;
        }
        console.error(
          JSON.stringify({
            level: 'ERROR',
            module: 'ReviewsService',
            event: 'createReview_db_error',
            actorId,
            productId: effectiveProductId,
            error: err?.message,
          }),
        );
        throw new BadRequestException('Không thể lưu đánh giá vào hệ thống');
    }
  }

  async updateReview(reviewId: string, actorId: string, stars?: number, content?: string) {
    if (stars && (stars < 1 || stars > 5)) {
      throw new BadRequestException('Số sao đánh giá phải từ 1 đến 5 sao');
    }
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

    if (review.customerId !== actorId) {
      const cust = await this.prisma.customer.findFirst({
        where: {
          OR: [{ id: actorId }, { accountId: actorId }],
        },
      });
      if (!cust || cust.id !== review.customerId) {
        throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
      }
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(stars ? { stars } : {}),
        ...(content !== undefined ? { content } : {}),
      },
      include: {
        customer: { select: { fullName: true } },
        product: { select: { name: true } },
      },
    });
  }

  async deleteReview(reviewId: string, actorId: string, _role?: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    if (review.customerId !== actorId) {
      const cust = await this.prisma.customer.findFirst({
        where: {
          OR: [{ id: actorId }, { accountId: actorId }],
        },
      });
      if (!cust || cust.id !== review.customerId) {
        throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
      }
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Đã xóa đánh giá thành công', reviewId };
  }
}
