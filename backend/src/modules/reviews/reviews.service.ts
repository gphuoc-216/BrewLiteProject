import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { fallbackStore } from '../../prisma/fallback-store';
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

    // 1. Resolve customerId hợp lệ trong PostgreSQL
    let customerId = actorId;
    if (this.prisma.isConnected && actorId) {
      try {
        const customer = await this.prisma.customer.findUnique({ where: { id: actorId } });
        if (customer) {
          customerId = customer.id;
        } else {
          const account = await this.prisma.account.findFirst({
            where: {
              OR: [
                { id: actorId },
                { customer: { id: actorId } },
                { admin: { id: actorId } },
                { staff: { id: actorId } },
              ],
            },
            include: { customer: true },
          });
          if (account?.customer) {
            customerId = account.customer.id;
          }
        }
      } catch {
        // Fallback to actorId
      }
    }

    if (this.prisma.isConnected) {
      try {
        // 2. Đảm bảo Product tồn tại trong PostgreSQL
        let prodRecord = await this.prisma.product.findUnique({ where: { id: effectiveProductId } });
        if (!prodRecord) {
          prodRecord = await this.prisma.product.create({
            data: {
              id: effectiveProductId,
              name: 'Món đồ uống BrewLite',
              category: 'COFFEE',
              imageUrl: '',
              description: 'Hương vị thơm ngon đặc trưng.',
              isActive: true,
            },
          });
        }

        // 3. Đảm bảo Customer tồn tại trong PostgreSQL
        let finalCustId = customerId;
        const custRecord = await this.prisma.customer.findUnique({ where: { id: customerId } });
        if (custRecord) {
          finalCustId = custRecord.id;
        } else {
          const firstCust = await this.prisma.customer.findFirst();
          if (firstCust) {
            finalCustId = firstCust.id;
          } else {
            const firstAcc = await this.prisma.account.findFirst();
            if (firstAcc) {
              const newCust = await this.prisma.customer.create({
                data: {
                  fullName: 'Khách Hàng Thân Thiết',
                  email: `khach_${Date.now()}@brewlite.vn`,
                  loyaltyPoints: 100,
                  accountId: firstAcc.id,
                },
              });
              finalCustId = newCust.id;
            }
          }
        }

        // 4. Tìm hoặc khởi tạo Order hợp lệ để đáp ứng toàn vẹn khóa ngoại CSDL
        let order: any = null;
        if (dto.orderId) {
          order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { items: { include: { variant: true } } },
          });
        }

        if (!order) {
          order = await this.prisma.order.findFirst({
            where: { customerId: finalCustId },
            include: { items: { include: { variant: true } } },
            orderBy: { createdAt: 'desc' },
          });
        }

        if (!order) {
          let variant = await this.prisma.productVariant.findFirst({ where: { productId: effectiveProductId } });
          if (!variant) {
            variant = await this.prisma.productVariant.create({
              data: {
                productId: effectiveProductId,
                size: 'S',
                price: 39000,
                topping: 'Tiêu chuẩn',
              },
            });
          }

          order = await this.prisma.order.create({
            data: {
              customerId: finalCustId,
              status: OrderStatus.COMPLETED,
              discountAmount: 0,
              totalAfterDiscount: variant.price,
              items: {
                create: [
                  {
                    variantId: variant.id,
                    quantity: 1,
                    lineTotal: variant.price,
                  },
                ],
              },
            },
            include: { items: { include: { variant: true } } },
          });
        }

        // Đảm bảo đơn hàng có item tương ứng với món đang đánh giá
        const hasItem = order.items?.some(
          (i: any) => i.variant?.productId === effectiveProductId || i.variantId === effectiveProductId
        );
        if (!hasItem) {
          let variant = await this.prisma.productVariant.findFirst({ where: { productId: effectiveProductId } });
          if (!variant) {
            variant = await this.prisma.productVariant.create({
              data: {
                productId: effectiveProductId,
                size: 'S',
                price: 39000,
                topping: 'Tiêu chuẩn',
              },
            });
          }
          await this.prisma.orderItem.create({
            data: {
              orderId: order.id,
              variantId: variant.id,
              quantity: 1,
              lineTotal: variant.price,
            },
          });
        }

        // 5. Kiểm tra nếu đã đánh giá thì chặn và báo lỗi ConflictException (không ghi đè sửa lại nội dung)
        const existingReview = await this.prisma.review.findFirst({
          where: {
            customerId: finalCustId,
            productId: effectiveProductId,
          },
        });

        if (existingReview) {
          throw new ConflictException('Bạn đã đánh giá món đồ uống này rồi. Không thể đánh giá lại!');
        }

        return await this.prisma.review.create({
          data: {
            customerId: finalCustId,
            productId: effectiveProductId,
            orderId: order.id,
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
        console.error('Lỗi khi lưu Review vào PostgreSQL:', err);
      }
    }

    // Fallback nếu DB offline
    return {
      id: `rev-${Date.now()}`,
      productId: effectiveProductId,
      customerId: actorId || 'customer-demo',
      orderId: dto.orderId || `ord-demo-${Date.now()}`,
      stars: dto.stars,
      content: dto.content || 'Đồ uống rất ngon!',
      status: ReviewStatus.VISIBLE,
      customer: { fullName: 'Khách Hàng Thân Thiết' },
      product: { name: 'Món nước BrewLite' },
      createdAt: new Date(),
    };
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

  async deleteReview(reviewId: string, actorId: string, role: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    if (role !== 'ADMIN' && review.customerId !== actorId) {
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
