import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const SAMPLE_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Cà phê Sữa Đá Truyền Thống',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description: 'Hạt cà phê Robusta rang đậm kết hợp sữa đặc ngọt ngào béo ngậy chuẩn vị Sài Gòn.',
    minPrice: 29000,
    rating: 4.9,
    reviewCount: 128,
    variants: [
      { id: 'var-001-s', size: 'S', price: 29000 },
      { id: 'var-001-m', size: 'M', price: 35000 },
      { id: 'var-001-l', size: 'L', price: 42000 },
    ],
  },
  {
    id: 'prod-002',
    name: 'Cà phê Đen Đá Đậm Vị',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    description: 'Vị đắng thuần khiết, hương thơm nồng nàn từ 100% Robusta Đắk Lắk nguyên chất.',
    minPrice: 25000,
    rating: 4.8,
    reviewCount: 96,
    variants: [
      { id: 'var-002-s', size: 'S', price: 25000 },
      { id: 'var-002-m', size: 'M', price: 30000 },
      { id: 'var-002-l', size: 'L', price: 36000 },
    ],
  },
  {
    id: 'prod-003',
    name: 'Bạc Xỉu Sữa Tươi 3 Tầng',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
    description: 'Sự hòa quyện êm dịu giữa sữa đặc, sữa tươi thanh trùng và lớp cà phê thơm lừng.',
    minPrice: 35000,
    rating: 4.9,
    reviewCount: 154,
    variants: [
      { id: 'var-003-s', size: 'S', price: 35000 },
      { id: 'var-003-m', size: 'M', price: 42000 },
      { id: 'var-003-l', size: 'L', price: 49000 },
    ],
  },
  {
    id: 'prod-004',
    name: 'Americano Đá Tỉnh Táo',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=80',
    description: 'Chiết xuất từ hạt Arabica thơm chua thanh khiết, thêm nước đá mát lạnh sảng khoái.',
    minPrice: 35000,
    rating: 4.7,
    reviewCount: 82,
    variants: [
      { id: 'var-004-s', size: 'S', price: 35000 },
      { id: 'var-004-m', size: 'M', price: 40000 },
      { id: 'var-004-l', size: 'L', price: 45000 },
    ],
  },
  {
    id: 'prod-005',
    name: 'Cappuccino Ý Bọt Mịn',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
    description: 'Espresso đậm đà kết hợp sữa nóng đánh bọt mịn màng như nhung rắc bột cacao.',
    minPrice: 45000,
    rating: 4.9,
    reviewCount: 110,
    variants: [
      { id: 'var-005-s', size: 'S', price: 45000 },
      { id: 'var-005-m', size: 'M', price: 52000 },
      { id: 'var-005-l', size: 'L', price: 58000 },
    ],
  },
  {
    id: 'prod-006',
    name: 'Trà Đào Cam Sả Tươi Mát',
    category: 'TEA',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description: 'Hương thơm nồng ấm của sả tươi, vị chua thanh của cam vàng và miếng đào giòn ngọt.',
    minPrice: 39000,
    rating: 4.9,
    reviewCount: 210,
    variants: [
      { id: 'var-006-s', size: 'S', price: 39000 },
      { id: 'var-006-m', size: 'M', price: 45000 },
      { id: 'var-006-l', size: 'L', price: 52000 },
    ],
  },
  {
    id: 'prod-007',
    name: 'Trà Sữa Ô Long Nướng Trân Châu',
    category: 'TEA',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371b26f743c?w=600&auto=format&fit=crop&q=80',
    description: 'Vị trà Ô Long đượm khói rang thơm quyến rũ hòa quyện cùng trân châu đen dai giòn.',
    minPrice: 42000,
    rating: 4.8,
    reviewCount: 175,
    variants: [
      { id: 'var-007-s', size: 'S', price: 42000 },
      { id: 'var-007-m', size: 'M', price: 48000 },
      { id: 'var-007-l', size: 'L', price: 55000 },
    ],
  },
  {
    id: 'prod-008',
    name: 'Caramel Macchiato Đá Xay',
    category: 'FREEZE',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
    description: 'Đá xay mát lạnh từ cà phê espresso thượng hạng, sốt caramel béo ngậy và kem tươi.',
    minPrice: 49000,
    rating: 4.9,
    reviewCount: 142,
    variants: [
      { id: 'var-008-s', size: 'S', price: 49000 },
      { id: 'var-008-m', size: 'M', price: 55000 },
      { id: 'var-008-l', size: 'L', price: 62000 },
    ],
  },
];

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async findAll(query: { search?: string; category?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
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

      if (items && items.length > 0) {
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
    } catch (e) {
      // Prisma error / DB offline -> Fallback to sample data
    }

    // Fallback: Lọc từ dữ liệu mẫu (Sample data)
    let filtered = [...SAMPLE_PRODUCTS];
    if (query.category && query.category !== 'ALL') {
      filtered = filtered.filter((p) => p.category === query.category);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s));
    }

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    return {
      items: paged,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        dataSource: 'sample_data_fallback',
      },
    };
  }

  async findOne(id: string) {
    try {
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

      if (product) {
        const totalStars = product.reviews.reduce((acc, r) => acc + r.stars, 0);
        const avgRating = product.reviews.length > 0 ? Number((totalStars / product.reviews.length).toFixed(1)) : 5.0;

        return {
          ...product,
          avgRating,
          reviewCount: product.reviews.length,
        };
      }
    } catch (e) {
      // DB offline fallback
    }

    const sample = SAMPLE_PRODUCTS.find((p) => p.id === id);
    if (!sample) {
      throw new NotFoundException('Không tìm thấy thông tin sản phẩm đồ uống');
    }
    return sample;
  }
}
