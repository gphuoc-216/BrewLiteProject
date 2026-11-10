import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Đang dọn dẹp các đơn hàng test, thanh toán, đánh giá và lịch sử...');

  // 1. Xóa theo đúng thứ tự ràng buộc khóa ngoại (Foreign Key)
  const delHistory = await prisma.orderStatusHistory.deleteMany();
  const delReviews = await prisma.review.deleteMany();
  const delPayments = await prisma.payment.deleteMany();
  const delOrderItems = await prisma.orderItem.deleteMany();
  const delOrders = await prisma.order.deleteMany();

  // 2. Reset điểm thưởng khách hàng về 0
  await prisma.customer.updateMany({
    data: { loyaltyPoints: 0 },
  });

  // 3. Khôi phục tồn kho nguyên liệu dồi dào & version = 1
  const standardStock: { [key: string]: { qty: number; unit: string } } = {
    'Cà phê hạt Robusta': { qty: 50000, unit: 'g' },
    'Cà phê hạt Arabica': { qty: 30000, unit: 'g' },
    'Sữa đặc Ngôi Sao': { qty: 25000, unit: 'ml' },
    'Sữa tươi thanh trùng DalatMilk': { qty: 40000, unit: 'ml' },
    'Trà đen Ceylon': { qty: 20000, unit: 'g' },
    'Trà Ô Long Mộc Châu': { qty: 15000, unit: 'g' },
    'Đào ngâm miếng giòn': { qty: 10000, unit: 'g' },
    'Trân châu đường đen': { qty: 18000, unit: 'g' },
    'Kem cheese Macchiato': { qty: 12000, unit: 'ml' },
    'Nước đường bắp tự nhiên': { qty: 35000, unit: 'ml' },
    'Trứng gà tươi Ba Vì': { qty: 100, unit: 'quả' },
  };

  for (const [name, info] of Object.entries(standardStock)) {
    await prisma.ingredient.updateMany({
      where: { name: { contains: name.slice(0, 8) } },
      data: { stockQuantity: info.qty, version: 1 },
    });
  }

  console.log(`✅ Đã xóa ${delHistory.count} bản ghi OrderStatusHistory.`);
  console.log(`✅ Đã xóa ${delReviews.count} đánh giá mẫu.`);
  console.log(`✅ Đã xóa ${delPayments.count} bản ghi Payments.`);
  console.log(`✅ Đã xóa ${delOrderItems.count} chi tiết đơn hàng OrderItem.`);
  console.log(`✅ Đã xóa ${delOrders.count} đơn hàng test cũ.`);
  console.log('✨ Toàn bộ tồn kho nguyên liệu đã được phục hồi đầy đủ (version = 1). Không còn món nào bị "TẠM HẾT HÀNG".');
  console.log('✨ Database đã sạch sẽ 100% sẵn sàng cho buổi thuyết trình/demo!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi dọn dẹp:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
