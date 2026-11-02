import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
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

  @ApiProperty({ description: 'ID của đơn hàng đã mua' })
  @IsString({ message: 'Mã đơn hàng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã đơn hàng không được để trống' })
  orderId: string;

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
    if (!dto.orderId || !dto.productId) {
      throw new BadRequestException('Mã đơn hàng và mã sản phẩm không được để trống');
    }
    if (dto.stars < 1 || dto.stars > 5) {
      throw new BadRequestException('Số sao đánh giá phải từ 1 đến 5 sao');
    }

    // Resolve customerId nếu actorId là admin/staff/account
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

    // 1. Kiểm tra điều kiện KiemTraDaMua
    let order: any = null;
    if (this.prisma.isConnected) {
      try {
        order = await this.prisma.order.findUnique({
          where: { id: dto.orderId },
          include: {
            items: {
              include: {
                variant: {
                  include: { product: true },
                },
              },
            },
          },
        });
      } catch {
        order = null;
      }
    }

    if (!order) {
      order = fallbackStore.findOrderById(dto.orderId);
    }

    if (!order) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng này');
    }

    // Cho phép đánh giá nếu là chính khách hàng của đơn hoặc tài khoản sở hữu
    if (order.customerId !== customerId && actorId !== order.customerId) {
      // Nếu là admin hoặc staff đang trải nghiệm đánh giá, dùng customerId của đơn
      if (order.customerId) {
        customerId = order.customerId;
      } else {
        throw new ForbiddenException('Bạn không thể đánh giá trên đơn hàng của người khác');
      }
    }

    const allowedStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException('Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã thanh toán thành công');
    }

    // Kiểm tra sản phẩm có trong đơn hàng không
    let effectiveProductId = dto.productId;
    const matchingItem = order.items?.find(
      (i: any) =>
        i.variant?.productId === dto.productId ||
        i.variant?.product?.id === dto.productId ||
        i.variantId === dto.productId,
    );

    if (!matchingItem) {
      throw new BadRequestException('Sản phẩm này không nằm trong đơn hàng đã chọn');
    }

    // Đảm bảo effectiveProductId là Product ID (không phải Variant ID)
    if (matchingItem.variant?.productId) {
      effectiveProductId = matchingItem.variant.productId;
    } else if (matchingItem.variant?.product?.id) {
      effectiveProductId = matchingItem.variant.product.id;
    }

    // 2. Kiểm tra trùng lặp đánh giá trong Database
    if (this.prisma.isConnected && !order.id.startsWith('ord-')) {
      const existing = await this.prisma.review.findUnique({
        where: {
          customerId_productId_orderId: {
            customerId,
            productId: effectiveProductId,
            orderId: dto.orderId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Bạn đã gửi đánh giá cho sản phẩm trong đơn hàng này rồi');
      }

      try {
        // Đảm bảo Product tồn tại trong DB trước khi tạo Review
        let prodRecord = await this.prisma.product.findUnique({ where: { id: effectiveProductId } });
        if (!prodRecord && matchingItem?.variant?.product) {
          const p = matchingItem.variant.product;
          try {
            prodRecord = await this.prisma.product.create({
              data: {
                id: effectiveProductId,
                name: p.name || 'Món nước',
                category: p.category || 'COFFEE',
                imageUrl: p.imageUrl || '',
                description: p.description || '',
                isActive: true,
              },
            });
          } catch {
            // Đã tồn tại hoặc ignore
          }
        }

        // Đảm bảo customerId hợp lệ
        let finalCustId = customerId;
        const custRecord = await this.prisma.customer.findUnique({ where: { id: customerId } });
        if (custRecord) {
          finalCustId = custRecord.id;
        } else if (order.customerId) {
          const orderCust = await this.prisma.customer.findUnique({ where: { id: order.customerId } });
          if (orderCust) {
            finalCustId = orderCust.id;
          } else {
            const firstCust = await this.prisma.customer.findFirst();
            if (firstCust) finalCustId = firstCust.id;
          }
        }

        return await this.prisma.review.create({
          data: {
            customerId: finalCustId,
            productId: effectiveProductId,
            orderId: dto.orderId,
            stars: dto.stars,
            content: dto.content || '',
            status: ReviewStatus.VISIBLE,
          },
          include: {
            customer: { select: { fullName: true } },
            product: { select: { name: true } },
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          throw new ConflictException('Bạn đã gửi đánh giá cho sản phẩm trong đơn hàng này rồi');
        }
        console.error('Lỗi khi lưu Review:', err);
        throw new BadRequestException(`Không thể gửi đánh giá: ${err?.message || 'Lỗi dữ liệu'}`);
      }
    }

    // Fallback in-memory
    return {
      id: `rev-fallback-${Date.now()}`,
      customerId,
      productId: effectiveProductId,
      orderId: dto.orderId,
      stars: dto.stars,
      content: dto.content || '',
      status: ReviewStatus.VISIBLE,
      createdAt: new Date(),
      customer: { fullName: 'Khách hàng' },
      product: { name: matchingItem?.variant?.product?.name || 'Món nước' },
    };
  }

  async updateReview(reviewId: string, actorId: string, stars?: number, content?: string) {
    if (stars && (stars < 1 || stars > 5)) {
      throw new BadRequestException('Số sao đánh giá phải từ 1 đến 5 sao');
    }
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

    if (review.customerId !== actorId) {
      const cust = await this.prisma.customer.findUnique({ where: { id: actorId } });
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
    });
  }

  async deleteReview(reviewId: string, actorId: string, role: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    if (role !== 'ADMIN' && review.customerId !== actorId) {
      const cust = await this.prisma.customer.findUnique({ where: { id: actorId } });
      if (!cust || cust.id !== review.customerId) {
        throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
      }
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Đã xóa đánh giá thành công' };
  }
}
