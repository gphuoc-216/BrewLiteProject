import { PrismaClient, Role, AccountStatus, OrderStatus, PaymentStatus, PaymentMethod, PromotionType, ReviewStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BrewLite database seeding...');

  // 1. Dọn sạch dữ liệu cũ theo đúng thứ tự khóa ngoại
  await prisma.orderStatusHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.importReceiptItem.deleteMany();
  await prisma.importReceipt.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.account.deleteMany();

  // 2. Hash mật khẩu mẫu
  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. Tạo Tài khoản & Profile
  console.log('👤 Seeding Accounts & Roles...');
  // Admin
  const adminAcc = await prisma.account.create({
    data: {
      username: 'admin',
      passwordHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      admin: {
        create: {
          fullName: 'Trần Văn Quản Trị (Admin)',
          email: 'admin@brewlite.vn',
        },
      },
    },
  });

  // Staff (Baristas)
  const staff1Acc = await prisma.account.create({
    data: {
      username: 'barista1',
      passwordHash,
      role: Role.STAFF,
      status: AccountStatus.ACTIVE,
      staff: {
        create: {
          fullName: 'Nguyễn Văn Pha (Barista 1)',
          email: 'barista1@brewlite.vn',
        },
      },
    },
    include: { staff: true },
  });

  const staff2Acc = await prisma.account.create({
    data: {
      username: 'barista2',
      passwordHash,
      role: Role.STAFF,
      status: AccountStatus.ACTIVE,
      staff: {
        create: {
          fullName: 'Lê Thị Chế (Barista 2)',
          email: 'barista2@brewlite.vn',
        },
      },
    },
    include: { staff: true },
  });

  // Customers
  const cust1Acc = await prisma.account.create({
    data: {
      username: 'customer1',
      passwordHash,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      customer: {
        create: {
          fullName: 'Hoàng Minh Khách',
          email: 'khach1@gmail.com',
          loyaltyPoints: 120,
        },
      },
    },
    include: { customer: true },
  });

  const cust2Acc = await prisma.account.create({
    data: {
      username: 'customer2',
      passwordHash,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      customer: {
        create: {
          fullName: 'Phạm Thu Trang',
          email: 'khach2@gmail.com',
          loyaltyPoints: 45,
        },
      },
    },
    include: { customer: true },
  });

  const cust3Acc = await prisma.account.create({
    data: {
      username: 'customer3',
      passwordHash,
      role: Role.CUSTOMER,
      status: AccountStatus.LOCKED, // Tài khoản bị khóa để test guard
      customer: {
        create: {
          fullName: 'Đỗ Văn Khóa',
          email: 'khach3@gmail.com',
          loyaltyPoints: 0,
        },
      },
    },
  });

  // 4. Nguyên liệu (Ingredients) - Có version cho Optimistic Locking
  console.log('📦 Seeding Ingredients...');
  const ingRobusta = await prisma.ingredient.create({
    data: { name: 'Cà phê hạt Robusta', unit: 'g', stockQuantity: 50000, version: 1 },
  });
  const ingArabica = await prisma.ingredient.create({
    data: { name: 'Cà phê hạt Arabica', unit: 'g', stockQuantity: 30000, version: 1 },
  });
  const ingCondensedMilk = await prisma.ingredient.create({
    data: { name: 'Sữa đặc Ngôi Sao', unit: 'ml', stockQuantity: 25000, version: 1 },
  });
  const ingFreshMilk = await prisma.ingredient.create({
    data: { name: 'Sữa tươi thanh trùng DalatMilk', unit: 'ml', stockQuantity: 40000, version: 1 },
  });
  const ingBlackTea = await prisma.ingredient.create({
    data: { name: 'Trà đen Ceylon', unit: 'g', stockQuantity: 20000, version: 1 },
  });
  const ingOolongTea = await prisma.ingredient.create({
    data: { name: 'Trà Ô Long Mộc Châu', unit: 'g', stockQuantity: 15000, version: 1 },
  });
  const ingPeach = await prisma.ingredient.create({
    data: { name: 'Đào ngâm miếng giòn', unit: 'g', stockQuantity: 10000, version: 1 },
  });
  const ingBoba = await prisma.ingredient.create({
    data: { name: 'Trân châu đường đen', unit: 'g', stockQuantity: 18000, version: 1 },
  });
  const ingCheese = await prisma.ingredient.create({
    data: { name: 'Kem cheese Macchiato', unit: 'ml', stockQuantity: 12000, version: 1 },
  });
  const ingSugar = await prisma.ingredient.create({
    data: { name: 'Nước đường bắp tự nhiên', unit: 'ml', stockQuantity: 35000, version: 1 },
  });

  // 5. Nhà cung cấp & Phiếu nhập (Suppliers & Import Receipts)
  console.log('🚚 Seeding Suppliers & Receipts...');
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Nông Sản Cà Phê Buôn Ma Thuột',
      phone: '0901234567',
      address: 'Km 12, Quốc lộ 14, TP. Buôn Ma Thuột, Đắk Lắk',
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Công ty Cổ phần Sữa & Topping Việt',
      phone: '0912345678',
      address: 'KCN Tân Bình, Q. Tân Phú, TP. Hồ Chí Minh',
    },
  });

  const receipt1 = await prisma.importReceipt.create({
    data: {
      supplierId: supplier1.id,
      totalAmount: 12500000,
      items: {
        create: [
          { ingredientId: ingRobusta.id, quantity: 30000, unitPrice: 200, lineTotal: 6000000 },
          { ingredientId: ingArabica.id, quantity: 20000, unitPrice: 325, lineTotal: 6500000 },
        ],
      },
    },
  });

  // 6. Khuyến mãi (Promotions)
  console.log('🎟️ Seeding Promotions...');
  const promo1 = await prisma.promotion.create({
    data: {
      code: 'BREW10',
      name: 'Giảm 10% cho tín đồ cà phê',
      discountType: PromotionType.PERCENT,
      discountValue: 10,
      quantity: 100,
      usedCount: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });

  const promo2 = await prisma.promotion.create({
    data: {
      code: 'GIAM20K',
      name: 'Giảm ngay 20.000 VNĐ cho đơn từ 60K',
      discountType: PromotionType.FIXED,
      discountValue: 20000,
      quantity: 50,
      usedCount: 2,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });

  const promoExpired = await prisma.promotion.create({
    data: {
      code: 'EXPIRED50',
      name: 'Khuyến mãi đã hết hạn',
      discountType: PromotionType.PERCENT,
      discountValue: 50,
      quantity: 50,
      usedCount: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'ACTIVE',
    },
  });

  const promoOutOfStock = await prisma.promotion.create({
    data: {
      code: 'SOLDOUT',
      name: 'Khuyến mãi đã hết số lượt',
      discountType: PromotionType.FIXED,
      discountValue: 15000,
      quantity: 5,
      usedCount: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });

  // 7. Danh sách 12 Sản phẩm & Biến thể & Công thức (Products, Variants & Recipes)
  console.log('☕ Seeding 12 Products, Variants & Recipes...');
  const productsData = [
    {
      name: 'Cà phê Sữa Đá Truyền Thống',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=60',
      description: 'Hạt cà phê Robusta rang đậm kết hợp sữa đặc ngọt ngào béo ngậy chuẩn vị Sài Gòn.',
      basePrice: 29000,
      ing1: ingRobusta.id, q1: 20,
      ing2: ingCondensedMilk.id, q2: 30,
    },
    {
      name: 'Cà phê Đen Đá Đậm Vị',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=60',
      description: 'Vị đắng thuần khiết, hương thơm nồng nàn từ 100% Robusta Đắk Lắk nguyên chất.',
      basePrice: 25000,
      ing1: ingRobusta.id, q1: 25,
      ing2: ingSugar.id, q2: 15,
    },
    {
      name: 'Bạc Xỉu Sữa Tươi 3 Tầng',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=60',
      description: 'Sự hòa quyện êm dịu giữa sữa đặc, sữa tươi thanh trùng và lớp cà phê thơm lừng.',
      basePrice: 35000,
      ing1: ingFreshMilk.id, q1: 60,
      ing2: ingCondensedMilk.id, q2: 25,
    },
    {
      name: 'Americano Đá Tỉnh Táo',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=60',
      description: 'Chiết xuất từ hạt Arabica thơm chua thanh khiết, thêm nước đá mát lạnh sảng khoái.',
      basePrice: 35000,
      ing1: ingArabica.id, q1: 18,
      ing2: ingSugar.id, q2: 10,
    },
    {
      name: 'Cappuccino Ý Bọt Mịn',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=60',
      description: 'Espresso đậm đà kết hợp sữa nóng đánh bọt mịn màng như nhung rắc bột cacao.',
      basePrice: 45000,
      ing1: ingArabica.id, q1: 20,
      ing2: ingFreshMilk.id, q2: 100,
    },
    {
      name: 'Latte Hạt Dẻ Thơm Béo',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=60',
      description: 'Hương vị nhẹ nhàng, ngọt dịu thích hợp cho những ai yêu thích vị sữa ngậy.',
      basePrice: 49000,
      ing1: ingArabica.id, q1: 18,
      ing2: ingFreshMilk.id, q2: 120,
    },
    {
      name: 'Trà Đào Cam Sả Tươi Mát',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=60',
      description: 'Trà đen ủ lạnh kết hợp đào miếng giòn sần sật, sả đập dập và nước cốt cam tươi.',
      basePrice: 39000,
      ing1: ingBlackTea.id, q1: 15,
      ing2: ingPeach.id, q2: 40,
    },
    {
      name: 'Trà Sữa Ô Long Nướng Trân Châu',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=60',
      description: 'Hương vị trà nướng thơm khói đặc trưng kết hợp sữa béo ngậy và trân châu dai mềm.',
      basePrice: 42000,
      ing1: ingOolongTea.id, q1: 15,
      ing2: ingBoba.id, q2: 50,
    },
    {
      name: 'Trà Sen Vàng Macchiato',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60',
      description: 'Hạt sen bùi béo ninh mềm, nước trà thanh nhẹ phủ lớp kem phô mai Macchiato sánh mịn.',
      basePrice: 45000,
      ing1: ingOolongTea.id, q1: 12,
      ing2: ingCheese.id, q2: 30,
    },
    {
      name: 'Trà Vải Hoa Hồng Băng Tuyết',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&auto=format&fit=crop&q=60',
      description: 'Nước cốt trà đen thanh khiết kết hợp hương vải ngọt lịm và cánh hoa hồng phảng phất.',
      basePrice: 40000,
      ing1: ingBlackTea.id, q1: 12,
      ing2: ingSugar.id, q2: 20,
    },
    {
      name: 'Freeze Cà Phê Bánh Oreo',
      category: 'FREEZE',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60',
      description: 'Đá xay bông tuyết với cà phê Robusta, vụn bánh Oreo giòn tan và kem tươi bông xốp.',
      basePrice: 49000,
      ing1: ingRobusta.id, q1: 15,
      ing2: ingFreshMilk.id, q2: 80,
    },
    {
      name: 'Cà Phê Cốt Dừa Bến Tre',
      category: 'FREEZE',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=60',
      description: 'Món nước đặc sản đá xay cốt dừa ngọt béo hòa cùng vị cà phê đắng nồng nàn.',
      basePrice: 49000,
      ing1: ingRobusta.id, q1: 18,
      ing2: ingCondensedMilk.id, q2: 35,
    },
  ];

  const createdVariants: any[] = [];
  const createdProducts: any[] = [];

  for (const item of productsData) {
    const p = await prisma.product.create({
      data: {
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description,
        variants: {
          create: [
            { size: 'S', price: item.basePrice, topping: 'Tiêu chuẩn' },
            { size: 'M', price: item.basePrice + 6000, topping: 'Tiêu chuẩn' },
            { size: 'L', price: item.basePrice + 12000, topping: 'Kèm Trân châu / Kem' },
          ],
        },
      },
      include: { variants: true },
    });

    createdProducts.push(p);

    // Tạo công thức cho từng size
    for (const v of p.variants) {
      createdVariants.push(v);
      const multiplier = v.size === 'S' ? 1 : v.size === 'M' ? 1.3 : 1.6;
      await prisma.recipe.create({
        data: {
          variantId: v.id,
          ingredientId: item.ing1,
          quantityRequired: Math.round(item.q1 * multiplier),
        },
      });
      await prisma.recipe.create({
        data: {
          variantId: v.id,
          ingredientId: item.ing2,
          quantityRequired: Math.round(item.q2 * multiplier),
        },
      });
    }
  }

  // 8. Đơn hàng mẫu (Orders, Items, Payments, History)
  console.log('📝 Seeding Sample Orders & Reviews...');
  const firstCustomer = cust1Acc.customer!;
  const firstVariant = createdVariants[0];
  const secondVariant = createdVariants[1];

  // Đơn 1: COMPLETED
  const completedOrder = await prisma.order.create({
    data: {
      customerId: firstCustomer.id,
      staffId: staff1Acc.staff!.id,
      promotionId: promo1.id,
      status: OrderStatus.COMPLETED,
      discountAmount: 6400,
      totalAfterDiscount: 57600,
      items: {
        create: [
          { variantId: firstVariant.id, quantity: 1, lineTotal: 29000 },
          { variantId: secondVariant.id, quantity: 1, lineTotal: 35000 },
        ],
      },
      payments: {
        create: {
          idempotencyKey: 'IDEMP-INIT-ORDER-1001',
          amount: 57600,
          status: PaymentStatus.SUCCESS,
          method: PaymentMethod.WALLET,
        },
      },
      statusHistories: {
        create: [
          { fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAID, note: 'Thanh toán ví Momo' },
          { fromStatus: OrderStatus.PAID, toStatus: OrderStatus.PREPARING, actorId: staff1Acc.staff!.id },
          { fromStatus: OrderStatus.PREPARING, toStatus: OrderStatus.READY, actorId: staff1Acc.staff!.id },
          { fromStatus: OrderStatus.READY, toStatus: OrderStatus.COMPLETED, actorId: staff1Acc.staff!.id },
        ],
      },
    },
  });

  // Đánh giá cho đơn COMPLETED (thỏa mãn KiemTraDaMua)
  await prisma.review.create({
    data: {
      customerId: firstCustomer.id,
      productId: createdProducts[0].id,
      orderId: completedOrder.id,
      stars: 5,
      content: 'Cà phê sữa đá siêu ngon, ngọt vừa vặn và thơm lừng hạt Robusta Đắk Lắk!',
      status: ReviewStatus.VISIBLE,
    },
  });

  // Đơn 2: PAID (Chờ Barista pha chế trên Kanban)
  await prisma.order.create({
    data: {
      customerId: cust2Acc.customer!.id,
      status: OrderStatus.PAID,
      discountAmount: 0,
      totalAfterDiscount: 70000,
      items: {
        create: [
          { variantId: createdVariants[3].id, quantity: 2, lineTotal: 70000 },
        ],
      },
      payments: {
        create: {
          idempotencyKey: 'IDEMP-INIT-ORDER-1002',
          amount: 70000,
          status: PaymentStatus.SUCCESS,
          method: PaymentMethod.CARD,
        },
      },
      statusHistories: {
        create: [
          { fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAID, note: 'Thanh toán thẻ thành công' },
        ],
      },
    },
  });

  // Đơn 3: PREPARING (Đang pha chế)
  await prisma.order.create({
    data: {
      customerId: firstCustomer.id,
      staffId: staff2Acc.staff!.id,
      status: OrderStatus.PREPARING,
      discountAmount: 0,
      totalAfterDiscount: 45000,
      items: {
        create: [
          { variantId: createdVariants[4].id, quantity: 1, lineTotal: 45000 },
        ],
      },
      statusHistories: {
        create: [
          { fromStatus: OrderStatus.PENDING, toStatus: OrderStatus.PAID },
          { fromStatus: OrderStatus.PAID, toStatus: OrderStatus.PREPARING, actorId: staff2Acc.staff!.id },
        ],
      },
    },
  });

  console.log('✅ Database initialization completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
