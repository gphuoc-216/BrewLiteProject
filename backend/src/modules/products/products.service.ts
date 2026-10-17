import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; category?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          variants: {
            orderBy: { price: 'asc' },
          },
          reviews: {
            where: { status: 'VISIBLE' },
            select: { stars: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedItems = items.map((p) => {
      const totalStars = p.reviews.reduce((acc, r) => acc + r.stars, 0);
      const avgRating = p.reviews.length > 0 ? Number((totalStars / p.reviews.length).toFixed(1)) : 5.0;
      const minPrice = p.variants.length > 0 ? p.variants[0].price : 0;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        imageUrl: p.imageUrl,
        description: p.description,
        minPrice,
        rating: avgRating,
        reviewCount: p.reviews.length,
        variants: p.variants,
      };
    });

    return {
      items: formattedItems,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { price: 'asc' },
          include: {
            recipes: {
              include: {
                ingredient: true,
              },
            },
          },
        },
        reviews: {
          where: { status: 'VISIBLE' },
          include: {
            customer: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy thông tin sản phẩm đồ uống');
    }

    const totalStars = product.reviews.reduce((acc, r) => acc + r.stars, 0);
    const avgRating = product.reviews.length > 0 ? Number((totalStars / product.reviews.length).toFixed(1)) : 5.0;

    return {
      ...product,
      avgRating,
      reviewCount: product.reviews.length,
    };
  }
}
