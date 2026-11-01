import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Đang dọn dẹp các đơn hàng test và lịch sử trạng thái cũ...');

  // Xóa theo đúng thứ tự ràng buộc khóa ngoại (Foreign Key)
  const delHistory = await prisma.orderStatusHistory.deleteMany();
  const delReviews = await prisma.review.deleteMany();
  const delPayments = await prisma.payment.deleteMany();
  const delOrderItems = await prisma.orderItem.deleteMany();
  const delOrders = await prisma.order.deleteMany();

  // Reset điểm thưởng về 0
  await prisma.customer.updateMany({
    data: { loyaltyPoints: 0 },
  });

  // Khôi phục tồn kho nguyên liệu về mức dồi dào (30.000g)
  await prisma.ingredient.updateMany({
    data: { stockQuantity: 30000 },
  });

  console.log(`✅ Đã xóa ${delHistory.count} bản ghi OrderStatusHistory.`);
  console.log(`✅ Đã xóa ${delReviews.count} đánh giá mẫu.`);
  console.log(`✅ Đã xóa ${delPayments.count} bản ghi Payments.`);
  console.log(`✅ Đã xóa ${delOrders.count} đơn hàng test cũ.`);
  console.log('✨ Database đã sạch sẽ 100%! Bảng OrderStatusHistory đã về 0 dòng.');
  console.log('👉 Bây giờ bạn có thể mở Postman và bấm chạy Runner để tạo dữ liệu minh chứng mới tinh!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi dọn dẹp:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
